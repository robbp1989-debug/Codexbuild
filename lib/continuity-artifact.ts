import type { ContinuityArtifact } from './shift-intelligence-types.js';

function clean(value: unknown, max = 520): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function list(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map((item) => clean(item, 120)).slice(0, 6)
    : [];
}

function latestUserTurn(history: Array<{ role: 'user' | 'assistant'; content: string }>): string {
  return clean([...history].reverse().find((turn) => turn.role === 'user')?.content, 520);
}

function resultLooksReported(value: string): boolean {
  return /\b(tried|did it|actually happened|what happened|worked|didn'?t work|did not work|felt better|felt worse|turned out|result|instead)\b/i.test(value);
}

export function buildContinuityArtifact(args: {
  currentShift: Record<string, unknown>;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  relevantMemory?: string[];
  professionalLesson?: string;
}): ContinuityArtifact {
  const shift = args.currentShift;
  const history = (args.history || []).slice(-12);
  const latestUser = latestUserTurn(history);
  const observation = clean(shift.userEditedObservation) || clean(shift.observation) || 'I did not record a concise objective event yet.';
  const interpretation = clean(shift.userEditedInterpretation) || clean(shift.interpretation);
  const hypothesis = clean(shift.userEditedHypothesis) || clean(shift.protective_rule_hypothesis);
  const hypothesisStatus = clean(shift.hypothesisUserStatus, 40);
  const updated = clean(shift.userEditedPerspective) || clean(shift.updated_perspective);
  const choice = clean(shift.userEditedChoice) || clean(shift.choice);
  const experiment = clean(shift.real_world_experiment);
  const emotions = list(shift.confirmed_emotions);
  const needs = list(shift.confirmed_needs);
  const urges = list(shift.urgesOrReactions);

  const noticedParts: string[] = [];
  if (emotions.length) noticedParts.push(`Emotions: ${emotions.join(', ')}.`);
  if (needs.length) noticedParts.push(`Needs/values: ${needs.join(', ')}.`);
  if (urges.length) noticedParts.push(`Urges/reactions: ${urges.join(', ')}.`);
  if (latestUser) noticedParts.push(`Latest thing I noticed: ${latestUser}`);

  const factStoryParts = [`What happened: ${observation}`];
  if (interpretation) factStoryParts.push(`Meaning I added: ${interpretation}`);
  if (updated) factStoryParts.push(`More current view: ${updated}`);

  let possiblePattern = 'No durable pattern is established from this event alone.';
  if (hypothesis) {
    if (hypothesisStatus === 'accepted') possiblePattern = `User-confirmed working pattern: ${hypothesis}`;
    else if (hypothesisStatus === 'rejected') possiblePattern = `Rejected explanation to avoid recycling: ${hypothesis}`;
    else possiblePattern = `Working hypothesis only: ${hypothesis}`;
  }

  const priorLesson = clean(args.professionalLesson, 520)
    || clean(args.relevantMemory?.[0], 520)
    || 'No prior lesson was clearly linked in this exchange.';
  const plan = experiment || choice;
  const reportedResult = latestUser && resultLooksReported(latestUser) ? latestUser : '';

  const questions = [
    hypothesis && hypothesisStatus !== 'rejected'
      ? 'What fits, and what does not fit, about this working hypothesis?'
      : 'What pattern, if any, is actually supported across more than this one event?',
    'What emotion, need, preference, or boundary would be useful for me to notice earlier next time?',
    plan
      ? 'What would make this experiment small, safe, and useful enough to practice before the next session?'
      : 'What small present-day experiment would give us useful evidence before the next session?',
  ];

  return {
    whatHappened: observation,
    whatINoticed: noticedParts.join(' ') || 'I have not yet named the internal response clearly.',
    whatShiftHelpedMeSee: factStoryParts.join(' | '),
    possiblePattern,
    pastLessonThisConnectsTo: priorLesson,
    whatITried: reportedResult ? latestUser : plan ? `Not yet recorded as completed. Planned: ${plan}` : 'No experiment or response was recorded yet.',
    whatHappenedResult: reportedResult || 'No outcome is recorded yet.',
    whatIStillDontKnow: hypothesis
      ? 'Whether this working explanation fully fits the present event; it is not established as fact.'
      : 'Whether a recurring pattern is present; one event is not enough to establish one.',
    whatIWantToWorkOnNext: questions.slice(0, 3),
  };
}

export const CONTINUITY_STORAGE_KEY = 'shift_continuity_artifacts_v1';

export interface StoredContinuityArtifact {
  id: string;
  createdAt: string;
  shiftId?: string;
  artifact: ContinuityArtifact;
}
