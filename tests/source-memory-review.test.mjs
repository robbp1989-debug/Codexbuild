import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';
import { selectRelevantMemoryContext } from '../server/memoryContext.ts';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
async function load(path, dependencies) {
  const key = `shift_review_${crypto.randomUUID().replaceAll('-', '')}`;
  globalThis[key] = dependencies;
  const source =
    `const { ${Object.keys(dependencies).join(', ')} } = globalThis['${key}'];\n` +
    read(path).replace(/^import[\s\S]*?;\n/gm, '');
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
const candidate = {
  type: 'BOUNDARY',
  label: 'Fictional storm boundary',
  summary:
    'I report that storm sounds remind me of earlier uncertainty; this does not establish current danger or a clinical cause.',
  tags: ['storm', 'sounds', 'boundary'],
  confidence: 'user_confirmed',
};
function uploadRequest(
  approved = true,
  text = 'Synthetic report for private-source testing.',
) {
  const form = new FormData();
  form.set(
    'file',
    new File([text], 'fictional-report.txt', { type: 'text/plain' }),
  );
  if (approved) form.set('approveSourceUpload', 'true');
  return new Request('https://fictional.test/api/shift/source/upload', {
    method: 'POST',
    body: form,
  });
}
function uploadFixture(overrides = {}) {
  const objects = new Map();
  const events = [];
  return {
    objects,
    events,
    dependencies: {
      getChatGPTUser: async () => ({ userId: 'test-owner' }),
      getSourceBucket: () => ({
        put: async (key, value) => objects.set(key, value),
        delete: async (key) => objects.delete(key),
      }),
      registerSourceDocument: async (args) => {
        events.push(['register', args]);
        return true;
      },
      sourceReviewKey: (key) => `${key}/learning-review.json`,
      setSourceDocumentExtractionStatus: async (...args) => {
        events.push(['status', ...args]);
        return true;
      },
      extractDocumentLearningMemories: async (text) => {
        events.push(['extract', text]);
        return { memories: [candidate], truncated: false };
      },
      ...overrides,
    },
  };
}

test('private upload requires trusted identity and explicit full-source approval', async () => {
  for (const signedIn of [false, true]) {
    const fixture = uploadFixture({
      getChatGPTUser: async () => (signedIn ? { userId: 'test-owner' } : null),
    });
    const { POST } = await load(
      'app/api/shift/source/upload/route.ts',
      fixture.dependencies,
    );
    const response = await POST(uploadRequest(false));
    assert.equal(response.status, signedIn ? 400 : 401);
    assert.equal(fixture.objects.size, 0);
    assert.equal(fixture.events.length, 0);
  }
});

test('full source upload stores bytes and reloadable drafts without creating active learning', async () => {
  const text = 'Entire synthetic source paragraph.\n'.repeat(1600);
  const fixture = uploadFixture();
  const { POST } = await load(
    'app/api/shift/source/upload/route.ts',
    fixture.dependencies,
  );
  const response = await POST(uploadRequest(true, text));
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.stored, true);
  assert.equal(data.reviewRequired, true);
  assert.equal(data.memoriesPersisted, 0);
  assert.equal(data.sourceTruncatedForExtraction, false);
  assert.equal(fixture.events.find((e) => e[0] === 'extract')[1], text);
  assert.equal(fixture.objects.size, 2);
  const [rawKey, rawBytes] = [...fixture.objects][0];
  assert.equal(new TextDecoder().decode(rawBytes), text);
  assert.deepEqual(
    JSON.parse(fixture.objects.get(`${rawKey}/learning-review.json`)).memories,
    [candidate],
  );
  assert.equal(
    JSON.stringify(data).includes('Entire synthetic source paragraph'),
    false,
  );
});

test('metadata failure removes orphaned source bytes and never extracts learning', async () => {
  const fixture = uploadFixture({ registerSourceDocument: async () => false });
  const { POST } = await load(
    'app/api/shift/source/upload/route.ts',
    fixture.dependencies,
  );
  assert.equal((await POST(uploadRequest())).status, 500);
  assert.equal(fixture.objects.size, 0);
  assert.equal(fixture.events.length, 0);
});

test('failed extraction retains only the approved source and reports no saved learning', async () => {
  const fixture = uploadFixture({
    extractDocumentLearningMemories: async () => {
      throw new Error('Synthetic extraction outage');
    },
  });
  const { POST } = await load(
    'app/api/shift/source/upload/route.ts',
    fixture.dependencies,
  );
  const response = await POST(uploadRequest());
  const data = await response.json();
  assert.equal(response.status, 202);
  assert.equal(data.stored, true);
  assert.equal(data.extractionStatus, 'failed');
  assert.equal(fixture.objects.size, 1);
  assert.equal(data.memories, undefined);
});

