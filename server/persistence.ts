import { env } from 'cloudflare:workers';
import type { LearningMemoryCandidate } from './aiClient';
import type { CompactMemoryItem } from './memoryContext';

interface LearningMemoryRow {
  id: string;
  memory_type: string;
  label: string;
  summary: string;
  tags_json: string;
  epistemic_status: string;
  confidence: string;
  source_id: string | null;
  created_at: string;
  updated_at: string;
}

function getDb(): D1Database | null {
  try {
    return env.DB || null;
  } catch {
    return null;
  }
}

export function getSourceBucket(): R2Bucket | null {
  try {
    return env.FILES || null;
  } catch {
    return null;
  }
}

export function hasDurableStorage(): boolean {
  return Boolean(getDb());
}

export async function ensureUser(userId: string): Promise<boolean> {
  const db = getDb();
  if (!db || !userId) return false;
  await db
    .prepare(
      `INSERT INTO users (id, created_at, updated_at)
       VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(userId)
    .run();
  return true;
}

function safeTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string').slice(0, 8) : [];
  } catch {
    return [];
  }
}

function rowToCompactMemory(row: LearningMemoryRow): CompactMemoryItem {
  const tags = safeTags(row.tags_json);
  const tagText = tags.length ? ` | tags: ${tags.join(', ')}` : '';
  return {
    id: row.id,
    type: row.memory_type,
    content: `${row.label}: ${row.summary}${tagText}`,
    status: row.epistemic_status === 'rejected' ? 'rejected' : 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceSessionId: row.source_id || undefined,
  };
}

export async function loadLearningMemories(userId: string, limit = 80): Promise<CompactMemoryItem[]> {
  const db = getDb();
  if (!db || !userId) return [];
  await ensureUser(userId);
  const result = await db
    .prepare(
      `SELECT id, memory_type, label, summary, tags_json, epistemic_status,
              confidence, source_id, created_at, updated_at
       FROM learning_memories
       WHERE user_id = ? AND archived_at IS NULL
       ORDER BY updated_at DESC
       LIMIT ?`,
    )
    .bind(userId, Math.max(1, Math.min(limit, 200)))
    .all<LearningMemoryRow>();
  return (result.results || []).map(rowToCompactMemory);
}

function memoryId(): string {
  return `mem_${crypto.randomUUID()}`;
}

function normalizedStatus(memory: LearningMemoryCandidate): string {
  return memory.type === 'REJECTED_HYPOTHESIS' ? 'rejected' : 'active';
}

export async function replaceLearningMemoriesForSource(
  userId: string,
  sourceId: string,
  memories: LearningMemoryCandidate[],
): Promise<boolean> {
  const db = getDb();
  if (!db || !userId || !sourceId) return false;
  await ensureUser(userId);

  const statements: D1PreparedStatement[] = [
    db.prepare('DELETE FROM learning_memories WHERE user_id = ? AND source_id = ?').bind(userId, sourceId),
  ];

  for (const memory of memories.slice(0, 8)) {
    statements.push(
      db
        .prepare(
          `INSERT INTO learning_memories
            (id, user_id, memory_type, label, summary, tags_json, epistemic_status,
             confidence, source_kind, source_id, evidence_count, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'reflection', ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        )
        .bind(
          memoryId(),
          userId,
          memory.type,
          memory.label.slice(0, 100),
          memory.summary.slice(0, 500),
          JSON.stringify(memory.tags?.slice(0, 8) || []),
          normalizedStatus(memory),
          memory.confidence,
          sourceId,
        ),
    );
  }

  await db.batch(statements);
  return true;
}

export async function saveLearningMemory(
  userId: string,
  sourceId: string | null,
  memory: LearningMemoryCandidate,
): Promise<string | null> {
  const db = getDb();
  if (!db || !userId) return null;
  await ensureUser(userId);
  const id = memoryId();
  await db
    .prepare(
      `INSERT INTO learning_memories
        (id, user_id, memory_type, label, summary, tags_json, epistemic_status,
         confidence, source_kind, source_id, evidence_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'conversation', ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    )
    .bind(
      id,
      userId,
      memory.type,
      memory.label.slice(0, 100),
      memory.summary.slice(0, 500),
      JSON.stringify(memory.tags?.slice(0, 8) || []),
      normalizedStatus(memory),
      memory.confidence,
      sourceId,
    )
    .run();
  return id;
}

export async function archiveLearningMemory(userId: string, memoryIdValue: string): Promise<boolean> {
  const db = getDb();
  if (!db || !userId || !memoryIdValue) return false;
  const result = await db
    .prepare(
      `UPDATE learning_memories
       SET archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
    )
    .bind(memoryIdValue, userId)
    .run();
  return Boolean(result.success);
}

export async function recordLearningEvidence(args: {
  userId: string;
  sourceShiftId?: string;
  memoryId?: string;
  evidenceType: 'prediction' | 'outcome' | 'strategy_result';
  prediction?: string;
  observedOutcome?: string;
  learning?: string;
}): Promise<boolean> {
  const db = getDb();
  if (!db || !args.userId) return false;
  await ensureUser(args.userId);
  await db
    .prepare(
      `INSERT INTO learning_evidence
        (id, user_id, memory_id, source_shift_id, evidence_type, prediction,
         observed_outcome, learning, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    )
    .bind(
      `evidence_${crypto.randomUUID()}`,
      args.userId,
      args.memoryId || null,
      args.sourceShiftId || null,
      args.evidenceType,
      args.prediction || null,
      args.observedOutcome || null,
      args.learning || null,
    )
    .run();
  return true;
}
