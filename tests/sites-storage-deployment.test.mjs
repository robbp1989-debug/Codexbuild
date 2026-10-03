import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const journal = JSON.parse(read('drizzle/meta/_journal.json'));
const migrations = journal.entries.map(({ tag }) => read(`drizzle/${tag}.sql`));
const requiredTables = [
  'users', 'learning_memories', 'source_documents', 'learning_evidence',
  'learning_memory_embeddings', 'therapy_lessons', 'user_patterns', 'continuity_artifacts',
];

test('the published migration journal provisions every storage readiness table', () => {
  const db = new DatabaseSync(':memory:');
  try {
    for (const migration of migrations) db.exec(migration);
    const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(({ name }) => name));
    for (const table of requiredTables) assert.ok(tables.has(table), `Missing packaged table: ${table}`);
    assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
  } finally { db.close(); }
});

test('appended migrations preserve existing learning and enforce lesson lineage and user ownership', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(migrations[0]);
    db.exec("INSERT INTO users(id) VALUES ('test-user')");
    db.exec("INSERT INTO learning_memories(id,user_id,memory_type,label,summary) VALUES ('remembered','test-user','BOUNDARY','Work boundary','Synthetic retained learning')");
    for (const migration of migrations.slice(1)) db.exec(migration);
    assert.equal(db.prepare("SELECT summary FROM learning_memories WHERE id='remembered'").get().summary, 'Synthetic retained learning');
    db.exec("INSERT INTO therapy_lessons(id,user_id,title,source_type,lesson_summary,user_confirmed) VALUES ('lesson-1','test-user','Test lesson','therapist','Synthetic lesson',1)");
    db.exec("INSERT INTO therapy_lessons(id,user_id,title,source_type,lesson_summary,supersedes_lesson_id) VALUES ('lesson-2','test-user','Revised test lesson','therapist','Synthetic revision','lesson-1')");
    assert.equal(db.prepare("SELECT supersedes_lesson_id FROM therapy_lessons WHERE id='lesson-2'").get().supersedes_lesson_id, 'lesson-1');
    assert.throws(() => db.exec("INSERT INTO continuity_artifacts(id,user_id,artifact_json) VALUES ('invalid','unknown-user','{}')"), /FOREIGN KEY/);
    assert.throws(() => db.exec("INSERT INTO therapy_lessons(id,user_id,title,source_type,lesson_summary) VALUES ('invalid','test-user','Invalid','made-up-source','Invalid')"), /CHECK/);
    db.exec("DELETE FROM users WHERE id='test-user'");
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM learning_memories').get().count, 0);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM therapy_lessons').get().count, 0);
  } finally { db.close(); }
});

// Execute the production self-test logic against SQLite-backed D1 and an
// in-memory R2 fixture. Only platform imports are replaced; this is local
// behavior coverage, not a claim of authenticated hosted verification.
async function loadSelfTest(db, objects) {
  globalThis.__shiftStorageFixture = {
    DB: { prepare(sql) {
      const statement = db.prepare(sql);
      let values = [];
      const query = {
        bind(...args) { values = args; return query; },
        async all() { return { results: statement.all(...values) }; },
        async first() { return statement.get(...values) || null; },
        async run() { return statement.run(...values); },
      };
      return query;
    } },
    FILES: {
      async put(key, value) { objects.set(key, value); },
      async get(key) { return objects.has(key) ? { async text() { return objects.get(key); } } : null; },
      async delete(key) { objects.delete(key); },
    },
  };
  let source = read('server/storageSelfTest.ts');
  source = source.replace("import { env } from 'cloudflare:workers';", 'const env = globalThis.__shiftStorageFixture;');
  source = source.replace("import { ensureUser } from './persistence';", "async function ensureUser(id) { await env.DB.prepare('INSERT OR IGNORE INTO users(id) VALUES (?)').bind(id).run(); }");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}#${crypto.randomUUID()}`);
}

test('binding and schema inspection cannot report completed storage round trips', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    for (const migration of migrations) db.exec(migration);
    const module = await loadSelfTest(db, new Map());
    const result = await module.inspectStorageReadiness('test-user');
    assert.equal(result.d1SchemaReady, true);
    assert.equal(result.r2Binding, true);
    assert.equal(result.d1RoundTrip, false);
    assert.equal(result.r2RoundTrip, false);
    assert.equal(result.ready, false);
  } finally { db.close(); delete globalThis.__shiftStorageFixture; }
});

test('reversible storage test verifies D1 and R2 and removes synthetic records', async () => {
  const db = new DatabaseSync(':memory:');
  const objects = new Map();
  try {
    for (const migration of migrations) db.exec(migration);
    const module = await loadSelfTest(db, objects);
    const result = await module.runStorageRoundTripSelfTest('test-user');
    assert.equal(result.ready, true);
    assert.equal(result.d1RoundTrip, true);
    assert.equal(result.r2RoundTrip, true);
    assert.equal(result.cleanupSucceeded, true);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM learning_memories').get().count, 0);
    assert.equal(objects.size, 0);
  } finally { db.close(); delete globalThis.__shiftStorageFixture; }
});
