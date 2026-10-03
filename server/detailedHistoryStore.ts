import { listAccountSources } from './accountMemoryControls';
import { getOwnedSourceDocument, getSourceBucket } from './persistence';
import { createEmbeddings, embedMemoryQuery } from './semanticMemory';
import {
  indexDetailedHistory,
  selectDetailedHistory,
  type DetailedHistoryIndex,
  type RetrievedHistoryPassage,
} from './detailedHistoryContext';

// This existing private report was explicitly authorized for full-history recall
// by its owner in this task. This is an opaque source opt-in, not a user identity.
const APPROVED_EXISTING_HISTORY_SOURCE_IDS = new Set([
  'doc_007b3f44-91da-420e-a178-eebf422e808d',
]);
export const detailedHistoryKey = (key: string) =>
  `${key}/personal-history.json`;

export async function createDetailedHistoryIndex(
  text: string,
): Promise<DetailedHistoryIndex> {
  const passages = indexDetailedHistory(text);
  for (let offset = 0; offset < passages.length; offset += 80) {
    const batch = passages.slice(offset, offset + 80);
    const vectors = await createEmbeddings(
      batch.map((p) => `${p.title}\n${p.text}`),
    );
    if (vectors?.length === batch.length)
      batch.forEach((p, i) => {
        p.embedding = vectors[i];
      });
  }
  return { version: 1, enabled: true, passages };
}

export async function loadDetailedHistoryIndex(
  userId: string,
  documentId: string,
): Promise<{ index: DetailedHistoryIndex | null; sourceName: string }> {
  const source = await getOwnedSourceDocument(userId, documentId);
  if (!source) throw new Error('Private source unavailable for this account.');
  const bucket = getSourceBucket();
  if (!bucket) throw new Error('Private source storage unavailable.');
  const saved = await bucket.get(detailedHistoryKey(source.objectKey));
  if (saved)
    return {
      index: (await saved.json()) as DetailedHistoryIndex,
      sourceName: source.originalName,
    };
  if (!APPROVED_EXISTING_HISTORY_SOURCE_IDS.has(documentId))
    return { index: null, sourceName: source.originalName };
  const raw = await bucket.get(source.objectKey);
  if (!raw) throw new Error('Private source text unavailable.');
  const index = await createDetailedHistoryIndex(await raw.text());
  await bucket.put(
    detailedHistoryKey(source.objectKey),
    JSON.stringify(index),
    { httpMetadata: { contentType: 'application/json' } },
  );
  return { index, sourceName: source.originalName };
}

export async function retrieveDetailedHistory(
  userId: string,
  query: string,
  currentTurn = query,
): Promise<{
  passages: RetrievedHistoryPassage[];
  available: boolean;
  retrieval: string;
}> {
  const sources = await listAccountSources(userId);
  const candidates: RetrievedHistoryPassage[] = [];
  let available = false;
  for (const source of sources) {
    const { index, sourceName } = await loadDetailedHistoryIndex(
      userId,
      source.id,
    );
    if (!index?.enabled) continue;
    available = true;
    candidates.push(
      ...index.passages.map((p) => ({
        ...p,
        documentId: source.id,
        sourceName,
      })),
    );
  }
  const queryEmbedding = candidates.some((p) => p.embedding?.length)
    ? await embedMemoryQuery(query)
    : null;
  return {
    passages: selectDetailedHistory(
      query,
      candidates,
      queryEmbedding,
      currentTurn,
    ),
    available,
    retrieval: queryEmbedding ? 'semantic_and_lexical' : 'lexical',
  };
}
