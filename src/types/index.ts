export type ReflectionStep =
  | 'observe'
  | 'name'
  | 'need'
  | 'interpret'
  | 'rule'
  | 'predict'
  | 'outcome'
  | 'update';

export type RuleStatus = 'active' | 'testing' | 'updated' | 'archived' | 'unresolved' | 'rejected';

export type OutcomeRating =
  | 'better_than_expected'
  | 'about_as_expected'
  | 'worse_than_expected'
  | 'mixed_partly_true'
  | 'still_unfolding'
  | 'not_sure';

export type StatementClassification =
  | 'observation'
  | 'feeling'
  | 'interpretation'
  | 'unknown';

export interface EmotionEntry {
  tag: string;
  intensity: number; // 1 - 10
}

// All Reusable Arcade Game Engines
export type ArcadeModeType =
  | 'cue_response'
  | 'prediction_check'
  | 'kart_lane_runner_3d'
  | 'fact_or_story'
  | 'known_possible_assumed'
  | 'both_can_be_true'
  | 'me_first'
  | 'perspective_flip'
  | 'emotion_decoder'
  | 'responsibility_split'
  | 'boundary_builder'
  | 'pause_button'
  | 'prediction_lab'
  | 'what_do_i_want_changed'
  | 'choose_your_lane'
  | 'rule_recall'
  | 'sequence_sprint'
  | 'cue_response_match'
  | 'evidence_sort'
  | 'scenario_replay'
  | 'urge_surfer_3d'
  | 'reality_target_3d'
  | 'perspective_prism_3d'
  | 'responsibility_scale_3d';

export interface RuleVersion {
  versionId: string;
  versionNumber: number;
  wording: string;
  reasonOrEvidence?: string;
  changeReason?: string;
  createdAt: string;
  status: RuleStatus;
}

export interface ProtectiveRule {
  tags?: string[];
  id: string;
  title: string;
  cueContext: string;
  predictedConsequence: string;
  protectiveResponse: string;
  originalWording: string;
  currentPresentDayWording: string;
  status: RuleStatus;
  versionHistory: RuleVersion[];
  linkedReflectionIds: string[];
  supportingEvidence: string[];
  challengingEvidence: string[];
  lastPracticedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PredictionRecord {
  learningNote?: string;
  id: string;
  ruleId?: string;
  reflectionId?: string;
  cueContext: string;
  intendedAction: string;
  fearedConsequence: string;
  predictedOutcome: string;
  confidencePercent: number; // 0 - 100
  committedAt: string;
  status?: 'pending' | 'tested' | 'discarded';
  whatActuallyHappened?: string;
  learningInsight?: string;
  outcomeRecordedAt?: string;
  didFearedOutcomeHappen?: 'yes' | 'partly' | 'no' | 'different_entirely';
  outcomeRating?: OutcomeRating;
  ruleVersionNumber?: number;
  isImmutable?: boolean;
}

export interface OutcomeRecord {
  id: string;
  predictionId: string;
  reflectionId: string;
  whatActuallyHappened: string;
  outcomeRating: OutcomeRating;
  didFearedOutcomeHappen: 'yes' | 'partly' | 'no' | 'different_entirely';
  discrepancySummary: string;
  evidenceSupportsOldRule: string;
  evidenceChallengesOldRule: string;
  recordedAt: string;
}

export interface ReflectionRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  observedEvent: string;
  whoWasInvolved?: string;
  whereWasI?: string;
  whatHappenedBefore?: string;
  factsSeparatedFromAssumptions?: boolean;
  emotions: EmotionEntry[];
  bodySensations?: string[];
  urgesOrReactions?: string[];
  firstPersonNotes?: string;
  needsOrValues?: string[];
  desiredBoundaryOrRequest?: string;
  supportiveNextStep?: string;
  mindStory?: string;
  knownFacts?: string;
  assumptions?: string;
  unknowns?: string;
  alternativeExplanations?: string[];
  protectiveRuleId?: string;
  draftRuleCue?: string;
  draftRulePrediction?: string;
  draftRuleResponse?: string;
  ruleDraftFullText?: string;
  userConfirmedRule?: boolean;
  prediction?: PredictionRecord & { ruleVersionNumber?: number; isImmutable?: boolean };
  outcome?: OutcomeRecord;
  presentDayRuleUpdate?: string;
  updateActionTaken?: string;
  isCompleted?: boolean;
  lastStepCompleted?: ReflectionStep;
}

