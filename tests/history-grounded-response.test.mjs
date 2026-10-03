import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

await mkdir('node_modules/.cache', { recursive: true });
const dir = await mkdtemp(resolve('node_modules/.cache/history-response-'));
await build({ entryPoints: ['server/historyGrounding.ts', 'server/shiftConversationOrchestrator.ts'],
  bundle: true, platform: 'node', format: 'esm', outdir: dir });
const { validateHistoryGrounding, requiresHistoryGrounding } = await import(pathToFileURL(join(dir, 'historyGrounding.js')));
const { orchestrateShiftConversation } = await import(pathToFileURL(join(dir, 'shiftConversationOrchestrator.js')));

// Fictional local fixtures; never account memory or genuine events.
const passage = { id: 'report-62-0', documentId: 'doc-fictional', sourceName: 'Fictional history',
  title: 'Mother’s nightmares and a childhood promise', sourceKind: 'report',
  text: 'USER REPORT: My mother woke crying from nightmares about my father. As a child I felt powerless and made a promise to protect her when I grew up. Her nightmares returned after my brother’s attack. My later clarification was that protective anger was central. This is my reported association, not a proven clinical cause.' };
const reply = 'You previously described your mother waking from nightmares about your father. You felt powerless as a child and made a promise to protect her when you grew up. You later reported that the nightmares returned after your brother’s attack, and clarified that protective anger was central. Those are associations you already reported; they may help explain why hearing her cry matters to you now.';
const claim = { documentId: passage.documentId, passageId: passage.id, sourceExcerpt: passage.text, replyExcerpt: reply };
const generic = 'It could be related to fear, helplessness, or needing to protect her. I cannot determine the exact reason. What do you feel now?';
const args = { currentShift: { observation: 'An earlier fictional friend did not reply.', updated_perspective: 'A delay gives incomplete information.' },
  userMessage: 'Can you tell me why my mom crying might bring up bad memories from my childhood',
  history: [{ role: 'user', content: 'A prior fictional conversation turn.' }],
  memoryContext: ['[BOUNDARY] Do not manufacture unknown memories.'],
  personalContext: 'A relevant approved preference.',
  personalHistoryContext: `QUOTED SOURCE DATA\n${JSON.stringify({ documentId: passage.documentId, passageId: passage.id, passage: passage.text })}`,
  personalHistoryUsed: [passage], personalHistoryPassages: [passage] };

test('specific reported details validate, while a generic answer cannot claim it used the history', () => {
  const result = validateHistoryGrounding(reply, [claim], [passage]);
  assert.equal(result.passed, true);
  assert.equal(result.references[0].sourceName, passage.sourceName);
  assert.equal(result.references[0].sourceExcerpt, passage.text);
  assert.equal(validateHistoryGrounding(generic, [{ ...claim, replyExcerpt: generic }], [passage]).passed, false);
  assert.equal(validateHistoryGrounding(generic, null, [passage]).passed, false);
  const qualificationsOnly = 'This is my reported association, not a proven clinical cause.';
  assert.equal(validateHistoryGrounding(qualificationsOnly, [{ ...claim, replyExcerpt: qualificationsOnly }], [passage]).passed, false);
});

test('references cannot use fabricated source text, unrelated IDs or words absent from the displayed answer', () => {
  for (const forged of [
    { ...claim, documentId: 'another-owner-source' },
    { ...claim, passageId: 'deleted-passage' },
    { ...claim, sourceExcerpt: 'A fabricated account says my father and brother planned this together.' },
    { ...claim, replyExcerpt: 'Words about father and nightmares that are absent from the answer.' },
  ]) assert.equal(validateHistoryGrounding(reply, [forged], [passage]).passed, false);
  assert.equal(validateHistoryGrounding(reply, [claim], []).passed, false);
});

test('brief ordinary facts such as a pet’s name and birth year can be acknowledged without padding the answer', () => {
  for (const [sourceExcerpt, answer] of [
    ['My dog is named Milo.', 'Your dog’s name is Milo.'],
    ['Milo was born in 2019.', 'Milo was born in 2019.'],
  ]) {
    const source = { ...passage, text: sourceExcerpt };
    assert.equal(validateHistoryGrounding(answer, [{ ...claim, sourceExcerpt, replyExcerpt: answer }], [source]).passed, true);
  }
});

