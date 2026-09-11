import { env } from 'cloudflare:workers';
import { ensureUser } from './persistence';

export interface StorageSelfTestResult {
  authenticatedUser: boolean;
  d1Binding: boolean;
  d1SchemaReady: boolean;
  d1RoundTrip: boolean;
  r2Binding: boolean;
  r2RoundTrip: boolean;
  cleanupSucceeded: boolean;
  ready: boolean;
  checkedAt: string;
}

const REQUIRED_TABLES = [
  'users',
  'learning_memories',
  'source_documents',
  'learning_evidence',
];

function getDb(): D1Database | null {
  try {
    return env.DB || null;
  } catch {
    return null;
  }
}

function getBucket(): R2Bucket | null {
  try {
    return env.FILES || null;
  } catch {
    return null;
  }
}

export async function inspectStorageReadiness(userId?: string): Promise<StorageSelfTestResult> {
  const database = getDb();
  const bucket = getBucket();
  let d1SchemaReady = false;

  if (database) {
    try {
      const placeholders = REQUIRED_TABLES.map(() => '?').join(',');
      const result = await database
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${placeholders})`)
        .bind(...REQUIRED_TABLES)
        .all<{ name: string }>();
      const names = new Set((result.results || []).map((row) => row.name));
      d1SchemaReady = REQUIRED_TABLES.every((name) => names.has(name));
    } catch {
      d1SchemaReady = false;
    }
  }

  return {
    authenticatedUser: Boolean(userId),
    d1Binding: Boolean(database),
    d1SchemaReady,
    d1RoundTrip: false,
    r2Binding: Boolean(bucket),
    r2RoundTrip: false,
    cleanupSucceeded: true,
    ready: Boolean(userId && database && d1SchemaReady && bucket),
    checkedAt: new Date().toISOString(),
  };
}

export async function runStorageRoundTripSelfTest(userId: string): Promise<StorageSelfTestResult> {
  const result = await inspectStorageReadiness(userId);
  const database = getDb();
  const bucket = getBucket();
  const nonce = crypto.randomUUID();
  const memoryId = `diagnostic_${nonce}`;
  const objectKey = `diagnostics/${userId}/${nonce}`;
  let cleanupSucceeded = true;

  try {
    if (database && result.d1SchemaReady) {
      try {
        await ensureUser(userId);
        await database
          .prepare(
            `INSERT INTO learning_memories
              (id, user_id, memory_type, label, summary, tags_json, epistemic_status,
               confidence, source_kind, source_id, evidence_count, created_at, updated_at)
             VALUES (?, ?, 'UPDATED_PERSPECTIVE', 'Storage self-test',
                     'Synthetic diagnostic record. Not user learning.', '[]', 'active',
                     'observed', 'diagnostic', NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          )
          .bind(memoryId, userId)
          .run();
        const row = await database
          .prepare('SELECT id FROM learning_memories WHERE id = ? AND user_id = ? LIMIT 1')
          .bind(memoryId, userId)
          .first<{ id: string }>();
        result.d1RoundTrip = row?.id === memoryId;
      } catch {
        result.d1RoundTrip = false;
      }
    }

    if (bucket) {
      try {
        const payload = 'SHIFT private-storage diagnostic';
        await bucket.put(objectKey, payload, { httpMetadata: { contentType: 'text/plain' } });
        const stored = await bucket.get(objectKey);
        result.r2RoundTrip = Boolean(stored && (await stored.text()) === payload);
      } catch {
        result.r2RoundTrip = false;
      }
    }
  } finally {
    if (database) {
      try {
        await database.prepare('DELETE FROM learning_memories WHERE id = ? AND user_id = ?').bind(memoryId, userId).run();
      } catch {
        cleanupSucceeded = false;
      }
    }
    if (bucket) {
      try {
        await bucket.delete(objectKey);
      } catch {
        cleanupSucceeded = false;
      }
    }
  }

  result.cleanupSucceeded = cleanupSucceeded;
  result.ready = Boolean(
    result.authenticatedUser &&
      result.d1Binding &&
      result.d1SchemaReady &&
      result.d1RoundTrip &&
      result.r2Binding &&
      result.r2RoundTrip &&
      result.cleanupSucceeded,
  );
  result.checkedAt = new Date().toISOString();
  return result;
}
