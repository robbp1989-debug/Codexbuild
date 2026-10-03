import { getChatGPTUser } from '@/app/chatgpt-auth';
import {
  getOwnedSourceDocument,
  getSourceBucket,
  sourceReviewKey,
} from '@/server/persistence';

export async function GET(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user)
      return Response.json(
        { error: 'Sign in required.', accountRequired: true },
        { status: 401 },
      );
    const id = new URL(request.url).searchParams.get('documentId') || '';
    const source = await getOwnedSourceDocument(user.userId, id);
    if (!source)
      return Response.json(
        { error: 'Private source not found.' },
        { status: 404 },
      );
    const bucket = getSourceBucket();
    if (!bucket)
      return Response.json(
        { error: 'Private source storage is unavailable.' },
        { status: 503 },
      );
    const draft = await bucket.get(sourceReviewKey(source.objectKey));
    if (!draft)
      return Response.json(
        {
          error:
            'No memory review is available for this source. Existing saved learning remains in Account learning memory.',
        },
        { status: 404 },
      );
    const data = (await draft.json()) as {
      memories: unknown[];
      truncated: boolean;
    };
    return Response.json(
      {
        documentId: id,
        memories: data.memories,
        sourceTruncatedForExtraction: data.truncated,
      },
      {
        headers: { 'Cache-Control': 'private, no-store' },
      },
    );
  } catch {
    return Response.json(
      { error: 'Unable to load this private memory review.' },
      { status: 500 },
    );
  }
}
