import type { LearningMemoryCandidate } from './aiClient.js';

export type PredictionEvidenceDirection =
  | 'supports_prediction'
  | 'challenges_prediction'
  | 'mixed_evidence'
  | 'unresolved';

const UNRESOLVED_RATINGS = new Set(['still_unfolding', 'not_sure']);

function clean(value: unknown, max = 700): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

export function derivePredictionEvidenceDirection(
  didFearedHappen: string,
  outcomeRating: string,
): PredictionEvidenceDirection {
  if (UNRESOLVED_RATINGS.has(outcomeRating)) return 'unresolved';
  if (didFearedHappen === 'yes') return 'supports_prediction';
  if (didFearedHappen === 'no' || didFearedHappen === 'different_entirely') return 'challenges_prediction';
  if (didFearedHappen === 'partly') return 'mixed_evidence';
  return 'unresolved';
}

export function outcomeDirectionLabel(direction: PredictionEvidenceDirection): string {
  switch (direction) {
    case 'supports_prediction':
      return 'This result supported the original prediction.';
    case 'challenges_prediction':
      return 'This result challenged the original prediction.';
    case 'mixed_evidence':
      return 'This result provided mixed evidence.';
    default:
      return 'This result is still unresolved.';
  }
}

export function buildOutcomeMemory(args: {
  didFearedHappen: string;
  outcomeRating: string;
  learning?: string;
}): LearningMemoryCandidate {
  const direction = derivePredictionEvidenceDirection(args.didFearedHappen, args.outcomeRating);
  const learning = clean(args.learning, 500);
  const summary = [
    outcomeDirectionLabel(direction),
    `Outcome rating: ${args.outcomeRating.replaceAll('_', ' ')}.`,
    learning ? `User takeaway: ${learning}` : '',
  ].filter(Boolean).join(' ');

  return {
    type: 'OUTCOME',
    label: 'Prediction tested in real life',
    summary: summary.slice(0, 500),
    tags: ['prediction-testing', 'real-world-outcome', direction, args.outcomeRating].slice(0, 8),
    confidence: 'observed',
  };
}

export function buildUserLearningMemory(args: {
  learning?: string;
  didFearedHappen: string;
  outcomeRating: string;
}): LearningMemoryCandidate | null {
  const learning = clean(args.learning, 430);
  if (!learning) return null;
  const direction = derivePredictionEvidenceDirection(args.didFearedHappen, args.outcomeRating);

  // One lived result can support a user-authored updated perspective, but it does
  // not by itself establish a confirmed pattern. Repeated matching outcomes are
  // represented by evidence_count rather than silently changing the memory type.
  return {
    type: 'UPDATED_PERSPECTIVE',
    label: 'Learning from a real-world test',
    summary: learning,
    tags: ['prediction-learning', 'user-authored', direction, args.outcomeRating].slice(0, 8),
    confidence: 'user_confirmed',
  };
}

export function buildHelpfulStrategyMemory(intendedAction: unknown): LearningMemoryCandidate | null {
  const action = clean(intendedAction, 430);
  if (!action) return null;
  return {
    type: 'HELPFUL_STRATEGY',
    label: 'A response that helped',
    summary: `In a real-world test, the user reported this response was helpful: ${action}`.slice(0, 500),
    tags: ['tested-strategy', 'user-confirmed-helpful'],
    confidence: 'user_confirmed',
  };
}

export function repeatedLearningMessage(evidenceCount: number): string | null {
  if (!Number.isFinite(evidenceCount) || evidenceCount < 2) return null;
  if (evidenceCount === 2) return 'You have now reported this same learning after two separate real-world tests.';
  return `You have now reported this same learning after ${Math.floor(evidenceCount)} separate real-world tests.`;
}

export function buildRecurringPatternCandidate(
  learning: unknown,
  evidenceCount: number,
): LearningMemoryCandidate | null {
  const summary = clean(learning, 390);
  if (!summary || !Number.isFinite(evidenceCount) || evidenceCount < 2) return null;

  // This is deliberately only a candidate. Repetition earns a question, not a
  // verdict. It becomes CONFIRMED_PATTERN only after a separate explicit user click.
  return {
    type: 'CONFIRMED_PATTERN',
    label: 'A recurring pattern I confirm',
    summary: `Across ${Math.floor(evidenceCount)} separate real-world tests, I noticed this recurring learning: ${summary}`.slice(0, 500),
    tags: ['user-confirmed-pattern', 'repeated-real-world-learning'],
    confidence: 'user_confirmed',
  };
}
