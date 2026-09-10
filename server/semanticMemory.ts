import { env } from 'cloudflare:workers';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 256;
const MAX_EMBEDDING_INPUTS = 80;

export type MemoryEmbeddingEntry = {
  memoryId: string;
  text: string;
};

function getDb(): D1Database | null {
  try {
    return env.DB || null;
  } catch {
    return null;
  }
}

function cleanEmbeddingText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 1800);
}

function validVector(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length !== EMBEDDING_DIMENSIONS) return null;
  const vector = value.map(Number);
  return vector.every(Number.isFinite) ? vector : null;
}

async function ensureEmbeddingTable(db: D1Database): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS learning_memory_embeddings (
         memory_id TEXT PRIMARY KEY,
         user_id TEXT NOT NULL,
         embedding_json TEXT NOT NULL,
         model TEXT NOT NULL,
         dimensions INTEGER NOT NULL,
         updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (memory_id) REFERENCES learning_memories(id) ON DELETE CASCADE
       )`,
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_learning_memory_embeddings_user
       ON learning_memory_embeddings(user_id)`,
    )
    .run();
}

async function createEmbeddings(inputs: string[]): Promise<number[][] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || inputs.length === 0) return null;

  const cleaned = inputs.map(cleanEmbeddingText).filter(Boolean).slice(0, MAX_EMBEDDING_INPUTS);
  if (!cleaned.length) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: cleaned,
        dimensions: EMBEDDING_DIMENSIONS,
        encoding_format: 'float',
      }),
    });
    if (!response.ok) return null;
    const data = await response.json() as { data?: Array<{ index?: number; embedding?: number[] }> };
    const rows = Array.isArray(data.data) ? [...data.data].sort((a, b) => Number(a.index || 0) - Number(b.index || 0)) : [];
    if (rows.length !== cleaned.length) return null;
    const vectors = rows.map((row) => validVector(row.embedding));
    if (vectors.some((vector) => !vector)) return null;
    return vectors as number[][];
  } catch {
    return null;
  }
}

export async function embedMemoryQuery(query: string): Promise<number[] | null> {
  const clean = cleanEmbeddingText(query);
  if (!clean) return null;
  const vectors = await createEmbeddings([clean]);
  return vectors?.[0] || null;
}

export async function upsertMemoryEmbeddings(
  userId: string,
  entries: MemoryEmbeddingEntry[],
): Promise<boolean> {
  const db = getDb();
  if (!db || !userId || !process.env.OPENAI_API_KEY) return false;

  const usable = entries
    .filter((entry) => entry.memoryId && cleanEmbeddingText(entry.text))
    .slice(0, MAX_EMBEDDING_INPUTS);
  if (!usable.length) return false;

  const vectors = await createEmbeddings(usable.map((entry) => entry.text));
  if (!vectors || vectors.length !== usable.length) return false;

  try {
    await ensureEmbeddingTable(db);
    const statements = usable.map((entry, index) =>
      db
        .prepare(
          `INSERT INTO learning_memory_embeddings
             (memory_id, user_id, embedding_json, model, dimensions, updated_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(memory_id) DO UPDATE SET
             user_id = excluded.user_id,
             embedding_json = excluded.embedding_json,
             model = excluded.model,
             dimensions = excluded.dimensions,
             updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(
          entry.memoryId,
          userId,
          JSON.stringify(vectors[index]),
          EMBEDDING_MODEL,
          EMBEDDING_DIMENSIONS,
        ),
    );
    await db.batch(statements);
    return true;
  } catch {
    return false;
  }
}

export async function loadMemoryEmbeddings(
  userId: string,
  memoryIds: string[],
): Promise<Map<string, number[]>> {
  const output = new Map<string, number[]>();
  const db = getDb();
  const ids = [...new Set(memoryIds.filter(Boolean))].slice(0, 200);
  if (!db || !userId || !ids.length) return output;

  try {
    await ensureEmbeddingTable(db);
    const placeholders = ids.map(() => '?').join(',');
    const result = await db
      .prepare(
        `SELECT memory_id, embedding_json
         FROM learning_memory_embeddings
         WHERE user_id = ? AND memory_id IN (${placeholders})`,
      )
      .bind(userId, ...ids)
      .all<{ memory_id: string; embedding_json: string }>();

    for (const row of result.results || []) {
      try {
        const vector = validVector(JSON.parse(row.embedding_json));
        if (vector) output.set(row.memory_id, vector);
      } catch {
        // Ignore one malformed vector rather than degrading all memory retrieval.
      }
    }
  } catch {
    // Semantic retrieval is an optional enhancement. Lexical retrieval remains active.
  }

  return output;
}

export async function deleteMemoryEmbedding(userId: string, memoryId: string): Promise<void> {
  const db = getDb();
  if (!db || !userId || !memoryId) return;
  try {
    await ensureEmbeddingTable(db);
    await db
      .prepare('DELETE FROM learning_memory_embeddings WHERE memory_id = ? AND user_id = ?')
      .bind(memoryId, userId)
      .run();
  } catch {
    // The authoritative learning record can still be archived without the optional vector.
  }
}