// Strict AI Shift Breakdown Output Schema
export interface ShiftBreakdown {
  id: string;
  rawInput: string;
  createdAt: string;
  updatedAt: string;

  // S - Situation (Observation)
  observation: string;
  userEditedObservation?: string;

  // H - Human Response (Emotions, sensations, urges)
  possible_emotions: string[];
  confirmed_emotions: string[];
  emotionIntensity?: number;
  bodySensations?: string[];
  urgesOrReactions?: string[];

  // I - Interpretation (Mind Story vs Known Facts)
  interpretation: string;
  userEditedInterpretation?: string;

  // F - Function & Needs (Protective Rule Hypothesis)
  possible_needs: string[];
  confirmed_needs: string[];
  protective_rule_hypothesis: string;
  hypothesis_confidence: 'low' | 'medium' | 'high';
  hypothesisUserStatus: 'accepted' | 'rejected' | 'edited' | 'unreviewed';
  userEditedHypothesis?: string;

  // T - Today (Updated Perspective & Choice)
  updated_perspective: string;
  userEditedPerspective?: string;
  choice: string;
  userEditedChoice?: string;
  real_world_experiment: string;
  follow_up_question: string;

  // Skills and Games recommended
  recommended_skills: string[];
  recommended_games: ArcadeModeType[];

  // Personalization transparency: the compact historical learning that was
  // considered for this breakdown. These are comparison points, not conclusions.
  memoryUsed?: string[];
  memorySource?: 'account' | 'device_or_none' | string;

  // State flags
  isSavedToProfile: boolean;
  savePreference: 'remember' | 'session_only' | 'dont_save';
}

// Structured Epistemic Memory
export type EpistemicTag =
  | 'observed_fact'
  | 'first_person_experience'
  | 'working_interpretation'
  | 'protective_rule'
  | 'tested_belief'
  | 'known_boundary';

export type MemoryType =
  | 'CONFIRMED_FACT'
  | 'USER_INTERPRETATION'
  | 'WORKING_HYPOTHESIS'
  | 'CONFIRMED_PATTERN'
  | 'REJECTED_HYPOTHESIS'
  | 'UPDATED_PERSPECTIVE'
  | 'USER_PREFERENCE'
  | 'BOUNDARY'
  | 'CURRENT_GOAL'
  | 'CURRENT_EXPERIMENT'
  | 'PREDICTION'
  | 'OUTCOME'
  | 'HELPFUL_STRATEGY'
  | 'THERAPY_NOTE'
  | 'IMPORTANT_RECENT_EVENT';

export interface EpistemicMemoryItem {
  id: string;
  userId?: string;
  type: MemoryType | EpistemicTag | string;
  content: string;
  status?: 'active' | 'archived' | 'rejected' | 'session_only' | string;
  createdAt: string;
  updatedAt?: string;
  sourceSessionId?: string;
}

// Skill Tree Data Model
export type SkillBranch = 'self_awareness' | 'perspective' | 'relationships' | 'regulation';

export interface SkillNode {
  id: string;
  title: string;
  name?: string;
  branch: SkillBranch;
  description: string;
  level: number | string;
  practiceCount: number;
  recommendedGameId: ArcadeModeType;
  linkedGameEngine?: ArcadeModeType;
  unlocked: boolean;
  status?: 'locked' | 'unlocked' | 'mastered' | 'available' | string;
}

export interface PracticeSession {
  id: string;
  mode: ArcadeModeType;
  date: string;
  durationSeconds: number;
  itemsAttempted: number;
  userRating?: 'easy' | 'hard' | 'need_clue' | 'not_relevant';
}

export interface BoundaryCard {
  id: string;
  title: string;
  situation: string;
  boundary: string;
  request: string;
  nextAction: string;
  fullStatement: string;
  createdAt: string;
  tags: string[];
}

export interface LearnLesson {
  id: string;
  title: string;
  category: string;
  readTime: string;
  keyTakeaway: string;
  coreConcept: string;
  whyItMatters: string;
  reflectionPrompt: string;
  activeRecallQuestion: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  smallActionToTry: string;
}
