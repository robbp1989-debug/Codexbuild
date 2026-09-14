export type TherapyLessonSourceType =
  | 'therapist'
  | 'counselor'
  | 'recovery_support'
  | 'medical_professional'
  | 'user_insight'
  | 'shift_working_hypothesis';

export interface TherapyLesson {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  sourceType: TherapyLessonSourceType;
  lessonSummary: string;
  triggerConditions: string[];
  oldPattern: string;
  newSkill: string;
  replacementRule: string;
  example: string;
  prediction: string;
  desiredExperiment: string;
  evidenceObserved: string[];
  confidence: number;
  userConfirmed: boolean;
  active: boolean;
  sensitivityLevel: 'low' | 'medium' | 'high';
}

export interface UserPattern {
  id: string;
  userId: string;
  name: string;
  evidence: string[];
  possibleProtectiveFunction?: string;
  currentCost?: string;
  currentPractice?: string;
  status: 'working_hypothesis' | 'user_confirmed_pattern';
  createdAt: string;
  updatedAt: string;
}

export type EvidenceLabel =
  | 'DIRECT_USER_REPORT'
  | 'OBSERVED_CURRENT_EVENT'
  | 'STORED_FACT'
  | 'USER_INTERPRETATION'
  | 'PRIOR_SHIFT_INTERPRETATION'
  | 'WORKING_HYPOTHESIS'
  | 'EXTERNAL_FACT'
  | 'SCIENTIFIC_EVIDENCE'
  | 'UNKNOWN';

export interface EvidenceItem {
  label: EvidenceLabel;
  content: string;
  source?: string;
  confidence?: number;
}

export type ShiftResponseMode =
  | 'WITNESS'
  | 'UNDERSTAND'
  | 'RESEARCH'
  | 'PROCESS'
  | 'PRACTICE'
  | 'THERAPY_PREP';

export interface ResearchSource {
  title: string;
  url: string;
  sourceType?:
    | 'peer_reviewed_primary'
    | 'systematic_review'
    | 'clinical_guideline'
    | 'government'
    | 'academic_institution'
    | 'professional_organization'
    | 'quality_secondary'
    | 'unknown';
}

export interface ResearchPacket {
  required: boolean;
  status: 'not_needed' | 'grounded' | 'unavailable';
  topic?: string;
  propositions: string[];
  synthesis: string;
  sources: ResearchSource[];
}

export interface ContinuityArtifact {
  whatHappened: string;
  whatINoticed: string;
  whatShiftHelpedMeSee: string;
  possiblePattern: string;
  pastLessonThisConnectsTo: string;
  whatITried: string;
  whatHappenedResult: string;
  whatIStillDontKnow: string;
  whatIWantToWorkOnNext: string[];
}

export interface QualityGuardResult {
  passed: boolean;
  criticalFailures: string[];
  warnings: string[];
}
