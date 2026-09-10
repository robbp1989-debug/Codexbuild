import { getChatGPTUser } from '@/app/chatgpt-auth';
import { deleteAccountSource, listAccountSources } from '@/server/accountMemoryControls';

export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ signedIn: false, sources: [] });
    const sources = await listAccountSources(user.userId);
    return Response.json({ signedIn: true, sources });
  } catch {
    return Response.json({ error: 'Unable to load private sources.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });
    const { documentId, deleteLearning } = await request.json() as {
      documentId?: string;
      deleteLearning?: boolean;
    };
    if (!documentId) return Response.json({ error: 'Document id required.' }, { status: 400 });
    const deleted = await deleteAccountSource({
      userId: user.userId,
      documentId,
      deleteLearning: Boolean(deleteLearning),
    });
    return Response.json({ deleted, learningDeleted: Boolean(deleteLearning && deleted) });
  } catch {
    return Response.json({ error: 'Unable to delete this private source.' }, { status: 500 });
  }
}
