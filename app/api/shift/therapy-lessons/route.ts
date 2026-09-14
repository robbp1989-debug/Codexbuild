import { getChatGPTUser } from '@/app/chatgpt-auth';
import type { TherapyLesson } from '@/lib/shift-intelligence-types';
import { sanitizeTherapyLessonRevision } from '@/server/therapyLessonContext';
import {
  archiveTherapyLesson,
  loadTherapyLessonById,
  loadTherapyLessonsForReview,
  saveTherapyLesson,
} from '@/server/therapyLessonStore';

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function publicLesson(lesson: TherapyLesson) {
  return {
    id: lesson.id,
    title: lesson.title,
    sourceType: lesson.sourceType,
    lessonSummary: lesson.lessonSummary,
    triggerConditions: lesson.triggerConditions,
    oldPattern: lesson.oldPattern,
    newSkill: lesson.newSkill,
    replacementRule: lesson.replacementRule,
    example: lesson.example,
    prediction: lesson.prediction,
    desiredExperiment: lesson.desiredExperiment,
    evidenceObserved: lesson.evidenceObserved,
    confidence: lesson.confidence,
    userConfirmed: lesson.userConfirmed,
    active: lesson.active,
    sensitivityLevel: lesson.sensitivityLevel,
    supersedesId: lesson.supersedesId,
    supersededAt: lesson.supersededAt,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
  };
}

export async function GET(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) {
      return Response.json({ lessons: [], accountRequired: true });
    }
    const url = new URL(request.url);
    const includeHistory = url.searchParams.get('includeHistory') === '1';
    const lessons = await loadTherapyLessonsForReview(user.userId, 100, includeHistory);
    return Response.json({
      lessons: lessons.map(publicLesson),
      accountRequired: false,
      includeHistory,
    });
  } catch {
    return Response.json({ error: 'Unable to load professional learning right now.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) {
      return Response.json({ persisted: false, accountRequired: true });
    }

    const body = await request.json() as Record<string, unknown>;
    const action = text(body.action, 24);
    const lessonId = text(body.lessonId, 120);
    if (!lessonId || (action !== 'archive' && action !== 'revise')) {
      return Response.json({ error: 'A valid lesson and lifecycle action are required.' }, { status: 400 });
    }

    if (action === 'archive') {
      // This route is reached only from an explicit user archive action. Retrieval
      // ignores inactive lessons, so archiving immediately removes it from future use.
      const archived = await archiveTherapyLesson(user.userId, lessonId);
      if (!archived) {
        return Response.json({ error: 'That lesson is not active or could not be found.' }, { status: 404 });
      }
      return Response.json({ persisted: true, archived: true, lessonId });
    }

    const existing = await loadTherapyLessonById(user.userId, lessonId);
    if (!existing || !existing.active || existing.supersededAt) {
      return Response.json({ error: 'That lesson is not an active current version.' }, { status: 404 });
    }

    // Revisions are user-confirmed new versions. Provenance is preserved from the
    // existing lesson; client input cannot rewrite who the lesson was attributed to.
    const draft = sanitizeTherapyLessonRevision(existing, body.lesson);
    if (!draft) {
      return Response.json({ error: 'The revised lesson is not valid.' }, { status: 400 });
    }
    const id = await saveTherapyLesson(user.userId, draft);
    if (!id) {
      return Response.json({ error: 'The lesson changed before this revision could be saved.' }, { status: 409 });
    }
    return Response.json({
      persisted: true,
      revised: true,
      id,
      supersedesId: existing.id,
      sourceType: existing.sourceType,
    });
  } catch {
    return Response.json({ error: 'Unable to update professional learning right now.' }, { status: 500 });
  }
}
