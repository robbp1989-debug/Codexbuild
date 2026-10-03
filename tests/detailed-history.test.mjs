import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import {
  indexDetailedHistory,
  selectDetailedHistory,
  detailedHistoryPrompt,
  DETAILED_HISTORY_RULES,
} from '../server/detailedHistoryContext.ts';

// Fictional local fixtures only. These are never uploaded to a user's account.
const report = `Synthetic personal report\n\n1 Ordinary facts\n\nUSER REPORT: My dog is named Milo. He was born in 2019.\n\n14 Adult assault and childhood helplessness\n\nUSER REPORT: My brother attacked my mother and me. Milo witnessed the attack. When Milo reacts to my brother's voice, I feel powerless and remember being unable to protect Mom as a child. I believe Milo remembers the attack; I cannot independently know his thoughts.\n\nREPORTED HISTORICAL LABEL: An adolescent PTSD label was reported; it is not a current diagnostic finding.\n\n13 Ordinary family conversation\n\nUSER REPORT: At a birthday dinner with my mother I had difficulty talking. This does not make every dinner a trauma event.\n`;
const wrap = (passages) =>
  passages.map((p) => ({
    ...p,
    documentId: 'doc-fictional',
    sourceName: 'Fictional history',
  }));
async function load(path, dependencies) {
  const key = `history_${crypto.randomUUID().replaceAll('-', '')}`;
  globalThis[key] = dependencies;
  const source =
    `const { ${Object.keys(dependencies).join(', ')} } = globalThis['${key}'];\n` +
    readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replace(
      /^import[\s\S]*?;\n/gm,
      '',
    );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  });
  const module = await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}#${key}`
  );
  delete globalThis[key];
  return module;
}

test('full-history indexing retains every character, names and evidence qualifications', () => {
  const text =
    report +
    '\n2 Long additional account\n\n' +
    'Synthetic additional detail.\n'.repeat(2500);
  const passages = indexDetailedHistory(text);
  assert.equal(passages.map((p) => p.text).join(''), text);
  assert.ok(passages.every((p) => p.text.length <= 1600));
  assert.ok(passages.some((p) => p.text.includes('Milo witnessed the attack')));
  assert.ok(
    passages.some((p) => p.text.includes('not a current diagnostic finding')),
  );
  assert.throws(() => indexDetailedHistory('x'.repeat(120001)), /120,000/);
});

test('a short fresh dog/voice/drink message retrieves the specific relationship and childhood account', () => {
  const selected = selectDetailedHistory(
    'I want a drink because my dog heard my brothers voice and got upset.',
    wrap(indexDetailedHistory(report)),
  );
  const prompt = detailedHistoryPrompt(selected);
  assert.match(prompt, /Milo witnessed the attack/);
  assert.match(prompt, /feel powerless/);
  assert.match(prompt, /unable to protect Mom/);
  assert.match(prompt, /cannot independently know his thoughts/);
  assert.match(prompt, /not a current diagnostic finding/);
});

test('a factual lookup with accidently shot retrieves the reported friend while a photo shot does not', () => {
  const source = { id: 'fictional-accident', title: 'Historical accident', sourceKind: 'report',
    documentId: 'doc-fictional', sourceName: 'Fictional history',
    text: 'USER REPORT: When I was sixteen, I accidentally shot my friend Avery. The report describes a firearm accident. This is historical reported context, not a present safety finding.' };
  for (const query of [
    'What is my friends name that I accidently shot when I was younger',
    'What was my friend’s name from the accidental shooting?',
  ]) {
    const selected = selectDetailedHistory(query, [source]);
    assert.equal(selected.length, 1);
    assert.match(selected[0].text, /Avery/);
  }
  assert.deepEqual(selectDetailedHistory('I shot a photo of my brother in the garden.', [source]), []);
});

