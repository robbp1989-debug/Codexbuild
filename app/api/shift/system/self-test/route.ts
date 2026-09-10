import { getChatGPTUser } from '@/app/chatgpt-auth';
import { inspectStorageReadiness, runStorageRoundTripSelfTest } from '@/server/storageSelfTest';

export async function GET() {
  const user = await getChatGPTUser();
  const result = await inspectStorageReadiness(user?.userId);
  return Response.json(result, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST() {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json(
      { error: 'Sign in with ChatGPT before running the account-storage self-test.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const result = await runStorageRoundTripSelfTest(user.userId);
    return Response.json(result, {
      status: result.ready ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json(
      { error: 'The storage self-test could not complete.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
