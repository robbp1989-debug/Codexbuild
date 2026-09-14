import { getChatGPTUser } from '@/app/chatgpt-auth';
import { saveContinuityArtifact } from '@/server/continuityStore';

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const user = await getChatGPTUser();
    if (!user) {
      return Response.json({ persisted: false, accountRequired: true }, { status: 200 });
    }

    const sourceShiftId = typeof body.sourceShiftId === 'string'
      ? body.sourceShiftId.replace(/\s+/g, ' ').trim().slice(0, 160)
      : null;
    const id = await saveContinuityArtifact(user.userId, sourceShiftId, body.artifact);
    if (!id) {
      return Response.json({ error: 'A valid continuity note is required.' }, { status: 400 });
    }
    return Response.json({ persisted: true, id });
  } catch {
    return Response.json({ error: 'Unable to save this continuity note right now.' }, { status: 500 });
  }
}