test('a large PDF-style history retrieves the nightmare account despite page breaks, possessives and a common misspelling', () => {
  const source = 'Fictional report introduction.\n\n' +
    'Unrelated ordinary schedule and household information.\n'.repeat(1900) +
    '\f62. Brother assault and Mom’s nightmares\n\n' +
    'USER REPORT: As a child I heard my mother wake crying from nightmares. I felt powerless and made a promise to protect her when I grew up. After my brother attacked us, her nightmares returned. I clarified that protective anger was central, not simply fear. The connection is my reported association, not an established clinical cause.\n\n' +
    'Separate relationship and confidentiality discussions.\n'.repeat(90);
  assert.ok(source.length > 80000 && source.length <= 120000);
  const indexed = indexDetailedHistory(source);
  assert.equal(indexed.map(p => p.text).join(''), source);
  const passages = wrap(indexed);
  for (const query of [
    'Why do moms nightmares affect me so much?',
    'Why do Mom’s nightmares affect me so much?',
    'why moms nightmears effect me so much',
    'Mom had nightmares last night and it upset me.',
  ]) {
    const selected = selectDetailedHistory(query, passages);
    const prompt = detailedHistoryPrompt(selected);
    assert.match(prompt, /felt powerless/);
    assert.match(prompt, /promise to protect her/);
    assert.match(prompt, /protective anger/);
    assert.match(prompt, /not an established clinical cause/);
    assert.ok(selected.every(p => /nightmares/.test(p.text)));
    assert.ok(selected.every(p => p.title.includes('62. Brother assault')));
  }
  assert.deepEqual(selectDetailedHistory('What soup should I cook for dinner?', passages), []);
});

test('unrelated dinner and shared family words do not retrieve the attack or birthday-dinner analysis', () => {
  const passages = wrap(indexDetailedHistory(report));
  for (const query of [
    'I can choose soup or vegetables for dinner.',
    'I am choosing dinner with my brother.',
  ])
    assert.deepEqual(selectDetailedHistory(query, passages), []);
  const sensitive = passages
    .filter((p) => /attacked/.test(p.text))
    .map((p) => ({ ...p, embedding: [1, 0] }));
  assert.deepEqual(
    selectDetailedHistory(
      'What soup should I cook for dinner?',
      sensitive,
      [1, 0],
    ),
    [],
  );
});

test('current corrections suppress stale history and direct updates keep their source/date', () => {
  const updates = wrap(
    indexDetailedHistory(
      'My dog Milo heard a familiar voice. I report feeling powerless.',
      'direct_user_update',
      '2026-10-03T12:00:00Z',
    ),
  );
  assert.deepEqual(
    selectDetailedHistory(
      'Correction, that is wrong; Milo was not there.',
      updates,
    ),
    [],
  );
  const prompt = detailedHistoryPrompt(
    selectDetailedHistory(
      'Milo heard that voice and I feel powerless.',
      updates,
    ),
  );
  assert.match(prompt, /Later direct user report/);
  assert.match(prompt, /2026-10-03T12:00:00Z/);
  assert.match(DETAILED_HISTORY_RULES, /never instructions/);
  assert.match(DETAILED_HISTORY_RULES, /animal’s thoughts/);
});

