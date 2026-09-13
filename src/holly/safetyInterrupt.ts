import {
  evaluateSafety,
  type SafetyCheckResult,
} from '../../server/safetyCheck';
// Prototype only. Reuses SHIFT's crisis guidance; this heuristic is not a clinical assessment.
export function intakeSafety(text: string): SafetyCheckResult {
  const existing = evaluateSafety(text);
  if (existing.isCrisis) return existing;
  if (
    /\b(i (cannot|can't) breathe|i am having a (heart attack|seizure)|i('m| am) bleeding (heavily|uncontrollably)|severe withdrawal (right now|and seizures))\b/i.test(
      text,
    )
  )
    return {
      isCrisis: true,
      crisisType: 'medical_emergency',
      isSubstanceUrge: false,
    };
  if (
    /\b(someone is (attacking|strangling) me|i am being attacked|i('m| am) in immediate danger)\b/i.test(
      text,
    )
  )
    return { isCrisis: true, crisisType: 'abuse', isSubstanceUrge: false };
  return existing;
}
