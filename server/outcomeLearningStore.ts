import { env } from 'cloudflare:workers';
import type { LearningMemoryCandidate } from './aiClient.js';
import { ensureUser } from './persistence.js';
import { upsertMemoryEmbeddings } from './semanticMemory.js';

interface MemoryRow {
  id: string;
  summary: string;
  tags_json: string;
  evidence_count: number;
  source_id: string | null;
}

function getDb(): D1Database | null {
  try {
    return env.DB || null;
  } catch {
    return null;
  }
}

function safeTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string').slice(0, 8)
      : [];
  } catch {
    return [];
  }
}

function mergedTags(existingRaw: string, incoming: string[]): string[] {
  const output: string[] = [];
  for (const value of [...safeTags(existingRaw), ...incoming]) {
    const tag = value.trim().toLowerCase().slice(0, 60);
    if (tag && !output.includes(tag)) output.push(tag);
    if (output.length >= 8) break;
  }
  return output;
}

function canonical(value: string): string {
  return value
    .toLowerCase()
    .replace(/[“”"'`]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function embeddingText(memory: LearningMemoryCandidate, tags = memory.tags): string {
  return [memory.type, memory.label, memory.summary, ...tags]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function refreshEmbedding(userId: string, memoryId: string, memory: LearningMemoryCandidate, tags: string[]) {
  try {
    await upsertMemoryEmbeddings(userId, [{ memoryId, text: embeddingText(memory, tags) }]);
  } catch {
    // Durable D1 learning remains authoritative if semantic indexing is unavailable.
  }
}

async function sourceAlreadyCounted(
  db: D1Database,
  userId: string,
  memoryId: string,
  predictionId: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT id FROM learning_evidence
       WHERE user_id = ? AND memory_id = ? AND source_shift_id = ?
         AND evidence_type = 'memory_confirmation'
       LIMIT 1`,
    )
    .bind(userId, memoryId, predictionId)
    .first<{ id: string }>();
  return Boolean(row?.id);
}

async function markSourceCounted(
  db: D1Database,
  userId: string,
  memoryId: string,
  predictionId: string,
): Promise<void> {
  if (await sourceAlreadyCounted(db, userId, memoryId, predictionId)) return;
  await db
    .prepare(
      `INSERT INTO learning_evidence
        (id, user_id, memory_id, source_shift_id, evidence_type, created_at)
       VALUES (?, ?, ?, ?, 'memory_confirmation', CURRENT_TIMESTAMP)`,
    )
    .bind(`evidence_${crypto.randomUUID()}`, userId, memoryId, predictionId)
    .run();
}

export async function savePredictionOutcomeMemory(args: {
  userId: string;
  predictionId: string;
  memory: LearningMemoryCandidate;
  consolidateAcrossPredictions?: boolean;
}): Promise<{ id: string | null; evidenceCount: number }> {
  const db = getDb();
  if (!db || !args.userId || !args.predictionId) return { id: null, evidenceCount: 0 };
  await ensureUser(args.userId);

  const sourceExisting = await db
    .prepare(
      `SELECT id, summary, tags_json, evidence_count, source_id
       FROM learning_memories
       WHERE user_id = ? AND source_kind = 'prediction_outcome'
         AND source_id = ? AND memory_type = ? AND archived_at IS NULL
       ORDER BY updated_at DESC LIMIT 1`,
    )
    .bind(args.userId, args.predictionId, args.memory.type)
    .first<MemoryRow>();

  if (sourceExisting) {
    const tags = mergedTags(sourceExisting.tags_json, args.memory.tags || []);
    await db
      .prepare(
        `UPDATE learning_memories
         SET label = ?, summary = ?, tags_json = ?, confidence = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
      )
      .bind(
        args.memory.label.slice(0, 100),
        args.memory.summary.slice(0, 500),
        JSON.stringify(tags),
        args.memory.confidence,
        sourceExisting.id,
        args.userId,
      )
      .run();
    if (args.consolidateAcrossPredictions) {
      await markSourceCounted(db, args.userId, sourceExisting.id, args.predictionId);
    }
    await refreshEmbedding(args.userId, sourceExisting.id, args.memory, tags);
    return { id: sourceExisting.id, evidenceCount: Math.max(1, Number(sourceExisting.evidence_count || 1)) };
  }

  if (args.consolidateAcrossPredictions) {
    const candidates = await db
      .prepare(
        `SELECT id, summary, tags_json, evidence_count, source_id
         FROM learning_memories
         WHERE user_id = ? AND memory_type = ? AND archived_at IS NULL
         ORDER BY updated_at DESC LIMIT 80`,
      )
      .bind(args.userId, args.memory.type)
      .all<MemoryRow>();
    const incoming = canonical(args.memory.summary);
    const match = (candidates.results || []).find((row) => canonical(row.summary) === incoming);
    if (match) {
      const counted = await sourceAlreadyCounted(db, args.userId, match.id, args.predictionId);
      const evidenceCount = counted
        ? Math.max(1, Number(match.evidence_count || 1))
        : Math.max(1, Number(match.evidence_count || 1)) + 1;
      const tags = mergedTags(match.tags_json, args.memory.tags || []);
      await db
        .prepare(
          `UPDATE learning_memories
           SET evidence_count = ?, tags_json = ?, confidence = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
        )
        .bind(evidenceCount, JSON.stringify(tags), args.memory.confidence, match.id, args.userId)
        .run();
      await markSourceCounted(db, args.userId, match.id, args.predictionId);
      await refreshEmbedding(args.userId, match.id, args.memory, tags);
      return { id: match.id, evidenceCount };
    }
  }

  const id = `mem_${crypto.randomUUID()}`;
  const tags = (args.memory.tags || []).slice(0, 8);
  await db
    .prepare(
      `INSERT INTO learning_memories
        (id, user_id, memory_type, label, summary, tags_json, epistemic_status,
         confidence, source_kind, source_id, evidence_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, 'prediction_outcome', ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    )
    .bind(
      id,
      args.userId,
      args.memory.type,
      args.memory.label.slice(0, 100),
      args.memory.summary.slice(0, 500),
      JSON.stringify(tags),
      args.memory.confidence,
      args.predictionId,
    )
    .run();
  if (args.consolidateAcrossPredictions) await markSourceCounted(db, args.userId, id, args.predictionId);
  await refreshEmbedding(args.userId, id, args.memory, tags);
  return { id, evidenceCount: 1 };
}

export async function upsertPredictionEvidence(args: {
  userId: string;
  predictionId: string;
  memoryId?: string | null;
  evidenceType: 'outcome' | 'strategy_result';
  prediction: string;
  observedOutcome: string;
  learning: string;
}): Promise<boolean> {
  const db = getDb();
  if (!db || !args.userId || !args.predictionId) return false;
  await ensureUser(args.userId);

  const existing = await db
    .prepare(
      `SELECT id FROM learning_evidence
       WHERE user_id = ? AND source_shift_id = ? AND evidence_type = ?
       ORDER BY created_at DESC LIMIT 1`,
    )
    .bind(args.userId, args.predictionId, args.evidenceType)
    .first<{ id: string }>();

  if (existing?.id) {
    await db
      .prepare(
        `UPDATE learning_evidence
         SET memory_id = ?, prediction = ?, observed_outcome = ?, learning = ?
         WHERE id = ? AND user_id = ?`,
      )
      .bind(
        args.memoryId || null,
        args.prediction || null,
        args.observedOutcome || null,
        args.learning || null,
        existing.id,
        args.userId,
      )
      .run();
    return true;
  }

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
      args.predictionId,
      args.evidenceType,
      args.prediction || null,
      args.observedOutcome || null,
      args.learning || null,
    )
    .run();
  return true;
}
