import { evaluateSafety } from '@/server/safetyCheck';
import { analyzeShiftReflection } from '@/server/aiClient';

export async function POST(request: Request) {
  try {
    const { situation, memoryContext } = await request.json() as Record<string, unknown>;
    if (typeof situation !== 'string' || !situation.trim()) return Response.json({ error: 'Please provide a description of what is going on.' }, { status: 400 });
    const safety = evaluateSafety(situation);
    if (safety.isCrisis) return Response.json({ safetyInterruption: true, crisisType: safety.crisisType, crisisMessage: safety.crisisMessage });
    const context = Array.isArray(memoryContext) ? memoryContext.filter((item): item is string => typeof item === 'string') : undefined;
    const breakdown = await analyzeShiftReflection(situation, context);
    return Response.json({ safetyInterruption: false, isSubstanceUrge: safety.isSubstanceUrge, substanceDetails: safety.substanceDetails, breakdown });
  } catch {
    return Response.json({ error: 'Unable to process this reflection. Please try again.' }, { status: 500 });
  }
}
