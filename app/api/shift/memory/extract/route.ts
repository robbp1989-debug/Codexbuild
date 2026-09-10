import { extractLearningMemories } from '@/server/aiClient';

export async function POST(request: Request) {
  try {
    const { shift } = await request.json() as { shift?: Record<string, unknown> };
    if (!shift || typeof shift !== 'object') {
      return Response.json({ error: 'A completed Shift reflection is required.' }, { status: 400 });
    }

    const memories = await extractLearningMemories(shift);
    return Response.json({ memories });
  } catch {
    return Response.json({ error: 'Unable to extract learning memories.' }, { status: 500 });
  }
}