test('history acknowledgment respects witness mode, an explicit opt-out and absent relevant history', () => {
  assert.equal(requiresHistoryGrounding(args.userMessage, 'UNDERSTAND', [passage]), true);
  assert.equal(requiresHistoryGrounding('Just listen to me.', 'WITNESS', [passage]), false);
  assert.equal(requiresHistoryGrounding('Please do not mention my past.', 'UNDERSTAND', [passage]), false);
  assert.equal(requiresHistoryGrounding('What soup should I cook?', 'UNDERSTAND', []), false);
});

async function withModel(outputs, run) {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.OPENAI_API_KEY;
  const previousWarn = console.warn;
  const calls = [];
  process.env.OPENAI_API_KEY = 'fictional-test-key';
  console.warn = () => {};
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/chat/completions');
    calls.push(JSON.parse(options.body));
    assert.ok(outputs.length, 'Only one revision is allowed');
    return Response.json({ choices: [{ message: { content: JSON.stringify(outputs.shift()) } }] });
  };
  try { await run(calls); }
  finally { globalThis.fetch = previousFetch; console.warn = previousWarn;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey; }
}

test('a generic draft is revised into a specific history answer using all original conversation context', async () => {
  await withModel([{ reply: generic, memorySuggestion: null, therapyLessonSuggestion: null },
    { reply, historyGrounding: [claim] }], async calls => {
    const result = await orchestrateShiftConversation(args);
    assert.equal(calls.length, 2);
    assert.equal(result.responseMode, 'model');
    assert.equal(result.reply, reply);
    assert.equal(result.personalHistoryReferences.length, 1);
    assert.match(result.personalHistoryReferences[0].replyExcerpt, /promise to protect/);
    for (const request of calls) {
      assert.equal(request.response_format.type, 'json_object');
      const input = request.messages[1].content;
      assert.match(input, /A prior fictional conversation turn/);
      assert.match(input, /A relevant approved preference/);
      assert.match(input, /Do not manufacture unknown memories/);
      assert.match(input, /not a proven clinical cause/);
      assert.match(request.messages[0].content, /does not erase history the user has already explicitly reported/);
    }
    assert.equal(result.memorySuggestion, null);
    assert.equal(result.therapyLessonSuggestion, null);
  });
});

test('a valid specific first answer needs no extra call', async () => {
  await withModel([{ reply, historyGrounding: [claim] }], async calls => {
    const result = await orchestrateShiftConversation(args);
    assert.equal(calls.length, 1);
    assert.equal(result.responseMode, 'model');
    assert.equal(result.personalHistoryReferences[0].sourceExcerpt, passage.text);
  });
});

test('specific answers survive missing or overlong citation metadata without another model call', async () => {
  for (const historyGrounding of [undefined, [{ ...claim, sourceExcerpt: `${passage.text} `.repeat(3) }]]) {
    await withModel([{ reply, historyGrounding }, { reply, historyGrounding }], async calls => {
      const result = await orchestrateShiftConversation(args);
      assert.equal(result.responseMode, 'model');
      assert.equal(result.reply, reply);
      assert.equal(calls.length, 1);
      assert.ok(result.personalHistoryReferences.length);
      for (const reference of result.personalHistoryReferences) {
        assert.ok(passage.text.includes(reference.sourceExcerpt));
        assert.ok(reply.includes(reference.replyExcerpt));
        assert.ok(reference.sourceExcerpt.length <= 450);
        assert.ok(reference.replyExcerpt.length <= 700);
      }
    });
  }
});

test('a one-name factual recall reply is supported by the actual selected account source', async () => {
  const source = { ...passage, id: 'fictional-friend', title: 'Fictional adolescent accident',
    text: 'USER REPORT: My friend was named Avery. I described an accident when we were sixteen.' };
  await withModel([{ reply: 'Avery.' }, { reply: 'Avery.' }], async calls => {
    const result = await orchestrateShiftConversation({ ...args,
      userMessage: 'What was the name of my friend from that accident?',
      personalHistoryUsed: [source], personalHistoryPassages: [source],
      personalHistoryContext: JSON.stringify(source) });
    assert.equal(result.responseMode, 'model');
    assert.equal(result.reply, 'Avery.');
    assert.equal(calls.length, 1);
    assert.equal(result.personalHistoryReferences[0].documentId, source.documentId);
    assert.match(result.personalHistoryReferences[0].sourceExcerpt, /Avery/);
  });
});

