import { evaluateSafety } from '@/server/safetyCheck';
import { analyzeShiftReflection } from '@/server/aiClient';
import { mergeMemoryContext, selectRelevantMemoryContext } from '@/server/memoryContext';

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

    // Retrieve only compact, reusable learning memories. Raw event narratives and
    // unconfirmed interpretations are excluded by the selector even if a legacy
    // client still has them in local storage.
    const retrieved = selectRelevantMemoryContext(situation, memoryItems, 6);
    const context = mergeMemoryContext(retrieved, memoryContext);
    const breakdown = await analyzeShiftReflection(situation, context);

    return Response.json({
      safetyInterruption: false,
      isSubstanceUrge: safety.isSubstanceUrge,
      substanceDetails: safety.substanceDetails,
      memoryUsed: context,
      breakdown,
    });
  } catch {
    return Response.json({ error: 'Unable to process this reflection. Please try again.' }, { status: 500 });
  }
}
