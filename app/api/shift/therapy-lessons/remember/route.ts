import { getChatGPTUser } from '@/app/chatgpt-auth';
import type { TherapyLessonDraft, TherapyLessonSourceType } from '@/lib/shift-intelligence-types';
import { loadTherapyLessonById, saveTherapyLesson } from '@/server/therapyLessonStore';

const SOURCES = new Set<TherapyLessonSourceType>([
  'therapist',
  'counselor',
  'recovery_support',
  'medical_professional',
  'user_insight',
  'shift_working_hypothesis',
]);

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function stringList(value: unknown, maxItems = 8, maxLength = 180): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => text(item, maxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const requestedSourceType = text(body.sourceType, 40) as TherapyLessonSourceType;
    const title = text(body.title, 120);
    const lessonSummary = text(body.lessonSummary, 700);
    const supersedesId = text(body.supersedesId, 120) || undefined;
    if (!SOURCES.has(requestedSourceType) || !title || !lessonSummary) {
      return Response.json({ error: 'A valid lesson source, title, and summary are required.' }, { status: 400 });
    }

    const user = await getChatGPTUser();
    if (!user) {
      return Response.json({ persisted: false, accountRequired: true }, { status: 200 });
    }

    let sourceType = requestedSourceType;
    if (supersedesId) {
      const previous = await loadTherapyLessonById(user.userId, supersedesId);
      if (!previous || !previous.active || previous.supersededAt) {
        return Response.json({ error: 'The lesson being replaced is not an active current version.' }, { status: 404 });
      }
      // A revision may change wording but not provenance. This prevents a client
      // request from rewriting who the user originally attributed the lesson to.
      sourceType = previous.sourceType;
    }

    // Reaching this endpoint is the explicit consent action: the user chose
    // "Remember lesson". The model is never allowed to call this silently.
    const draft: TherapyLessonDraft = {
      title,
      sourceType,
      lessonSummary,
      triggerConditions: stringList(body.triggerConditions),
      oldPattern: text(body.oldPattern, 600),
      newSkill: text(body.newSkill, 600),
      replacementRule: text(body.replacementRule, 600),
      example: text(body.example, 600),
      prediction: text(body.prediction, 500),
      desiredExperiment: text(body.desiredExperiment, 600),
      evidenceObserved: stringList(body.evidenceObserved, 12, 240),
      confidence: sourceType === 'shift_working_hypothesis'
        ? Math.max(0, Math.min(1, Number(body.confidence) || 0.5))
        : 1,
      sensitivityLevel: body.sensitivityLevel === 'low' || body.sensitivityLevel === 'high' ? body.sensitivityLevel : 'medium',
      userConfirmed: true,
      active: true,
      supersedesId,
    };

    const id = await saveTherapyLesson(user.userId, draft);
    return Response.json({ persisted: Boolean(id), id, userConfirmed: true, sourceType });
  } catch {
    return Response.json({ error: 'Unable to remember this lesson right now.' }, { status: 500 });
  }
}
