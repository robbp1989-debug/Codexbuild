import type { EvidenceItem, ShiftResponseMode } from '../lib/shift-intelligence-types.js';

const EMOTION_WORDS = /\b(angry|annoyed|frustrated|resentful|mad|hurt|sad|disappointed|lonely|rejected|scared|afraid|anxious|worried|nervous|embarrassed|ashamed|guilty|confused|helpless|overwhelmed|relieved|proud|happy|excited)\b/i;
const WITNESS_WORDS = /\b(witness this|just listen|just hear me|i need to vent|let me vent|don't fix|do not fix|no advice|need to get this out)\b/i;
const THERAPY_PREP_WORDS = /\b(therapy prep|for my therapist|for my counselor|next session|save this for (my )?(therapy|session)|bring this to (my )?(therapist|counselor))\b/i;
const PROCESS_WORDS = /\b(let'?s process|process this|work through this|stuck point|goes back to my childhood|reaction doesn'?t make sense)\b/i;
const PRACTICE_WORDS = /\b(practice this|help me practice|what can i try|behavioral experiment|apply that skill|use what i learned)\b/i;
const RESEARCH_WORDS = /\b(research|studies|study|evidence|science|scientific|source|citation|look up|fact check|is there evidence)\b/i;
const EXTERNAL_DOMAIN_WORDS = /\b(dog|cat|animal|pet|brain|neuroscience|psychology|trauma|ptsd|bipolar|medication|medicine|medical|withdrawal|alcohol|drug|substance|legal|law|rights|employment|payroll|financial|finance|history|historical|statistics|risk|recognize|memory)\b/i;
const FACTUAL_QUESTION = /\b(can|could|does|do|did|is|are|will|would|how|what|when|where|which)\b[\s\S]{0,180}\?/i;
const INTELLECTUALIZING = /\b(because|maybe (he|she|they)|i think (he|she|they)|probably (he|she|they)|must have|the reason (he|she|they)|their trauma|his trauma|her trauma|narciss|attachment style)\b/i;

export function inferResponseMode(message: string): ShiftResponseMode {
  if (WITNESS_WORDS.test(message)) return 'WITNESS';
  if (THERAPY_PREP_WORDS.test(message)) return 'THERAPY_PREP';
  if (PROCESS_WORDS.test(message)) return 'PROCESS';
  if (PRACTICE_WORDS.test(message)) return 'PRACTICE';
  if (RESEARCH_WORDS.test(message) || (FACTUAL_QUESTION.test(message) && EXTERNAL_DOMAIN_WORDS.test(message))) return 'RESEARCH';
  return 'UNDERSTAND';
}

export function needsExternalResearch(message: string, mode = inferResponseMode(message)): boolean {
  if (mode === 'WITNESS' || mode === 'THERAPY_PREP') return false;
  if (mode === 'RESEARCH') return true;
  return FACTUAL_QUESTION.test(message) && EXTERNAL_DOMAIN_WORDS.test(message);
}

export function appearsToExplainBeforeFeeling(message: string): boolean {
  return INTELLECTUALIZING.test(message) && !EMOTION_WORDS.test(message);
}

function clean(value: unknown, max = 900): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

export function buildEvidenceContext(args: {
  userMessage: string;
  currentShift?: Record<string, unknown>;
  memoryContext?: string[];
}): EvidenceItem[] {
  const items: EvidenceItem[] = [];
  const userMessage = clean(args.userMessage, 1600);
  if (userMessage) items.push({ label: 'DIRECT_USER_REPORT', content: userMessage, confidence: 1 });

  const shift = args.currentShift || {};
  const observation = clean(shift.userEditedObservation) || clean(shift.observation);
  if (observation) items.push({ label: 'OBSERVED_CURRENT_EVENT', content: observation, confidence: 0.95 });
  const interpretation = clean(shift.userEditedInterpretation) || clean(shift.interpretation);
  if (interpretation) items.push({ label: 'USER_INTERPRETATION', content: interpretation, confidence: 0.8 });
  const hypothesis = clean(shift.userEditedHypothesis) || clean(shift.protective_rule_hypothesis);
  if (hypothesis) items.push({ label: 'WORKING_HYPOTHESIS', content: hypothesis, confidence: 0.5 });

  for (const memory of (args.memoryContext || []).slice(0, 6)) {
    const content = clean(memory, 700);
    if (!content) continue;
    const label = /WORKING_HYPOTHESIS|REJECTED_HYPOTHESIS/i.test(content)
      ? 'PRIOR_SHIFT_INTERPRETATION'
      : 'STORED_FACT';
    items.push({ label, content, confidence: label === 'STORED_FACT' ? 0.75 : 0.45 });
  }

  return items.slice(0, 12);
}

export function evidenceContextPrompt(items: EvidenceItem[]): string {
  if (!items.length) return '';
  return `\nINTERNAL EVIDENCE MAP (do not expose these labels mechanically):\n${JSON.stringify(items)}\nRules: direct current user statements outrank stored material. OBSERVED_CURRENT_EVENT describes what is reported to have occurred, not another person's motive. USER_INTERPRETATION and WORKING_HYPOTHESIS must remain interpretations/hypotheses. STORED_FACT is historical context and may still be irrelevant to the present.\n`;
}

export function shouldOfferContinuityArtifact(args: {
  mode: ShiftResponseMode;
  userMessage: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}): boolean {
  if (args.mode === 'THERAPY_PREP') return true;
  const userTurns = (args.history || []).filter((turn) => turn.role === 'user').length + 1;
  if (userTurns < 2) return false;
  return /\b(realized|noticed|learned|pattern|boundary|tried|worked|didn'?t work|therapist|counselor|sobriety|urge|prediction|actually happened|understand now)\b/i.test(args.userMessage);
}

export function orchestrationPrompt(args: {
  mode: ShiftResponseMode;
  evidence: EvidenceItem[];
  researchRequired: boolean;
  intellectualizationDetected: boolean;
}): string {
  const modeInstruction: Record<ShiftResponseMode, string> = {
    WITNESS: 'Witness first. Reflect accurately and name possible emotions if helpful. Do not rush into fixing, reframing, teaching or challenging.',
    UNDERSTAND: 'Help explain plausible possibilities while separating observation, impact, interpretation and uncertainty. Do not mind-read.',
    RESEARCH: 'Answer the factual question before reflective processing. Ground material external claims in supplied research sources and state what remains unknown.',
    PROCESS: 'Work one target through EVENT -> MEANING -> EMOTION -> PROTECTION -> PRESENT COST -> EVIDENCE -> UPDATED MEANING -> CHOICE without forced positivity or flooding.',
    PRACTICE: 'Apply a previously learned or user-confirmed skill to this specific situation and define one small safe experiment plus prediction/outcome tracking.',
    THERAPY_PREP: 'Produce concise continuity material suitable for the next professional session. Preserve uncertainty and first-person ownership.',
  };
  return `\nORCHESTRATION\nResponse mode: ${args.mode}. ${modeInstruction[args.mode]}\nResearch required by router: ${args.researchRequired ? 'yes' : 'no'}.\n${args.intellectualizationDetected ? 'The user may be explaining another person before naming their own experience. After answering any direct question, gently return to what happened inside the user before extending the theory.' : ''}\n${evidenceContextPrompt(args.evidence)}`;
}
