import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const migration = read('migrations/0001_learning_memory.sql');
const semanticMigration = read('migrations/0002_semantic_memory.sql');
const retrieval = read('server/memoryContext.ts');
const persistence = read('server/persistence.ts');
const semanticMemory = read('server/semanticMemory.ts');
const breakdownRoute = read('app/api/shift/breakdown/route.ts');
const conversationRoute = read('app/api/shift/conversation/route.ts');
const sourceUpload = read('app/api/shift/source/upload/route.ts');
const rememberRoute = read('app/api/shift/memory/remember/route.ts');
const evidenceRoute = read('app/api/shift/evidence/route.ts');
const aiClient = read('server/aiClient.ts');
const selfTest = read('server/storageSelfTest.ts');
const chatgptAuth = read('app/chatgpt-auth.ts');

for (const table of ['users', 'learning_memories', 'source_documents', 'learning_evidence']) {
  assert(migration.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `Missing required D1 table: ${table}`);
}

assert(retrieval.includes('REJECTED_HYPOTHESIS'), 'Rejected hypotheses must remain available as negative evidence.');
assert(retrieval.includes("item.status !== 'archived'"), 'Archived learning must be excluded from retrieval.');
assert(!retrieval.includes("item.status !== 'rejected'"), 'Rejected hypotheses must not be globally filtered out.');
assert(retrieval.includes('evidenceBonus'), 'Real-world evidence must affect memory ranking.');
assert(retrieval.includes('confidenceBonus'), 'User confirmation must affect memory ranking.');
assert(retrieval.includes('SEMANTIC_RELEVANCE_THRESHOLD'), 'Semantic memory recall must have an explicit relevance threshold.');
assert(retrieval.includes('overlap > 0 || semantic >= SEMANTIC_RELEVANCE_THRESHOLD'), 'Historical learning must cross a lexical or semantic relevance gate.');
assert(retrieval.includes('if (!queryTokens.size && !safeQueryEmbedding) return []'), 'Content-free situations must not trigger arbitrary memory recall.');
assert(!retrieval.match(/CONFIRMED_FACT\s*:/), 'Raw confirmed-event facts must not be a reusable retrieval type.');
assert(!retrieval.match(/USER_INTERPRETATION\s*:/), 'Raw interpretations must not be a reusable retrieval type.');

for (const route of [breakdownRoute, conversationRoute]) {
  assert(route.includes('loadLearningMemories'), 'Reflection paths must retrieve durable account learning.');
  assert(route.includes('selectRelevantMemoryContext'), 'Reflection paths must select only relevant compact learning.');
  assert(route.includes('embedMemoryQuery'), 'Reflection paths must support semantic query retrieval when vectors exist.');
  assert(route.includes("memoryRetrieval: queryEmbedding ? 'semantic_and_lexical' : 'lexical'"), 'Reflection paths must expose whether semantic retrieval actually ran.');
}

assert(semanticMigration.includes('CREATE TABLE IF NOT EXISTS learning_memory_embeddings'), 'Semantic embedding migration is missing.');
assert(semanticMemory.includes("const EMBEDDING_MODEL = 'text-embedding-3-small'"), 'Semantic memory must use the configured embedding model.');
assert(semanticMemory.includes('dimensions: EMBEDDING_DIMENSIONS'), 'Embedding requests must use the compact configured dimensions.');
assert(semanticMemory.includes("https://api.openai.com/v1/embeddings"), 'Semantic memory must use the embeddings endpoint.');
assert(semanticMemory.includes('if (!apiKey || inputs.length === 0) return null'), 'Semantic retrieval must remain optional when the model service is unavailable.');
assert(persistence.includes('upsertMemoryEmbeddings'), 'Durable compact memories must be eligible for semantic indexing.');
assert(persistence.includes('loadMemoryEmbeddings'), 'Durable compact memories must be able to load stored semantic vectors.');
assert(persistence.includes('Durable memory is authoritative'), 'Embedding failures must not make durable memory saving fail.');

assert(sourceUpload.includes('private-sources/'), 'Private source objects must use opaque private-source keys.');
assert(!sourceUpload.includes('originalName: file.name,\n        objectKey: `private-sources/${user.userId}/${documentId}/${file.name}`'), 'Original filenames must not be embedded in R2 object keys.');
assert(sourceUpload.includes('Never echo the raw document back to the browser'), 'Source upload must preserve the no-raw-echo contract.');
assert(!semanticMemory.includes('source_documents'), 'Raw imported source documents must not be directly embedded for long-term retrieval.');

assert(rememberRoute.includes('Sign in') || rememberRoute.includes('accountRequired'), 'Durable memory must be account-scoped.');
assert(aiClient.includes('Do not save it automatically'), 'Keep Talking must not auto-save AI suggestions.');
assert(aiClient.includes('A suggestion is not a HELPFUL_STRATEGY until a real outcome shows it helped'), 'Advice must not become a helpful strategy without outcome evidence.');

assert(evidenceRoute.includes('rememberForFuture'), 'Prediction outcomes must remain opt-in for durable account memory.');
assert(evidenceRoute.includes('strategyHelped && intendedAction'), 'Helpful strategies require an explicit user-reported helpful outcome.');
assert(evidenceRoute.includes("type: 'HELPFUL_STRATEGY'"), 'Helpful strategy promotion path is missing.');

assert(persistence.includes('CONSOLIDATABLE_MEMORY_TYPES'), 'Repeated durable learning must have a conservative consolidation path.');
assert(persistence.includes('canonicalLearningText'), 'Learning consolidation must compare normalized compact learning text.');
assert(persistence.includes('evidence_count = ?'), 'Independent confirmations must be able to strengthen an existing learning record.');
assert(!persistence.includes("'OUTCOME',\n  'HELPFUL_STRATEGY'"), 'Distinct real-world outcomes must not be collapsed merely because they are outcomes.');

assert(selfTest.includes('DELETE FROM learning_memories'), 'Storage self-test must clean up synthetic D1 records.');
assert(selfTest.includes('bucket.delete(objectKey)'), 'Storage self-test must clean up synthetic R2 objects.');
assert(selfTest.includes('Synthetic diagnostic record. Not user learning.'), 'Storage self-test must use synthetic, non-user content.');

// Sites documents authenticated email as the required identity signal. An opaque
// user-id header may exist in some runtimes, but SHIFT must not require it.
assert(chatgptAuth.includes("const rawEmail = requestHeaders.get(USER_EMAIL_HEADER)"), 'Sites auth must accept the documented authenticated email header.');
assert(chatgptAuth.includes('explicitUserId || (await pseudonymousUserId(email))'), 'Sites auth must fall back to a pseudonymous email-derived account key.');
assert(chatgptAuth.includes("crypto.subtle.digest('SHA-256'"), 'Fallback account identity must not use the raw email as the D1 primary key.');
assert(!chatgptAuth.includes('if (!userId || !email) return null'), 'Sites auth must not require an undocumented user-id header.');

console.log('SHIFT learning-memory architecture checks passed.');
