import { getChatGPTUser } from '@/app/chatgpt-auth';
import {
  buildHelpfulStrategyMemory,
  buildOutcomeMemory,
  buildRecurringPatternCandidate,
  buildUserLearningMemory,
  derivePredictionEvidenceDirection,
  outcomeDirectionLabel,
  repeatedLearningMessage,
} from '@/server/outcomeLearning';
import {
  savePredictionOutcomeMemory,
  upsertPredictionEvidence,
} from '@/server/outcomeLearningStore';

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

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const predictionId = text(body.predictionId, 120);
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

    const evidenceDirection = derivePredictionEvidenceDirection(didFearedHappen, outcomeRating);
    const directionLabel = outcomeDirectionLabel(evidenceDirection);

    // Device-local Prediction Lab remains usable without an account. Durable
    // account learning only occurs when the user explicitly chooses to remember it.
    if (!rememberForFuture) {
      return Response.json({
        persisted: false,
        remembered: false,
        evidenceDirection,
        directionLabel,
        patternCandidate: null,
      });
    }

    const user = await getChatGPTUser();
    if (!user) {
      return Response.json({
        persisted: false,
        remembered: false,
        accountRequired: true,
        evidenceDirection,
        directionLabel,
        patternCandidate: null,
      });
    }

    const outcomeMemory = buildOutcomeMemory({ didFearedHappen, outcomeRating, learning });
    const savedOutcome = await savePredictionOutcomeMemory({
      userId: user.userId,
      predictionId,
      memory: outcomeMemory,
      consolidateAcrossPredictions: false,
    });

    await upsertPredictionEvidence({
      userId: user.userId,
      predictionId,
      memoryId: savedOutcome.id,
      evidenceType: 'outcome',
      prediction,
      observedOutcome: actualOutcome,
      learning: learning || directionLabel,
    });

    let learningMemoryId: string | null = null;
    let learningEvidenceCount = 0;
    const userLearningMemory = buildUserLearningMemory({ learning, didFearedHappen, outcomeRating });
    if (userLearningMemory) {
      const savedLearning = await savePredictionOutcomeMemory({
        userId: user.userId,
        predictionId,
        memory: userLearningMemory,
        consolidateAcrossPredictions: true,
      });
      learningMemoryId = savedLearning.id;
      learningEvidenceCount = savedLearning.evidenceCount;
    }

    let strategyMemoryId: string | null = null;
    let strategyEvidenceCount = 0;
    const strategyMemory = strategyHelped ? buildHelpfulStrategyMemory(intendedAction) : null;
    if (strategyMemory) {
      const savedStrategy = await savePredictionOutcomeMemory({
        userId: user.userId,
        predictionId,
        memory: strategyMemory,
        consolidateAcrossPredictions: true,
      });
      strategyMemoryId = savedStrategy.id;
      strategyEvidenceCount = savedStrategy.evidenceCount;
      await upsertPredictionEvidence({
        userId: user.userId,
        predictionId,
        memoryId: strategyMemoryId,
        evidenceType: 'strategy_result',
        prediction,
        observedOutcome: actualOutcome,
        learning: `User reported that this response helped: ${intendedAction}`,
      });
    }

    // Repetition earns a question, not an automatic promotion. The browser must
    // still show this candidate and require a separate explicit confirmation action.
    const patternCandidate = buildRecurringPatternCandidate(learning, learningEvidenceCount);

    return Response.json({
      persisted: Boolean(savedOutcome.id),
      remembered: Boolean(savedOutcome.id),
      evidenceDirection,
      directionLabel,
      outcomeMemoryId: savedOutcome.id,
      learningMemoryId,
      learningEvidenceCount,
      repeatedLearningMessage: repeatedLearningMessage(learningEvidenceCount),
      patternCandidate,
      strategyMemoryId,
      strategyEvidenceCount,
    });
  } catch (error) {
    console.error('[SHIFT Evidence] Could not persist prediction outcome:', error);
    return Response.json({ error: 'Unable to save this learning to your account right now.' }, { status: 500 });
  }
}
