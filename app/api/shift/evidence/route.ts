import { getChatGPTUser } from '@/app/chatgpt-auth';
import type { LearningMemoryCandidate } from '@/server/aiClient';
import { recordLearningEvidence, saveLearningMemory } from '@/server/persistence';

const FEARED_RESULTS = new Set(['yes', 'partly', 'no', 'different_entirely']);
const OUTCOME_RATINGS = new Set([
  'better_than_expected',
  'about_as_expected',
  'worse_than_expected',
  'mixed_partly_true',
  'still_unfolding',
  'not_sure',
]);

function text(value: unknown, max = 600): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function fearedPhrase(value: string): string {
  switch (value) {
    case 'yes': return 'The feared outcome happened.';
    case 'partly': return 'The feared outcome happened partly.';
    case 'no': return 'The feared outcome did not happen.';
    case 'different_entirely': return 'Something different happened than the feared outcome.';
    default: return 'The result was uncertain.';
  }
}

function ratingPhrase(value: string): string {
  return value.replaceAll('_', ' ');
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const predictionId = text(body.predictionId, 120);
    const sourceShiftId = text(body.sourceShiftId, 120);
    const prediction = text(body.prediction, 900);
    const actualOutcome = text(body.actualOutcome, 1200);
    const learning = text(body.learning, 700);
    const intendedAction = text(body.intendedAction, 700);
    const didFearedHappen = text(body.didFearedHappen, 40);
    const outcomeRating = text(body.outcomeRating, 60);
    const strategyHelped = body.strategyHelped === true;
    const rememberForFuture = body.rememberForFuture === true;

    if (!predictionId || !prediction || !actualOutcome) {
      return Response.json({ error: 'Prediction, outcome, and prediction id are required.' }, { status: 400 });
    }
    if (!FEARED_RESULTS.has(didFearedHappen) || !OUTCOME_RATINGS.has(outcomeRating)) {
      return Response.json({ error: 'Outcome classification is not valid.' }, { status: 400 });
    }

    // Device-local Prediction Lab remains usable without an account. Durable
    // account learning only occurs when the user explicitly chooses to remember it.
    if (!rememberForFuture) {
      return Response.json({ persisted: false, remembered: false });
    }

    const user = await getChatGPTUser();
    if (!user) {
      return Response.json({ persisted: false, remembered: false, accountRequired: true });
    }

    await recordLearningEvidence({
      userId: user.userId,
      sourceShiftId: sourceShiftId || predictionId,
      evidenceType: 'outcome',
      prediction,
      observedOutcome: actualOutcome,
      learning: learning || `${fearedPhrase(didFearedHappen)} Outcome was ${ratingPhrase(outcomeRating)}.`,
    });

    const outcomeSummary = [
      fearedPhrase(didFearedHappen),
      `Compared with the prediction, the outcome was ${ratingPhrase(outcomeRating)}.`,
      learning ? `User takeaway: ${learning}` : '',
    ].filter(Boolean).join(' ');

    const outcomeMemory: LearningMemoryCandidate = {
      type: 'OUTCOME',
      label: 'Prediction tested in real life',
      summary: outcomeSummary.slice(0, 500),
      tags: ['prediction-testing', 'real-world-outcome', didFearedHappen, outcomeRating],
      confidence: 'observed',
    };

    const outcomeMemoryId = await saveLearningMemory(
      user.userId,
      predictionId,
      outcomeMemory,
      'prediction_outcome',
    );

    let strategyMemoryId: string | null = null;
    if (strategyHelped && intendedAction) {
      await recordLearningEvidence({
        userId: user.userId,
        sourceShiftId: sourceShiftId || predictionId,
        memoryId: outcomeMemoryId || undefined,
        evidenceType: 'strategy_result',
        prediction,
        observedOutcome: actualOutcome,
        learning: `User reported that this response helped: ${intendedAction}`,
      });

      const strategyMemory: LearningMemoryCandidate = {
        type: 'HELPFUL_STRATEGY',
        label: 'A response that helped',
        summary: `In a real-world test, the user reported this response was helpful: ${intendedAction}`.slice(0, 500),
        tags: ['tested-strategy', 'user-confirmed-helpful'],
        confidence: 'user_confirmed',
      };
      strategyMemoryId = await saveLearningMemory(
        user.userId,
        predictionId,
        strategyMemory,
        'prediction_outcome',
      );
    }

    return Response.json({
      persisted: Boolean(outcomeMemoryId),
      remembered: Boolean(outcomeMemoryId),
      outcomeMemoryId,
      strategyMemoryId,
    });
  } catch (error) {
    console.error('[SHIFT Evidence] Could not persist prediction outcome:', error);
    return Response.json({ error: 'Unable to save this learning to your account right now.' }, { status: 500 });
  }
}