test('private review uses account ownership and returns drafts without raw source bytes', async () => {
  let reads = 0;
  for (const own of [false, true]) {
    const { GET } = await load('app/api/shift/source/review/route.ts', {
      getChatGPTUser: async () => ({ userId: 'test-owner' }),
      getOwnedSourceDocument: async (owner, id) => {
        assert.equal(owner, 'test-owner');
        assert.equal(id, 'doc-test');
        return own ? { objectKey: 'private/test' } : null;
      },
      getSourceBucket: () => ({
        get: async (key) => {
          reads++;
          assert.equal(key, 'private/test/learning-review.json');
          return {
            json: async () => ({ memories: [candidate], truncated: false }),
          };
        },
      }),
      sourceReviewKey: (key) => `${key}/learning-review.json`,
    });
    const response = await GET(
      new Request(
        'https://fictional.test/api/shift/source/review?documentId=doc-test',
      ),
    );
    assert.equal(response.status, own ? 200 : 404);
    if (own) {
      assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
      assert.deepEqual((await response.json()).memories, [candidate]);
    }
  }
  assert.equal(reads, 1);
});

test('explicit document Remember requires ownership and preserves document provenance', async () => {
  let saves = 0;
  const { POST } = await load('app/api/shift/memory/remember/route.ts', {
    getChatGPTUser: async () => ({ userId: 'test-owner' }),
    getOwnedSourceDocument: async (owner, id) =>
      owner === 'test-owner' && id === 'doc-owned' ? { id } : null,
    saveLearningMemory: async (...args) => {
      saves++;
      assert.deepEqual(args, [
        'test-owner',
        'doc-owned',
        candidate,
        'document',
      ]);
      return 'mem-test';
    },
  });
  const send = (body) =>
    POST(
      new Request('https://fictional.test/api/shift/memory/remember', {
        method: 'POST',
        body: JSON.stringify({
          sourceKind: 'document',
          memory: candidate,
          ...body,
        }),
      }),
    );
  assert.equal((await send({ sourceId: 'doc-owned' })).status, 400);
  assert.equal(
    (await send({ sourceId: 'doc-other', userConfirmed: true })).status,
    404,
  );
  assert.equal(saves, 0);
  assert.deepEqual(
    await (await send({ sourceId: 'doc-owned', userConfirmed: true })).json(),
    { persisted: true, id: 'mem-test' },
  );
  assert.equal(saves, 1);
});

test('review approval does not promote hypotheses or hypothetical outcomes into confirmed learning', async () => {
  let saves = 0;
  const { POST } = await load('app/api/shift/memory/remember/route.ts', {
    getChatGPTUser: async () => ({ userId: 'test-owner' }),
    getOwnedSourceDocument: async () => ({ id: 'doc-owned' }),
    saveLearningMemory: async () => {
      saves++;
      return 'mem-test';
    },
  });
  for (const type of ['WORKING_HYPOTHESIS', 'HELPFUL_STRATEGY', 'OUTCOME']) {
    const response = await POST(
      new Request('https://fictional.test/api/shift/memory/remember', {
        method: 'POST',
        body: JSON.stringify({
          sourceKind: 'document',
          sourceId: 'doc-owned',
          userConfirmed: true,
          memory: { ...candidate, type },
        }),
      }),
    );
    assert.equal(response.status, 400);
  }
  assert.equal(saves, 0);
});

test('source ownership query excludes other accounts and deleted sources', async () => {
  const database = new DatabaseSync(':memory:');
  database.exec(
    'CREATE TABLE source_documents(id TEXT, user_id TEXT, r2_object_key TEXT, original_name TEXT, content_type TEXT, byte_size INTEGER, extraction_status TEXT, deleted_at TEXT)',
  );
  database.exec(
    "INSERT INTO source_documents VALUES ('doc-owned','owner','private/key','fictional.txt','text/plain',15,'completed',NULL),('doc-deleted','owner','private/deleted','deleted.txt','text/plain',15,'completed','yesterday')",
  );
  try {
    const { getOwnedSourceDocument } = await load('server/persistence.ts', {
      env: {
        DB: {
          prepare: (sql) => ({
            bind: (...args) => ({
              first: async () => database.prepare(sql).get(...args),
            }),
          }),
        },
      },
      deleteMemoryEmbedding: async () => {},
      loadMemoryEmbeddings: async () => [],
      upsertMemoryEmbeddings: async () => {},
    });
    assert.equal(
      (await getOwnedSourceDocument('owner', 'doc-owned')).originalName,
      'fictional.txt',
    );
    assert.equal(
      await getOwnedSourceDocument('other-account', 'doc-owned'),
      null,
    );
    assert.equal(await getOwnedSourceDocument('owner', 'doc-deleted'), null);
  } finally {
    database.close();
  }
});

function d1Fixture(database) {
  return {
    prepare(sql) {
      const statement = database.prepare(sql);
      let values = [];
      const query = {
        bind(...args) {
          values = args;
          return query;
        },
        async first() {
          return statement.get(...values) || null;
        },
        async all() {
          return { results: statement.all(...values) };
        },
        async run() {
          const result = statement.run(...values);
          return { success: true, meta: { changes: result.changes } };
        },
      };
      return query;
    },
    async batch(queries) {
      return Promise.all(queries.map((query) => query.run()));
    },
  };
}