test('a missing factual detail is acknowledged without inventing a name or blocking the conversation', async () => {
  await withModel([{ reply: 'I do not see that name in the retrieved passages, so I will not guess.',
    historyAnswerStatus: 'not_found' }, { reply: generic }], async calls => {
    const result = await orchestrateShiftConversation({ ...args,
      userMessage: 'What was the name of my friend from that accident?' });
    assert.equal(result.responseMode, 'model');
    assert.match(result.reply, /do not see|don.t see/);
    assert.doesNotMatch(result.reply, /please retry|Avery|Milo/);
    assert.equal(calls.length, 1);
    assert.deepEqual(result.personalHistoryReferences, []);
    assert.equal(result.influence.personalHistory.count, 0);
    assert.equal(result.memorySuggestion, null);
  });
});

test('a not-found flag cannot excuse ignoring history during a personal explanation', async () => {
  await withModel([{ reply: generic, historyAnswerStatus: 'not_found' },
    { reply: generic, historyAnswerStatus: 'not_found' }], async () => {
    const result = await orchestrateShiftConversation(args);
    assert.equal(result.responseMode, 'unavailable');
    assert.equal(result.unavailableReason, 'history_grounding');
  });
});

test('a missing-detail flag cannot bypass diagnosis checks or turn a guessed name into source evidence', async () => {
  for (const answer of [
    'I do not see that name in the retrieved passages. You clearly have PTSD.',
    'Morgan.',
  ]) {
    await withModel([{ reply: answer, historyAnswerStatus: 'not_found' },
      { reply: answer, historyAnswerStatus: 'not_found' }], async () => {
      const result = await orchestrateShiftConversation({ ...args,
        userMessage: 'What was the name of my friend from that accident?' });
      assert.equal(result.responseMode, 'unavailable');
      assert.deepEqual(result.personalHistoryReferences, undefined);
    });
  }
});

test('consecutive factual and related turns keep working while an unrelated turn uses no history', async () => {
  const source = { ...passage, id: 'fictional-friend', title: 'Fictional adolescent accident',
    text: 'USER REPORT: My friend was named Avery. I described an accident when we were sixteen.' };
  const inputs = [
    { ...args },
    { ...args, userMessage: 'What was the name of my friend from that accident?',
      personalHistoryContext: JSON.stringify(source), personalHistoryUsed: [source], personalHistoryPassages: [source] },
    { ...args, userMessage: 'What was the name of my friend from that accident?' },
    { ...args, userMessage: 'I want a quick dinner with carrots.', personalHistoryContext: '',
      personalHistoryUsed: [], personalHistoryPassages: [] },
  ];
  const missing = 'I do not see that name in the retrieved passages, so I will not guess.';
  const dinner = 'Carrot soup with toast is a quick option.';
  await withModel([{ reply }, { reply: 'Avery.' }, { reply: missing, historyAnswerStatus: 'not_found' },
    { reply: dinner }], async calls => {
    const history = [];
    for (const input of inputs) {
      const result = await orchestrateShiftConversation({ ...input, history });
      assert.equal(result.responseMode, 'model');
      history.push({ role: 'user', content: input.userMessage }, { role: 'assistant', content: result.reply });
      if (input.userMessage.includes('dinner')) {
        assert.equal(result.reply, dinner);
        assert.deepEqual(result.personalHistoryReferences, []);
        assert.equal(result.influence.personalHistory.count, 0);
      }
    }
    assert.equal(calls.length, 4);
  });
});

test('repeatedly ignoring retrieved history is labeled as a history-use failure rather than a network failure', async () => {
  await withModel([{ reply: generic }, { reply: generic }], async calls => {
    const result = await orchestrateShiftConversation(args);
    assert.equal(calls.length, 2);
    assert.equal(result.responseMode, 'unavailable');
    assert.equal(result.unavailableReason, 'history_grounding');
    assert.match(result.reply, /report passages were retrieved/);
    assert.doesNotMatch(result.reply, /could not be reached|temporarily unavailable/);
    assert.equal(result.memorySuggestion, null);
  });
});

test('history citations do not weaken checks against unsafe certainty or unsupported diagnosis', async () => {
  const unsafe = `${reply} You clearly have PTSD.`;
  await withModel([{ reply: unsafe, historyGrounding: [{ ...claim, replyExcerpt: reply }] },
    { reply: unsafe, historyGrounding: [{ ...claim, replyExcerpt: reply }] }], async () => {
    const result = await orchestrateShiftConversation(args);
    assert.equal(result.responseMode, 'unavailable');
    assert.equal(result.unavailableReason, 'quality_guard');
  });
});

test.after(() => rm(dir, { recursive: true, force: true }));
