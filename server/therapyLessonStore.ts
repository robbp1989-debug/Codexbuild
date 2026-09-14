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
      `SELECT id, user_id, title, source_type, lesson_summary, trigger_conditions_json,
              old_pattern, new_skill, replacement_rule, example, prediction,
              desired_experiment, evidence_observed_json, confidence, user_confirmed,
              active, sensitivity_level, created_at, updated_at
       FROM therapy_lessons
       WHERE user_id = ? AND active = 1 AND superseded_at IS NULL
       ORDER BY updated_at DESC
       LIMIT ?`,
    )
    .bind(userId, Math.max(1, Math.min(limit, 100)))
    .all<TherapyLessonRow>();
  return (result.results || []).map(rowToLesson);
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

  const id = `lesson_${crypto.randomUUID()}`;
  await db
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
    )
    .run();

  if (draft.supersedesId) {
    await db
      .prepare(
        `UPDATE therapy_lessons
         SET active = 0, superseded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ? AND id <> ?`,
      )
      .bind(draft.supersedesId, userId, id)
      .run();
  }

  return id;
}