test('approved learning survives a fresh account read, stays relevant, and source deletion removes drafts and influence', async () => {
  const database = new DatabaseSync(':memory:');
  const journal = JSON.parse(read('drizzle/meta/_journal.json'));
  for (const { tag } of journal.entries)
    database.exec(read(`drizzle/${tag}.sql`));
  const objects = new Map();
  const env = {
    DB: d1Fixture(database),
    FILES: { delete: async (key) => objects.delete(key) },
  };
  const dependencies = {
    env,
    deleteMemoryEmbedding: async () => {},
    loadMemoryEmbeddings: async () => new Map(),
    upsertMemoryEmbeddings: async () => {},
  };
  try {
    const persistence = await load('server/persistence.ts', dependencies);
    await persistence.registerSourceDocument({
      userId: 'test-owner',
      documentId: 'doc-test',
      objectKey: 'private/test',
      originalName: 'fictional.txt',
      contentType: 'text/plain',
      byteSize: 20,
    });
    objects.set(
      'private/test',
      'Synthetic private source; never reusable context',
    );
    objects.set(
      persistence.sourceReviewKey('private/test'),
      JSON.stringify({ memories: [candidate] }),
    );
    const { POST } = await load('app/api/shift/memory/remember/route.ts', {
      getChatGPTUser: async () => ({ userId: 'test-owner' }),
      getOwnedSourceDocument: persistence.getOwnedSourceDocument,
      saveLearningMemory: persistence.saveLearningMemory,
    });
    const response = await POST(
      new Request('https://fictional.test/api/shift/memory/remember', {
        method: 'POST',
        body: JSON.stringify({
          sourceKind: 'document',
          sourceId: 'doc-test',
          userConfirmed: true,
          memory: candidate,
        }),
      }),
    );
    assert.equal((await response.json()).persisted, true);
    // A new module/account read replaces UI state, as after a reload.
    const reloaded = await load('server/persistence.ts', dependencies);
    const memories = await reloaded.loadLearningMemories('test-owner');
    assert.equal(memories.length, 1);
    assert.equal(memories[0].sourceKind, 'document');
    assert.equal(
      selectRelevantMemoryContext(
        'Storm sounds are upsetting me today.',
        memories,
      ).length,
      1,
    );
    assert.deepEqual(
      selectRelevantMemoryContext(
        'I can choose tomato soup or vegetables for dinner.',
        memories,
      ),
      [],
    );
    assert.deepEqual(await reloaded.loadLearningMemories('different-user'), []);
    const controls = await load('server/accountMemoryControls.ts', {
      env,
      archiveLearningMemory: persistence.archiveLearningMemory,
      getSourceBucket: () => env.FILES,
      sourceReviewKey: persistence.sourceReviewKey,
      deleteMemoryEmbedding: async () => {},
    });
    assert.equal(
      await controls.deleteAccountSource({
        userId: 'test-owner',
        documentId: 'doc-test',
        deleteLearning: true,
      }),
      true,
    );
    assert.equal(objects.size, 0);
    assert.deepEqual(
      selectRelevantMemoryContext(
        'Storm sounds are upsetting me today.',
        await reloaded.loadLearningMemories('test-owner'),
      ),
      [],
    );
    assert.equal(
      await reloaded.getOwnedSourceDocument('test-owner', 'doc-test'),
      null,
    );
  } finally {
    database.close();
  }
});

test('one-time extraction covers a complete long report while preserving uncertain hypothesis status', async () => {
  const prompts = [];
  const text =
    'Synthetic source paragraph without actual personal events.\n\n'.repeat(
      800,
    );
  const { extractDocumentLearningMemories } = await load(
    'server/documentExtraction.ts',
    {
      PRIMARY_MODEL: 'synthetic-model',
      FALLBACK_MODELS: [],
      process: { env: { OPENAI_API_KEY: 'synthetic-fixture-only' } },
      fetch: async (_url, request) => {
        const body = JSON.parse(request.body);
        prompts.push(body.messages);
        return Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  memories: [{ ...candidate, type: 'WORKING_HYPOTHESIS' }],
                }),
              },
            },
          ],
        });
      },
    },
  );
  const result = await extractDocumentLearningMemories(text);
  assert.equal(result.truncated, false);
  assert.ok(prompts.length >= 3);
  const chunks = prompts.map(
    (messages) =>
      messages[1].content
        .split('--- BEGIN UNTRUSTED SOURCE DATA ---\n')[1]
        .split('\n--- END UNTRUSTED SOURCE DATA ---')[0],
  );
  assert.equal(chunks.join(''), text.trim());
  assert.ok(result.memories.every((memory) => memory.confidence === 'working'));
  for (const messages of prompts) {
    assert.match(
      messages[0].content,
      /reported historical diagnostic labels are not current diagnoses/,
    );
    assert.match(
      messages[0].content,
      /Hypothetical verification scenarios are not genuine events/,
    );
    assert.match(
      messages[0].content,
      /Exclude therapist or professional lessons/,
    );
  }
});
