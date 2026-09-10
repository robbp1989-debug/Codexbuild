import { getChatGPTUser } from '@/app/chatgpt-auth';
import { continueShiftConversation } from '@/server/aiClient';
import { sanitizeMemoryItems, selectRelevantMemoryContext } from '@/server/memoryContext';
import { loadLearningMemories } from '@/server/persistence';
import { evaluateSafety } from '@/server/safetyCheck';
import { embedMemoryQuery } from '@/server/semanticMemory';

export async function POST(request: Request) {
  try {
    const { message, currentShift, history, memoryItems } = await request.json() as Record<string, unknown>;
    if (typeof message !== 'string' || !message.trim()) {
      return Response.json({ error: 'Please enter what you want to keep talking about.' }, { status: 400 });
    }
    if (!currentShift || typeof currentShift !== 'object') {
      return Response.json({ error: 'An active Shift reflection is required.' }, { status: 400 });
    }

    const safety = evaluateSafety(message);
    if (safety.isCrisis) {
      return Response.json({
        safetyInterruption: true,
        crisisType: safety.crisisType,
        crisisMessage: safety.crisisMessage,
      });
    }

    const shiftRecord = currentShift as Record<string, unknown>;
    const observation = typeof shiftRecord.userEditedObservation === 'string'
      ? shiftRecord.userEditedObservation
      : typeof shiftRecord.observation === 'string'
        ? shiftRecord.observation
        : '';

    const user = await getChatGPTUser();
    let durableMemory: Awaited<ReturnType<typeof loadLearningMemories>> = [];
    if (user) {
      try {
        durableMemory = await loadLearningMemories(user.userId, 120);
      } catch (error) {
        console.info('[SHIFT Memory] Account memory unavailable in Keep Talking; using device learning.', error);
      }
    }

    const combinedMemory = [...durableMemory, ...sanitizeMemoryItems(memoryItems)];
    const retrievalQuery = `${observation}\n${message}`;
    let queryEmbedding: number[] | null = null;
    if (durableMemory.some((memory) => Array.isArray(memory.embedding) && memory.embedding.length > 0)) {
      try {
        queryEmbedding = await embedMemoryQuery(retrievalQuery);
      } catch {
        queryEmbedding = null;
      }
    }
    const relevantMemory = selectRelevantMemoryContext(retrievalQuery, combinedMemory, 6, queryEmbedding);
    const safeHistory = Array.isArray(history)
      ? history
          .filter((turn): turn is { role: 'user' | 'assistant'; content: string } => {
            if (!turn || typeof turn !== 'object') return false;
            const record = turn as Record<string, unknown>;
            return (record.role === 'user' || record.role === 'assistant') && typeof record.content === 'string';
          })
          .slice(-8)
      : [];

    const result = await continueShiftConversation({
      currentShift: shiftRecord,
      userMessage: message.trim(),
      history: safeHistory,
      memoryContext: relevantMemory,
    });

    return Response.json({
      safetyInterruption: false,
      relevantMemory,
      memorySource: durableMemory.length > 0 ? 'account' : 'device_or_none',
      memoryRetrieval: queryEmbedding ? 'semantic_and_lexical' : 'lexical',
      ...result,
    });
  } catch {
    return Response.json({ error: 'Unable to continue this reflection. Please try again.' }, { status: 500 });
  }
}
