import { env } from 'cloudflare:workers';
import type { ContinuityArtifact } from '../lib/shift-intelligence-types.js';
import { ensureUser } from './persistence.js';

export interface AccountContinuityArtifact {
  id: string;
  createdAt: string;
  sourceShiftId?: string;
  artifact: ContinuityArtifact;
}

interface ContinuityRow {
  id: string;
  source_shift_id: string | null;
  artifact_json: string;
  created_at: string;
}

function getDb(): D1Database | null {
  try {
    return env.DB || null;
  } catch {
    return null;
  }
}

function clean(value: unknown, max = 900): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function questions(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => clean(item, 240)).filter(Boolean).slice(0, 3)
    : [];
}

export function sanitizeContinuityArtifact(value: unknown): ContinuityArtifact | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const whatHappened = clean(record.whatHappened);
  if (!whatHappened) return null;
  return {
    whatHappened,
    whatINoticed: clean(record.whatINoticed),
    whatShiftHelpedMeSee: clean(record.whatShiftHelpedMeSee),
    possiblePattern: clean(record.possiblePattern),
    pastLessonThisConnectsTo: clean(record.pastLessonThisConnectsTo),
    whatITried: clean(record.whatITried),
    whatHappenedResult: clean(record.whatHappenedResult),
    whatIStillDontKnow: clean(record.whatIStillDontKnow),
    whatIWantToWorkOnNext: questions(record.whatIWantToWorkOnNext),
  };
}

export async function saveContinuityArtifact(
  userId: string,
  sourceShiftId: string | null,
  artifactInput: unknown,
): Promise<string | null> {
  const db = getDb();
  const artifact = sanitizeContinuityArtifact(artifactInput);
  if (!db || !userId || !artifact) return null;
  await ensureUser(userId);
  const id = `continuity_${crypto.randomUUID()}`;
  await db
    .prepare(
      `INSERT INTO continuity_artifacts (
        id, user_id, source_shift_id, artifact_json, user_saved, created_at
      ) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
    )
    .bind(id, userId, sourceShiftId, JSON.stringify(artifact))
    .run();
  return id;
}

export async function loadLatestContinuityArtifact(userId: string): Promise<AccountContinuityArtifact | null> {
  const db = getDb();
  if (!db || !userId) return null;
  await ensureUser(userId);
  const row = await db
    .prepare(
      `SELECT id, source_shift_id, artifact_json, created_at
       FROM continuity_artifacts
       WHERE user_id = ? AND user_saved = 1 AND archived_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .bind(userId)
    .first<ContinuityRow>();
  if (!row) return null;
  try {
    const artifact = sanitizeContinuityArtifact(JSON.parse(row.artifact_json));
    if (!artifact) return null;
    return {
      id: row.id,
      createdAt: row.created_at,
      sourceShiftId: row.source_shift_id || undefined,
      artifact,
    };
  } catch {
    return null;
  }
}
