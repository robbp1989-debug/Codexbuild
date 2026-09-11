import { getChatGPTUser } from '@/app/chatgpt-auth';
import { continueShiftConversation } from '@/server/aiClient';
import { sanitizeMemoryItems, selectRelevantMemoryContext } from '@/server/memoryContext';
import { loadLearningMemories } from '@/server/persistence';
import { evaluateSafety } from '@/server/safetyCheck';
import { embedMemoryQuery } from '@/server/semanticMemory';

function compact(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function nonRepeatingFallback(message: string, history: Array<{ role: 'user' | 'assistant'; content: string }>) {
  const lower = message.toLowerCase();
  if (/\b(angry|annoyed|frustrated|resentful|mad)\b/.test(lower)) {
    return 'That anger or frustration is worth noticing before we explain anyone else. What happened that felt unacceptable to you, and what did you want instead?';
  }
  if (/\b(scared|afraid|anxious|worried|fear|nervous)\b/.test(lower)) {
    return 'Stay with the fear for a moment before turning it into a theory. What did your mind predict was about to happen, and what do you actually know happened so far?';
  }
  if (/\b(hurt|sad|disappointed|lonely|rejected)\b/.test(lower)) {
    return 'There is something painful there before we try to update the meaning. What part landed as hurt or disappointment, and what did you need in that moment?';
  }
  if (/\b(because|maybe they|i think they|probably they|must have)\b/.test(lower)) {
    return 'We have a good theory. Before we explain it, what happened inside you? Name the feeling, urge, or need that showed up before the analysis took over.';
  }

  const userTurns = history.filter((turn) => turn.role === 'user').length;
  const options = [
    'What part of what you just said feels most important to stay with before we solve it — what happened, what you felt, what it meant to you, or what you wanted instead?',
    'Before moving to a solution, separate the layers for me: what is one thing you know happened, and what meaning did your mind add to it?',
    'If we leave the explanation aside for one moment, what did you most want or need at the point that felt hardest?',
  ];
  return options[userTurns % options.length];
}

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

    // Keep Talking must progress as a conversation even when the hosted model is
    // unavailable and the deterministic AI fallback produces the same sentence.
    // Never repeat the immediately previous SHIFT turn verbatim.
    const previousAssistant = [...safeHistory].reverse().find((turn) => turn.role === 'assistant');
    const reply = previousAssistant && compact(previousAssistant.content) === compact(result.reply)
      ? nonRepeatingFallback(message.trim(), safeHistory)
      : result.reply;

    return Response.json({
      safetyInterruption: false,
      relevantMemory,
      memorySource: durableMemory.length > 0 ? 'account' : 'device_or_none',
      memoryRetrieval: queryEmbedding ? 'semantic_and_lexical' : 'lexical',
      ...result,
      reply,
    });
  } catch {
    return Response.json({ error: 'Unable to continue this reflection. Please try again.' }, { status: 500 });
  }
}
