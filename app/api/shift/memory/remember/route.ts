import { getChatGPTUser } from '@/app/chatgpt-auth';
import type { LearningMemoryCandidate } from '@/server/aiClient';
import { saveLearningMemory } from '@/server/persistence';

const ALLOWED_TYPES = new Set([
  'CONFIRMED_PATTERN',
  'WORKING_HYPOTHESIS',
  'REJECTED_HYPOTHESIS',
  'UPDATED_PERSPECTIVE',
  'USER_PREFERENCE',
  'BOUNDARY',
  'CURRENT_EXPERIMENT',
  'OUTCOME',
  'HELPFUL_STRATEGY',
]);

function cleanString(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

export async function POST(request: Request) {
  try {
    const { sourceId, memory } = await request.json() as Record<string, unknown>;
    if (!memory || typeof memory !== 'object') {
      return Response.json({ error: 'A learning memory is required.' }, { status: 400 });
    }

    const record = memory as Record<string, unknown>;
    const type = cleanString(record.type, 60).toUpperCase();
    const label = cleanString(record.label, 100);
    const summary = cleanString(record.summary, 500);
    const confidence = cleanString(record.confidence, 40);
    const tags = Array.isArray(record.tags)
      ? record.tags.filter((value): value is string => typeof value === 'string').map((value) => cleanString(value, 60)).filter(Boolean).slice(0, 8)
      : [];

    if (!ALLOWED_TYPES.has(type) || !label || !summary) {
      return Response.json({ error: 'The proposed memory is not valid.' }, { status: 400 });
    }

    const user = await getChatGPTUser();
    if (!user) {
      return Response.json({ persisted: false, accountRequired: true }, { status: 200 });
    }

    const candidate: LearningMemoryCandidate = {
      type: type as LearningMemoryCandidate['type'],
      label,
      summary,
      tags,
      confidence: confidence === 'user_confirmed' || confidence === 'observed' ? confidence : 'working',
    };

    const id = await saveLearningMemory(
      user.userId,
      typeof sourceId === 'string' ? sourceId : null,
      candidate,
    );

    return Response.json({ persisted: Boolean(id), id });
  } catch {
    return Response.json({ error: 'Unable to remember this learning right now.' }, { status: 500 });
  }
}
