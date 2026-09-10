import { env } from 'cloudflare:workers';
import { getSourceBucket } from './persistence';

export interface AccountMemoryRecord {
  id: string;
  type: string;
  label: string;
  summary: string;
  tags: string[];
  confidence: string;
  sourceKind: string;
  sourceId: string | null;
  evidenceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSourceRecord {
  id: string;
  originalName: string;
  contentType: string;
  byteSize: number;
  extractionStatus: string;
  createdAt: string;
  extractedAt: string | null;
}

function db(): D1Database | null {
  try {
    return env.DB || null;
  } catch {
    return null;
  }
}

function tags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string').slice(0, 8) : [];
  } catch {
    return [];
  }
}

export async function listAccountMemories(userId: string, limit = 100): Promise<AccountMemoryRecord[]> {
  const database = db();
  if (!database) return [];
  const result = await database
    .prepare(
      `SELECT id, memory_type, label, summary, tags_json, confidence, source_kind,
              source_id, evidence_count, created_at, updated_at
       FROM learning_memories
       WHERE user_id = ? AND archived_at IS NULL
       ORDER BY updated_at DESC
       LIMIT ?`,
    )
    .bind(userId, Math.max(1, Math.min(limit, 200)))
    .all<Record<string, unknown>>();

  return (result.results || []).map((row) => ({
    id: String(row.id || ''),
    type: String(row.memory_type || ''),
    label: String(row.label || ''),
    summary: String(row.summary || ''),
    tags: tags(String(row.tags_json || '[]')),
    confidence: String(row.confidence || 'working'),
    sourceKind: String(row.source_kind || 'reflection'),
    sourceId: row.source_id == null ? null : String(row.source_id),
    evidenceCount: Number(row.evidence_count || 1),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  }));
}

export async function archiveAccountMemory(userId: string, memoryId: string): Promise<boolean> {
  const database = db();
  if (!database) return false;
  const result = await database
    .prepare(
      `UPDATE learning_memories
       SET archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
    )
    .bind(memoryId, userId)
    .run();
  return Boolean(result.success);
}

export async function listAccountSources(userId: string): Promise<AccountSourceRecord[]> {
  const database = db();
  if (!database) return [];
  const result = await database
    .prepare(
      `SELECT id, original_name, content_type, byte_size, extraction_status,
              created_at, extracted_at
       FROM source_documents
       WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 100`,
    )
    .bind(userId)
    .all<Record<string, unknown>>();

  return (result.results || []).map((row) => ({
    id: String(row.id || ''),
    originalName: String(row.original_name || 'Private source'),
    contentType: String(row.content_type || ''),
    byteSize: Number(row.byte_size || 0),
    extractionStatus: String(row.extraction_status || 'pending'),
    createdAt: String(row.created_at || ''),
    extractedAt: row.extracted_at == null ? null : String(row.extracted_at),
  }));
}

export async function deleteAccountSource(args: {
  userId: string;
  documentId: string;
  deleteLearning: boolean;
}): Promise<boolean> {
  const database = db();
  const bucket = getSourceBucket();
  if (!database || !bucket) return false;

  const row = await database
    .prepare(
      `SELECT r2_object_key FROM source_documents
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL
       LIMIT 1`,
    )
    .bind(args.documentId, args.userId)
    .first<{ r2_object_key: string }>();
  if (!row?.r2_object_key) return false;

  await bucket.delete(row.r2_object_key);
  const statements: D1PreparedStatement[] = [
    database
      .prepare(
        `UPDATE source_documents
         SET deleted_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
      )
      .bind(args.documentId, args.userId),
  ];
  if (args.deleteLearning) {
    statements.push(
      database.prepare('DELETE FROM learning_memories WHERE user_id = ? AND source_id = ?').bind(args.userId, args.documentId),
    );
  }
  await database.batch(statements);
  return true;
}
