import { getChatGPTUser } from '@/app/chatgpt-auth';
import { extractLearningMemories } from '@/server/aiClient';
import { replaceLearningMemoriesForSource } from '@/server/persistence';

export async function POST(request: Request) {
  try {
    const { shift } = await request.json() as { shift?: Record<string, unknown> };
    if (!shift || typeof shift !== 'object') {
      return Response.json({ error: 'A completed Shift reflection is required.' }, { status: 400 });
    }

    const memories = await extractLearningMemories(shift);
    const sourceId = typeof shift.id === 'string' ? shift.id : `shift_${crypto.randomUUID()}`;
    const user = await getChatGPTUser();
    let persisted = false;

    if (user) {
      try {
        persisted = await replaceLearningMemoriesForSource(user.userId, sourceId, memories, 'reflection');
      } catch (error) {
        console.info('[SHIFT Memory] Account persistence unavailable; returning compact memories to device.', error);
      }
    }

    return Response.json({ memories, persisted, accountBacked: Boolean(user) });
  } catch {
    return Response.json({ error: 'Unable to extract learning memories.' }, { status: 500 });
  }
}