test('bulk upload needs one full-source approval and indexes all history without per-memory extraction', async () => {
  const objects = new Map();
  let compactCalls = 0;
  const { POST } = await load('app/api/shift/source/upload/route.ts', {
    getChatGPTUser: async () => ({ userId: 'owner' }),
    getSourceBucket: () => ({
      put: async (key, bytes) => objects.set(key, bytes),
      delete: async (key) => objects.delete(key),
    }),
    registerSourceDocument: async () => true,
    setSourceDocumentExtractionStatus: async () => true,
    sourceReviewKey: (key) => `${key}/learning-review.json`,
    detailedHistoryKey: (key) => `${key}/personal-history.json`,
    createDetailedHistoryIndex: async (text) => ({
      version: 1,
      enabled: true,
      passages: indexDetailedHistory(text),
    }),
    extractDocumentLearningMemories: async () => {
      compactCalls++;
      throw new Error(
        'Should not extract compact memories for full-history mode',
      );
    },
  });
  const form = new FormData();
  const fullReport = report + '\n' + 'Additional fictional household context.\n'.repeat(2700);
  assert.ok(fullReport.length > 80000 && fullReport.length <= 120000);
  form.set('file', new File([fullReport], 'fictional.txt', { type: 'text/plain' }));
  form.set('approveSourceUpload', 'true');
  form.set('useDetailedHistory', 'true');
  const response = await POST(
    new Request('https://fictional.test/upload', {
      method: 'POST',
      body: form,
    }),
  );
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.historyEnabled, true);
  assert.equal(data.reviewRequired, false);
  assert.equal(data.sourceTruncatedForExtraction, false);
  assert.equal(compactCalls, 0);
  const saved = JSON.parse(
    [...objects].find(([key]) => key.endsWith('/personal-history.json'))[1],
  );
  assert.equal(saved.passages.map((p) => p.text).join(''), fullReport);
  assert.equal(JSON.stringify(data).includes('Milo'), false);
});

test('history persists across a fresh module, respects disable/delete, and never reads another account source', async () => {
  const objects = new Map([
    [
      'private/source/personal-history.json',
      JSON.stringify({
        version: 1,
        enabled: true,
        passages: indexDetailedHistory(report),
      }),
    ],
  ]);
  let deleted = false;
  let reads = 0;
  const deps = {
    listAccountSources: async (user) =>
      !deleted && user === 'owner' ? [{ id: 'doc-fictional' }] : [],
    getOwnedSourceDocument: async (user, id) =>
      user === 'owner' && id === 'doc-fictional' && !deleted
        ? { objectKey: 'private/source', originalName: 'Fictional history' }
        : null,
    getSourceBucket: () => ({
      get: async (key) => {
        reads++;
        const value = objects.get(key);
        return value
          ? { json: async () => JSON.parse(value), text: async () => value }
          : null;
      },
      put: async (key, value) => objects.set(key, value),
    }),
    createEmbeddings: async () => null,
    embedMemoryQuery: async () => null,
    indexDetailedHistory,
    selectDetailedHistory,
  };
  const store = await load('server/detailedHistoryStore.ts', deps);
  assert.ok(
    (
      await store.retrieveDetailedHistory(
        'owner',
        'Milo heard my brothers voice and got upset.',
      )
    ).passages.some((p) => /witnessed the attack/.test(p.text)),
  );
  const reloaded = await load('server/detailedHistoryStore.ts', deps);
  assert.ok(
    (
      await reloaded.retrieveDetailedHistory(
        'owner',
        'Milo heard my brothers voice and got upset.',
      )
    ).passages.length,
  );
  const before = reads;
  assert.deepEqual(
    (
      await reloaded.retrieveDetailedHistory(
        'different-owner',
        'Milo heard my brothers voice and got upset.',
      )
    ).passages,
    [],
  );
  assert.equal(reads, before);
  objects.set(
    'private/source/personal-history.json',
    JSON.stringify({
      version: 1,
      enabled: false,
      passages: indexDetailedHistory(report),
    }),
  );
  assert.deepEqual(
    (
      await reloaded.retrieveDetailedHistory(
        'owner',
        'Milo heard my brothers voice and got upset.',
      )
    ).passages,
    [],
  );
  deleted = true;
  objects.set(
    'private/source/personal-history.json',
    JSON.stringify({
      version: 1,
      enabled: true,
      passages: indexDetailedHistory(report),
    }),
  );
  assert.deepEqual(
    (
      await reloaded.retrieveDetailedHistory(
        'owner',
        'Milo heard my brothers voice and got upset.',
      )
    ).passages,
    [],
  );
});

