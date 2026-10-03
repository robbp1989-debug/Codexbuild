import { getChatGPTUser } from '@/app/chatgpt-auth';
import { extractDocumentLearningMemories } from '@/server/documentExtraction';
import { createDetailedHistoryIndex, detailedHistoryKey } from '@/server/detailedHistoryStore';
import {
  getSourceBucket,
  registerSourceDocument,
  sourceReviewKey,
  setSourceDocumentExtractionStatus,
} from '@/server/persistence';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const TEXT_EXTENSIONS = ['.txt', '.md', '.markdown', '.json', '.csv'];
const TEXT_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/octet-stream',
]);

function supportsTextExtraction(file: File): boolean {
  const name = file.name.toLowerCase();
  return TEXT_TYPES.has(file.type || 'application/octet-stream') && TEXT_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json(
      { error: 'Sign in with ChatGPT before importing a private source document.', accountRequired: true },
      { status: 401 },
    );
  }

  const bucket = getSourceBucket();
  if (!bucket) {
    return Response.json({ error: 'Private source storage is not active on this deployment yet.' }, { status: 503 });
  }

  try {
    const form = await request.formData();
    if (form.get('approveSourceUpload') !== 'true') {
      return Response.json({ error: 'Approve private source storage and one-time AI review before uploading.' }, { status: 400 });
    }
    const file = form.get('file');
    if (!(file instanceof File)) {
      return Response.json({ error: 'Choose a source file to import.' }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return Response.json({ error: 'Source files must be between 1 byte and 4 MB.' }, { status: 413 });
    }
    if (!supportsTextExtraction(file)) {
      return Response.json(
        {
          error: 'This first import version accepts .txt, .md, .json, and .csv files. PDF and DOCX parsing will be added separately so they are not stored without a reliable extraction path.',
        },
        { status: 415 },
      );
    }

    const documentId = `doc_${crypto.randomUUID()}`;
    const objectKey = `private-sources/${user.userId}/${documentId}`;
    const bytes = await file.arrayBuffer();
    const rawText = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const useDetailedHistory = form.get('useDetailedHistory') === 'true';
    if (useDetailedHistory && (!rawText.trim() || rawText.length > 120000)) {
      return Response.json({ error: 'Full-history text must be nonempty and at most 120,000 characters. Split a longer report into separate uploads.' }, { status: 413 });
    }

    // R2 encrypts all stored objects at rest. The original filename is deliberately
    // omitted from the object key; access is only through the authenticated Worker.
    await bucket.put(objectKey, bytes, {
      httpMetadata: { contentType: file.type || 'text/plain' },
      customMetadata: { documentId, owner: user.userId },
    });

    try {
      const registered = await registerSourceDocument({
        userId: user.userId,
        documentId,
        objectKey,
        originalName: file.name,
        contentType: file.type || 'text/plain',
        byteSize: file.size,
      });
      if (!registered) throw new Error('Account source metadata storage unavailable');
    } catch (error) {
      await bucket.delete(objectKey).catch(() => undefined);
      throw error;
    }

    try {
      if (useDetailedHistory) {
        const index = await createDetailedHistoryIndex(rawText);
        await bucket.put(detailedHistoryKey(objectKey), JSON.stringify(index), { httpMetadata: { contentType: 'application/json' } });
        await setSourceDocumentExtractionStatus(user.userId, documentId, 'completed');
        return Response.json({ documentId, stored: true, extractionStatus: 'completed', historyEnabled: true, passagesIndexed: index.passages.length, reviewRequired: false, sourceTruncatedForExtraction: false });
      }
      const extraction = await extractDocumentLearningMemories(rawText);
      // Drafts stay with the private source. They are never active learning and
      // cannot enter retrieval until a separate explicit Remember this action.
      await bucket.put(sourceReviewKey(objectKey), JSON.stringify(extraction), {
        httpMetadata: { contentType: 'application/json' },
      });
      await setSourceDocumentExtractionStatus(user.userId, documentId, 'completed');

      return Response.json({
        documentId,
        stored: true,
        extractionStatus: 'completed',
        memoriesExtracted: extraction.memories.length,
        memoriesPersisted: 0,
        reviewRequired: true,
        sourceTruncatedForExtraction: extraction.truncated,
        // Never echo the raw document back to the browser.
        memories: extraction.memories,
      });
    } catch (error) {
      await setSourceDocumentExtractionStatus(user.userId, documentId, 'failed').catch(() => undefined);
      console.info('[SHIFT Source Import] Source stored but extraction failed:', error);
      return Response.json(
        {
          documentId,
          stored: true,
          extractionStatus: 'failed',
          error: 'The private source was stored, but its one-time learning extraction could not finish. The source was not added to normal reflection prompts.',
        },
        { status: 202 },
      );
    }
  } catch (error) {
    console.error('[SHIFT Source Import] Upload failed:', error);
    return Response.json({ error: 'Unable to import this source right now.' }, { status: 500 });
  }
}
