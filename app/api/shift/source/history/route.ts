import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getOwnedSourceDocument, getSourceBucket } from '@/server/persistence';
import {
  createDetailedHistoryIndex,
  detailedHistoryKey,
  loadDetailedHistoryIndex,
} from '@/server/detailedHistoryStore';
import { indexDetailedHistory } from '@/server/detailedHistoryContext';
import { createEmbeddings } from '@/server/semanticMemory';

export async function GET(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user)
      return Response.json({ error: 'Sign in required.' }, { status: 401 });
    const documentId =
      new URL(request.url).searchParams.get('documentId') || '';
    const { index } = await loadDetailedHistoryIndex(user.userId, documentId);
    return Response.json(
      {
        enabled: Boolean(index?.enabled),
        passagesIndexed: index?.passages.length || 0,
        updates: (index?.passages || [])
          .filter((p) => p.sourceKind === 'direct_user_update')
          .map(({ embedding: _embedding, ...p }) => p),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return Response.json(
      { error: 'Unable to load this private history.' },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user)
      return Response.json({ error: 'Sign in required.' }, { status: 401 });
    const body = (await request.json()) as {
      documentId?: string;
      enabled?: boolean;
      additionalContext?: string;
      removeUpdateId?: string;
    };
    if (!body.documentId || typeof body.enabled !== 'boolean')
      return Response.json(
        { error: 'Choose whether to use this history.' },
        { status: 400 },
      );
    if (body.additionalContext && body.additionalContext.length > 6000)
      return Response.json(
        { error: 'Personal updates must be 6,000 characters or fewer.' },
        { status: 413 },
      );
    const source = await getOwnedSourceDocument(user.userId, body.documentId);
    if (!source)
      return Response.json(
        { error: 'Private source not found.' },
        { status: 404 },
      );
    const bucket = getSourceBucket();
    if (!bucket)
      return Response.json(
        { error: 'Private source storage unavailable.' },
        { status: 503 },
      );
    let { index } = await loadDetailedHistoryIndex(
      user.userId,
      body.documentId,
    );
    if (!index) {
      if (body.enabled) {
        const raw = await bucket.get(source.objectKey);
        if (!raw)
          return Response.json(
            { error: 'Private source text unavailable.' },
            { status: 404 },
          );
        index = await createDetailedHistoryIndex(await raw.text());
      } else index = { version: 1, enabled: false, passages: [] };
    }
    if (body.enabled && index.passages.length === 0) {
      const raw = await bucket.get(source.objectKey);
      if (!raw)
        return Response.json(
          { error: 'Private source text unavailable.' },
          { status: 404 },
        );
      index = await createDetailedHistoryIndex(await raw.text());
    }
    if (body.removeUpdateId)
      index.passages = index.passages.filter(
        (p) =>
          p.sourceKind !== 'direct_user_update' || p.id !== body.removeUpdateId,
      );
    const note = body.additionalContext?.trim();
    if (note) {
      const stamp = new Date().toISOString();
      const prefix = crypto.randomUUID();
      const passages = indexDetailedHistory(
        note,
        'direct_user_update',
        stamp,
      ).map((p) => ({
        ...p,
        id: `${prefix}-${p.id}`,
        title: 'Personal history update',
      }));
      const vectors = await createEmbeddings(passages.map((p) => p.text));
      if (vectors?.length === passages.length)
        passages.forEach((p, i) => {
          p.embedding = vectors[i];
        });
      index.passages.push(...passages);
    }
    index.enabled = body.enabled;
    await bucket.put(
      detailedHistoryKey(source.objectKey),
      JSON.stringify(index),
      { httpMetadata: { contentType: 'application/json' } },
    );
    return Response.json({
      saved: true,
      enabled: index.enabled,
      passagesIndexed: index.passages.length,
    });
  } catch {
    return Response.json(
      {
        error:
          'Unable to save this history setting or update. Your input is unchanged.',
      },
      { status: 500 },
    );
  }
}
