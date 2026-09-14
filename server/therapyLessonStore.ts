import { env } from 'cloudflare:workers';
import type { TherapyLesson, TherapyLessonDraft } from '../lib/shift-intelligence-types.js';
import type { CompactMemoryItem } from './memoryContext.js';
import { ensureUser } from './persistence.js';

interface TherapyLessonRow {
  id: string;
  user_id: string;
  title: string;
  source_type: TherapyLesson['sourceType'];
  lesson_summary: string;
  trigger_conditions_json: string;
  old_pattern: string;
  new_skill: string;
  replacement_rule: string;
  example: string;
  prediction: string;
  desired_experiment: string;
  evidence_observed_json: string;
  confidence: number;
  user_confirmed: number;
  active: number;
  sensitivity_level: TherapyLesson['sensitivityLevel'];
  supersedes_lesson_id: string | null;
  superseded_at: string | null;
  created_at: string;
  updated_at: string;
}

const LESSON_COLUMNS = `id, user_id, title, source_type, lesson_summary, trigger_conditions_json,
  old_pattern, new_skill, replacement_rule, example, prediction,
  desired_experiment, evidence_observed_json, confidence, user_confirmed,
  active, sensitivity_level, supersedes_lesson_id, superseded_at, created_at, updated_at`;

function getDb(): D1Database | null {
  try {
    return env.DB || null;
  } catch {
    return null;
  }
}

function safeJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string').slice(0, 12)
      : [];
  } catch {
    return [];
  }
}

function rowToLesson(row: TherapyLessonRow): TherapyLesson {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    title: row.title,
    sourceType: row.source_type,
    lessonSummary: row.lesson_summary,
    triggerConditions: safeJsonArray(row.trigger_conditions_json),
    oldPattern: row.old_pattern,
    newSkill: row.new_skill,
    replacementRule: row.replacement_rule,
    example: row.example,
    prediction: row.prediction,
    desiredExperiment: row.desired_experiment,
    evidenceObserved: safeJsonArray(row.evidence_observed_json),
    confidence: Number(row.confidence || 0),
    userConfirmed: row.user_confirmed === 1,
    active: row.active === 1,
    sensitivityLevel: row.sensitivity_level,
    supersedesId: row.supersedes_lesson_id || undefined,
    supersededAt: row.superseded_at || undefined,
  };
}

function compactLesson(lesson: TherapyLesson): CompactMemoryItem {
  const parts = [
    lesson.title,
    lesson.lessonSummary,
    lesson.triggerConditions.length ? `Triggers: ${lesson.triggerConditions.slice(0, 3).join(', ')}` : '',
    lesson.newSkill ? `Practice: ${lesson.newSkill}` : '',
    lesson.replacementRule ? `Updated rule: ${lesson.replacementRule}` : '',
  ].filter(Boolean);
  return {
    id: lesson.id,
    type: 'THERAPY_LESSON',
    content: parts.join(' | ').slice(0, 900),
    status: lesson.active ? 'active' : 'archived',
    confidence: lesson.userConfirmed ? 'user_confirmed' : 'working',
    evidenceCount: Math.max(1, lesson.evidenceObserved.length),
    sourceKind: `therapy_lesson:${lesson.sourceType}`,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
  };
}

export async function loadTherapyLessons(userId: string, limit = 40): Promise<TherapyLesson[]> {
  const db = getDb();
  if (!db || !userId) return [];
  await ensureUser(userId);
  const result = await db
    .prepare(
      `SELECT ${LESSON_COLUMNS}
       FROM therapy_lessons
       WHERE user_id = ? AND active = 1 AND superseded_at IS NULL
       ORDER BY updated_at DESC
       LIMIT ?`,
    )
    .bind(userId, Math.max(1, Math.min(limit, 100)))
    .all<TherapyLessonRow>();
  return (result.results || []).map(rowToLesson);
}

