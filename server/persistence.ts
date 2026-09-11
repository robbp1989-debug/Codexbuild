import { env } from 'cloudflare:workers';
import type { LearningMemoryCandidate } from './aiClient';
import type { CompactMemoryItem } from './memoryContext';
import {
  deleteMemoryEmbedding,
  loadMemoryEmbeddings,
  upsertMemoryEmbeddings,
} from './semanticMemory';

interface LearningMemoryRow {
  id: string;
  memory_type: string;
  label: string;
  summary: string;
  tags_json: string;
  epistemic_status: string;
  confidence: string;
  source_kind: string;
  source_id: string | null;
  evidence_count: number;
  created_at: string;
  updated_at: string;
}

interface ConsolidationRow {
  id: string;
  summary: string;
  tags_json: string;
  confidence: string;
  source_id: string | null;
  evidence_count: number;
}

export interface SourceDocumentRecord {
  id: string;
  objectKey: string;
  originalName: string;
  contentType: string;
  byteSize: number;
  extractionStatus: 'pending' | 'completed' | 'failed';
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

function memoryEmbeddingText(memory: Pick<LearningMemoryCandidate, 'type' | 'label' | 'summary' | 'tags'>): string {
  return [memory.type, memory.label, memory.summary, ...(memory.tags || [])]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function rowEmbeddingText(row: Pick<LearningMemoryRow, 'memory_type' | 'label' | 'summary' | 'tags_json'>): string {
  return [row.memory_type, row.label, row.summary, ...safeTags(row.tags_json)]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function rowToCompactMemory(row: LearningMemoryRow, embedding?: number[]): CompactMemoryItem {
  const tags = safeTags(row.tags_json);
  const tagText = tags.length ? ` | tags: ${tags.join(', ')}` : '';
  return {
    id: row.id,
    type: row.memory_type,
    content: `${row.label}: ${row.summary}${tagText}`,
    // REJECTED_HYPOTHESIS is an active piece of knowledge: the user rejected that
    // explanation. It must remain retrievable so SHIFT does not keep proposing it.
    status: row.epistemic_status === 'archived' ? 'archived' : 'active',
    confidence: row.confidence,
    evidenceCount: Math.max(1, Number(row.evidence_count || 1)),
    sourceKind: row.source_kind,
    embedding,
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
              confidence, source_kind, source_id, evidence_count, created_at, updated_at
       FROM learning_memories
       WHERE user_id = ? AND archived_at IS NULL
       ORDER BY updated_at DESC
       LIMIT ?`,
    )
    .bind(userId, Math.max(1, Math.min(limit, 200)))
    .all<LearningMemoryRow>();

  const rows = result.results || [];
  let embeddings = new Map<string, number[]>();
  try {
    embeddings = await loadMemoryEmbeddings(userId, rows.map((row) => row.id));
  } catch {
    // Semantic retrieval is optional. The same memories remain available to the
    // lexical selector if vector storage is unavailable.
  }
  return rows.map((row) => rowToCompactMemory(row, embeddings.get(row.id)));
}

function memoryId(): string {
  return `mem_${crypto.randomUUID()}`;
}

function normalizedStatus(_memory: LearningMemoryCandidate): string {
  // A rejected hypothesis is not a rejected memory. The durable record should stay
  // active precisely so it can suppress that explanation in future conversations.
  return 'active';
}

const CONSOLIDATABLE_MEMORY_TYPES = new Set<LearningMemoryCandidate['type']>([
  'CONFIRMED_PATTERN',
  'WORKING_HYPOTHESIS',
  'REJECTED_HYPOTHESIS',
  'UPDATED_PERSPECTIVE',
  'USER_PREFERENCE',
  'BOUNDARY',
  'HELPFUL_STRATEGY',
]);

function canonicalLearningText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[“”"'`]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function strongerConfidence(existing: string, incoming: LearningMemoryCandidate['confidence']): string {
  const rank: Record<string, number> = { working: 1, observed: 2, user_confirmed: 3 };
  return (rank[incoming] || 0) > (rank[existing] || 0) ? incoming : existing || incoming;
}

function mergedTags(existingRaw: string, incoming: string[]): string[] {
  const output: string[] = [];
  for (const tag of [...safeTags(existingRaw), ...incoming]) {
    const clean = tag.trim().toLowerCase().slice(0, 60);
    if (clean && !output.includes(clean)) output.push(clean);
    if (output.length >= 8) break;
  }
  return output;
}

async function consolidateExactLearning(
  db: D1Database,
  userId: string,
  sourceId: string | null,
  memory: LearningMemoryCandidate,
): Promise<{ id: string; tags: string[] } | null> {
  if (!CONSOLIDATABLE_MEMORY_TYPES.has(memory.type)) return null;
  const canonicalIncoming = canonicalLearningText(memory.summary);
  if (!canonicalIncoming) return null;

  const result = await db
    .prepare(
      `SELECT id, summary, tags_json, confidence, source_id, evidence_count
       FROM learning_memories
       WHERE user_id = ? AND memory_type = ? AND archived_at IS NULL
       ORDER BY updated_at DESC
       LIMIT 80`,
    )
    .bind(userId, memory.type)
    .all<ConsolidationRow>();

  const match = (result.results || []).find(
    (row) => canonicalLearningText(row.summary) === canonicalIncoming,
  );
  if (!match) return null;

  // A duplicate submit from the same source is idempotent. A genuinely separate
  // source confirming the same compact learning adds one evidence point. A missing
  // source id is treated as idempotent rather than inventing independent evidence.
  const sameSource = !sourceId || !match.source_id || sourceId === match.source_id;
  const nextEvidenceCount = sameSource
    ? Math.max(1, Number(match.evidence_count || 1))
    : Math.max(1, Number(match.evidence_count || 1)) + 1;
  const nextConfidence = strongerConfidence(match.confidence, memory.confidence);
  const nextTags = mergedTags(match.tags_json, memory.tags || []);

  await db
    .prepare(
      `UPDATE learning_memories
       SET evidence_count = ?, confidence = ?, tags_json = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
    )
    .bind(nextEvidenceCount, nextConfidence, JSON.stringify(nextTags), match.id, userId)
    .run();

  return { id: match.id, tags: nextTags };
}

export async function replaceLearningMemoriesForSource(
  userId: string,
  sourceId: string,
  memories: LearningMemoryCandidate[],
  sourceKind: 'reflection' | 'conversation' | 'document' = 'reflection',
): Promise<boolean> {
  const db = getDb();
  if (!db || !userId || !sourceId) return false;
  await ensureUser(userId);

  const statements: D1PreparedStatement[] = [
    db.prepare('DELETE FROM learning_memories WHERE user_id = ? AND source_id = ?').bind(userId, sourceId),
  ];
  const embeddingEntries: Array<{ memoryId: string; text: string }> = [];

  for (const memory of memories.slice(0, 8)) {
    const id = memoryId();
    embeddingEntries.push({ memoryId: id, text: memoryEmbeddingText(memory) });
    statements.push(
      db
        .prepare(
          `INSERT INTO learning_memories
            (id, user_id, memory_type, label, summary, tags_json, epistemic_status,
             confidence, source_kind, source_id, evidence_count, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
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
          sourceKind,
          sourceId,
        ),
    );
  }

  await db.batch(statements);
  try {
    await upsertMemoryEmbeddings(userId, embeddingEntries);
  } catch {
    // Durable memory is authoritative. Vector indexing must never make saving fail.
  }
  return true;
}

export async function saveLearningMemory(
  userId: string,
  sourceId: string | null,
  memory: LearningMemoryCandidate,
  sourceKind: 'reflection' | 'conversation' | 'document' | 'prediction_outcome' = 'conversation',
): Promise<string | null> {
  const db = getDb();
  if (!db || !userId) return null;
  await ensureUser(userId);

  const consolidated = await consolidateExactLearning(db, userId, sourceId, memory);
  if (consolidated) {
    try {
      await upsertMemoryEmbeddings(userId, [{
        memoryId: consolidated.id,
        text: memoryEmbeddingText({ ...memory, tags: consolidated.tags }),
      }]);
    } catch {
      // Exact durable learning remains valid without a refreshed vector.
    }
    return consolidated.id;
  }

  const id = memoryId();
  await db
    .prepare(
      `INSERT INTO learning_memories
        (id, user_id, memory_type, label, summary, tags_json, epistemic_status,
         confidence, source_kind, source_id, evidence_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
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
      sourceKind,
      sourceId,
    )
    .run();

  try {
    await upsertMemoryEmbeddings(userId, [{ memoryId: id, text: memoryEmbeddingText(memory) }]);
  } catch {
    // Durable memory is still saved and remains lexically retrievable.
  }
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
  if (result.success) {
    try {
      await deleteMemoryEmbedding(userId, memoryIdValue);
    } catch {
      // An orphaned optional vector cannot be loaded after the memory is archived.
    }
  }
  return Boolean(result.success);
}

export async function registerSourceDocument(args: {
  userId: string;
  documentId: string;
  objectKey: string;
  originalName: string;
  contentType: string;
  byteSize: number;
}): Promise<boolean> {
  const db = getDb();
  if (!db || !args.userId) return false;
  await ensureUser(args.userId);
  await db
    .prepare(
      `INSERT INTO source_documents
        (id, user_id, r2_object_key, original_name, content_type, byte_size,
         encryption_version, extraction_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'r2-aes256-managed', 'pending', CURRENT_TIMESTAMP)`,
    )
    .bind(
      args.documentId,
      args.userId,
      args.objectKey,
      args.originalName.slice(0, 240),
      args.contentType.slice(0, 120),
      args.byteSize,
    )
    .run();
  return true;
}

export async function setSourceDocumentExtractionStatus(
  userId: string,
  documentId: string,
  status: 'completed' | 'failed',
): Promise<boolean> {
  const db = getDb();
  if (!db || !userId || !documentId) return false;
  const result = await db
    .prepare(
      `UPDATE source_documents
       SET extraction_status = ?, extracted_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE extracted_at END
       WHERE id = ? AND user_id = ?`,
    )
    .bind(status, status, documentId, userId)
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
