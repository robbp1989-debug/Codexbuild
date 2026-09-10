import { getChatGPTUser } from '@/app/chatgpt-auth';
import { analyzeShiftReflection } from '@/server/aiClient';
import { mergeMemoryContext, sanitizeMemoryItems, selectRelevantMemoryContext } from '@/server/memoryContext';
import { loadLearningMemories } from '@/server/persistence';
import { evaluateSafety } from '@/server/safetyCheck';

export async function POST(request: Request) {
  try {
    const { situation, memoryContext, memoryItems } = await request.json() as Record<string, unknown>;
    if (typeof situation !== 'string' || !situation.trim()) {
      return Response.json({ error: 'Please provide a description of what is going on.' }, { status: 400 });
    }

    const safety = evaluateSafety(situation);
    if (safety.isCrisis) {
      return Response.json({
        safetyInterruption: true,
        crisisType: safety.crisisType,
        crisisMessage: safety.crisisMessage,
      });
    }

    const user = await getChatGPTUser();
    let durableMemory: Awaited<ReturnType<typeof loadLearningMemories>> = [];
    if (user) {
      try {
        durableMemory = await loadLearningMemories(user.userId, 120);
      } catch (error) {
        console.info('[SHIFT Memory] Durable retrieval unavailable; using device memory for this request.', error);
      }
    }

    // During the migration period, authenticated D1 memory and device-local compact
    // memory can coexist. The selector rejects raw narratives/unconfirmed
    // interpretations and only forwards the few learned records relevant now.
    const combinedMemory = [...durableMemory, ...sanitizeMemoryItems(memoryItems)];
    const retrieved = selectRelevantMemoryContext(situation, combinedMemory, 6);
    const context = mergeMemoryContext(retrieved, memoryContext);
    const breakdown = await analyzeShiftReflection(situation, context);

    return Response.json({
      safetyInterruption: false,
      isSubstanceUrge: safety.isSubstanceUrge,
      substanceDetails: safety.substanceDetails,
      memoryUsed: context,
      memorySource: durableMemory.length > 0 ? 'account' : 'device_or_none',
      breakdown,
    });
  } catch {
    return Response.json({ error: 'Unable to process this reflection. Please try again.' }, { status: 500 });
  }
}