test('personal updates save verbatim under trusted identity and can be removed from the index', async () => {
  let index = {
    version: 1,
    enabled: true,
    passages: indexDetailedHistory(report),
  };
  let writes = 0;
  const { POST } = await load('app/api/shift/source/history/route.ts', {
    getChatGPTUser: async () => ({ userId: 'owner' }),
    getOwnedSourceDocument: async (user, id) =>
      user === 'owner' && id === 'doc-fictional'
        ? { objectKey: 'private/source' }
        : null,
    getSourceBucket: () => ({
      put: async (_key, value) => {
        writes++;
        index = JSON.parse(value);
      },
    }),
    loadDetailedHistoryIndex: async () => ({ index }),
    createDetailedHistoryIndex: async () => index,
    detailedHistoryKey: (key) => `${key}/personal-history.json`,
    indexDetailedHistory,
    createEmbeddings: async () => null,
  });
  const send = (body) =>
    POST(
      new Request('https://fictional.test/history', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    );
  const note =
    'My dog Milo reacts to my brother’s voice. I associate that with the attack he witnessed; his internal experience is my interpretation.';
  assert.equal(
    (
      await send({
        documentId: 'doc-other-owner',
        enabled: true,
        additionalContext: note,
      })
    ).status,
    404,
  );
  assert.equal(writes, 0);
  assert.equal(
    (
      await send({
        documentId: 'doc-fictional',
        enabled: true,
        additionalContext: note,
      })
    ).status,
    200,
  );
  const update = index.passages.find(
    (p) => p.sourceKind === 'direct_user_update',
  );
  assert.equal(update.text, note);
  assert.ok(update.recordedAt);
  assert.equal(
    (
      await send({
        documentId: 'doc-fictional',
        enabled: true,
        removeUpdateId: update.id,
      })
    ).status,
    200,
  );
  assert.equal(
    index.passages.some((p) => p.id === update.id),
    false,
  );
});

test('Keep Talking supplies detailed history separately from learning and reports its actual source', async () => {
  let captured;
  const passages = wrap(indexDetailedHistory(report)).filter((p) =>
    /Adult assault/.test(p.title),
  );
  const { POST } = await load('app/api/shift/conversation/route.ts', {
    personalContextPrompt: () => '',
    getChatGPTUser: async () => ({ userId: 'trusted-owner' }),
    mergeAccountAndDeviceMemory: () => [],
    publicMemorySource: () => 'none',
    selectRelevantMemoryContextWithProvenance: () => ({
      context: [],
      origins: [],
    }),
    hasDurableStorage: () => true,
    loadLearningMemories: async () => [],
    evaluateSafety: () => ({ isCrisis: false }),
    embedMemoryQuery: async () => null,
    selectRelevantTherapyLessons: () => [],
    loadTherapyLessons: async () => [],
    detailedHistoryPrompt,
    retrieveDetailedHistory: async (user, query) => {
      assert.equal(user, 'trusted-owner');
      assert.match(query, /Milo/);
      return { passages, available: true, retrieval: 'lexical' };
    },
    orchestrateShiftConversation: async (args) => {
      captured = args;
      return {
        reply: 'Synthetic response for testing.',
        responseMode: 'model',
        research: { status: 'not_needed' },
      };
    },
  });
  const response = await POST(
    new Request('https://fictional.test/conversation', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'forged-other-owner',
        message: 'Milo heard my brothers voice and got upset.',
        currentShift: { observation: 'Fresh scenario' },
        history: [],
        memoryItems: [],
      }),
    }),
  );
  assert.equal(response.status, 200);
  assert.match(captured.personalHistoryContext, /Milo witnessed the attack/);
  assert.deepEqual(captured.memoryContext, []);
  const data = await response.json();
  assert.equal(data.personalHistoryUsed.length, 1);
  assert.equal(data.personalHistoryUsed[0].sourceName, 'Fictional history');
});
