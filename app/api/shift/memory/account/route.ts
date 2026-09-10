import { getChatGPTUser } from '@/app/chatgpt-auth';
import { archiveAccountMemory, listAccountMemories } from '@/server/accountMemoryControls';

export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ signedIn: false, memories: [] });
    const memories = await listAccountMemories(user.userId, 120);
    return Response.json({ signedIn: true, memories });
  } catch {
    return Response.json({ error: 'Unable to load account memory.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });
    const { memoryId } = await request.json() as { memoryId?: string };
    if (!memoryId) return Response.json({ error: 'Memory id required.' }, { status: 400 });
    const archived = await archiveAccountMemory(user.userId, memoryId);
    return Response.json({ archived });
  } catch {
    return Response.json({ error: 'Unable to remove this account memory.' }, { status: 500 });
  }
}
