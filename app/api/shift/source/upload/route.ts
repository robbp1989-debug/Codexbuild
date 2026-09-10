import { getChatGPTUser } from '@/app/chatgpt-auth';
import { extractDocumentLearningMemories } from '@/server/documentExtraction';
import {
  getSourceBucket,
  registerSourceDocument,
  replaceLearningMemoriesForSource,
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

    // R2 encrypts all stored objects at rest. The original filename is deliberately
    // omitted from the object key; access is only through the authenticated Worker.
    await bucket.put(objectKey, bytes, {
      httpMetadata: { contentType: file.type || 'text/plain' },
      customMetadata: { documentId, owner: user.userId },
    });

    try {
      await registerSourceDocument({
        userId: user.userId,
        documentId,
        objectKey,
        originalName: file.name,
        contentType: file.type || 'text/plain',
        byteSize: file.size,
      });
    } catch (error) {
      await bucket.delete(objectKey).catch(() => undefined);
      throw error;
    }

    try {
      const rawText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      const extraction = await extractDocumentLearningMemories(rawText);
      await replaceLearningMemoriesForSource(user.userId, documentId, extraction.memories, 'document');
      await setSourceDocumentExtractionStatus(user.userId, documentId, 'completed');

      return Response.json({
        documentId,
        stored: true,
        extractionStatus: 'completed',
        memoriesExtracted: extraction.memories.length,
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