export async function loadTherapyLessonsForReview(
  userId: string,
  limit = 80,
  includeHistory = false,
): Promise<TherapyLesson[]> {
  const db = getDb();
  if (!db || !userId) return [];
  await ensureUser(userId);
  const capped = Math.max(1, Math.min(limit, 150));
  const query = includeHistory
    ? `SELECT ${LESSON_COLUMNS}
       FROM therapy_lessons
       WHERE user_id = ?
       ORDER BY updated_at DESC
       LIMIT ?`
    : `SELECT ${LESSON_COLUMNS}
       FROM therapy_lessons
       WHERE user_id = ? AND active = 1 AND superseded_at IS NULL
       ORDER BY updated_at DESC
       LIMIT ?`;
  const result = await db.prepare(query).bind(userId, capped).all<TherapyLessonRow>();
  return (result.results || []).map(rowToLesson);
}

export async function loadTherapyLessonById(
  userId: string,
  lessonId: string,
): Promise<TherapyLesson | null> {
  const db = getDb();
  if (!db || !userId || !lessonId) return null;
  await ensureUser(userId);
  const row = await db
    .prepare(
      `SELECT ${LESSON_COLUMNS}
       FROM therapy_lessons
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
    )
    .bind(lessonId, userId)
    .first<TherapyLessonRow>();
  return row ? rowToLesson(row) : null;
}

export async function loadTherapyLessonMemories(userId: string, limit = 40): Promise<CompactMemoryItem[]> {
  return (await loadTherapyLessons(userId, limit)).map(compactLesson);
}

export async function saveTherapyLesson(
  userId: string,
  draft: TherapyLessonDraft,
): Promise<string | null> {
  const db = getDb();
  if (!db || !userId) return null;
  await ensureUser(userId);

  if (draft.supersedesId) {
    const previous = await loadTherapyLessonById(userId, draft.supersedesId);
    // Revisions are linear and user-owned. An archived or already superseded
    // lesson cannot be silently branched into a new current lesson.
    if (!previous || !previous.active || previous.supersededAt) return null;
  }

  const id = `lesson_${crypto.randomUUID()}`;
  const insert = db
    .prepare(
      `INSERT INTO therapy_lessons (
        id, user_id, title, source_type, lesson_summary, trigger_conditions_json,
        old_pattern, new_skill, replacement_rule, example, prediction,
        desired_experiment, evidence_observed_json, confidence, user_confirmed,
        active, sensitivity_level, supersedes_lesson_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    )
    .bind(
      id,
      userId,
      draft.title,
      draft.sourceType,
      draft.lessonSummary,
      JSON.stringify(draft.triggerConditions || []),
      draft.oldPattern || '',
      draft.newSkill || '',
      draft.replacementRule || '',
      draft.example || '',
      draft.prediction || '',
      draft.desiredExperiment || '',
      JSON.stringify(draft.evidenceObserved || []),
      Math.max(0, Math.min(1, Number(draft.confidence || 0))),
      draft.sensitivityLevel || 'medium',
      draft.supersedesId || null,
    );

  if (!draft.supersedesId) {
    await insert.run();
    return id;
  }

  const supersede = db
    .prepare(
      `UPDATE therapy_lessons
       SET active = 0, superseded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ? AND active = 1 AND superseded_at IS NULL`,
    )
    .bind(draft.supersedesId, userId);

  await db.batch([insert, supersede]);
  return id;
}

export async function archiveTherapyLesson(userId: string, lessonId: string): Promise<boolean> {
  const db = getDb();
  if (!db || !userId || !lessonId) return false;
  await ensureUser(userId);
  const existing = await loadTherapyLessonById(userId, lessonId);
  if (!existing || !existing.active) return false;
  const result = await db
    .prepare(
      `UPDATE therapy_lessons
       SET active = 0, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ? AND active = 1`,
    )
    .bind(lessonId, userId)
    .run();
  return Boolean(result.success);
}
