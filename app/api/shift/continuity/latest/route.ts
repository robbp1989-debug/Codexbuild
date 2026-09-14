import { getChatGPTUser } from '@/app/chatgpt-auth';
import { loadLatestContinuityArtifact } from '@/server/continuityStore';

export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ artifact: null, accountRequired: true });
    const artifact = await loadLatestContinuityArtifact(user.userId);
    return Response.json({ artifact });
  } catch {
    return Response.json({ artifact: null, error: 'Unable to load the latest continuity note.' }, { status: 500 });
  }
}
