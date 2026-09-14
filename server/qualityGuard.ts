import type { QualityGuardResult, ResearchPacket, ShiftResponseMode } from '../lib/shift-intelligence-types.js';

function urlsIn(text: string): string[] {
  return text.match(/https?:\/\/[^\s)\]}>,]+/g) || [];
}

export function evaluateResponseQuality(args: {
  reply: string;
  mode: ShiftResponseMode;
  research: ResearchPacket;
}): QualityGuardResult {
  const reply = args.reply.trim();
  const criticalFailures: string[] = [];
  const warnings: string[] = [];

  if (!reply) criticalFailures.push('empty_response');
  if (/\b(i am|i'm) (your|a) therapist\b/i.test(reply)) criticalFailures.push('therapist_impersonation');
  if (/\b(we diagnosed|i diagnosed|this proves you have|this proves (he|she|they) (has|have))\b/i.test(reply)) criticalFailures.push('unsupported_diagnosis');
  if (/\b(he|she|they) (did|said|reacted|acted) (that|this)(?: way)? because\b/i.test(reply)) criticalFailures.push('motive_presented_as_fact');
  if (/\b(definitely|certainly|without a doubt)\b[^.!?]{0,120}\b(knows|remembered|remembers|protecting|protects|thinks|feels|intends|meant to)\b/i.test(reply)) criticalFailures.push('subjective_state_overcertainty');
  if (/\b(this (?:proves|shows for certain)|definitely|certainly)\b[^.!?]{0,120}\b(trauma|childhood|abuse)\b/i.test(reply)) criticalFailures.push('trauma_causation_overcertainty');

  // Recovery safety is a display-time invariant, not merely prompt guidance. These
  // patterns target prescriptive substance use, not neutral discussion of past use.
  if (/\b(have|take|pour) (yourself )?(a )?(drink|shot)\b/i.test(reply)
    || /\b(alcohol|drinking|getting drunk|drugs?) (?:is|are|will be) (?:what )?you need\b/i.test(reply)
    || /\buse (?:alcohol|drugs?) to (?:calm down|relax|cope|sleep|feel better)\b/i.test(reply)) {
    criticalFailures.push('substance_presented_as_solution');
  }

  if (/\b(research|science|studies?) (proves?|proven)\b/i.test(reply)) warnings.push('research_overstatement_language');
  if (/\b(always|never)\b[^.!?]{0,100}\b(your pattern|you react|you do this|people like you)\b/i.test(reply)) warnings.push('overgeneralized_user_pattern');
  if (/\b(you(?:'re| are) overreacting|you should(?:n't| not) be (?:angry|upset|hurt)|there(?:'s| is) no reason to be (?:angry|upset|hurt))\b/i.test(reply)) {
    warnings.push('emotion_or_impact_invalidation');
  }
  if (/\b(you should|you need to) (?:just )?(forgive|accept|let it go|get over it|move on)\b/i.test(reply)
    || /\bunderstanding (?:them|him|her) means (?:accepting|forgiving|letting it go)\b/i.test(reply)) {
    warnings.push('boundary_may_be_overridden');
  }
  if (args.mode === 'WITNESS' && /\b(here are|you should|try this|step 1|first, do)\b/i.test(reply)) warnings.push('witness_mode_may_be_solving_too_soon');

  const replyUrls = urlsIn(reply);
  const allowed = new Set(args.research.sources.map((source) => source.url));
  if (replyUrls.some((url) => !allowed.has(url))) criticalFailures.push('unapproved_or_fabricated_source_url');
  if (args.research.status === 'unavailable' && /\baccording to (research|studies)|studies show|research shows\b/i.test(reply)) warnings.push('external_claim_when_research_unavailable');

  return {
    passed: criticalFailures.length === 0,
    criticalFailures: Array.from(new Set(criticalFailures)),
    warnings: Array.from(new Set(warnings)),
  };
}

export function qualityRevisionInstruction(result: QualityGuardResult): string {
  if (result.passed && !result.warnings.length) return '';
  return `Revise the draft before display. Critical failures: ${result.criticalFailures.join(', ') || 'none'}. Warnings: ${result.warnings.join(', ') || 'none'}. Preserve the useful content, but answer the actual question, separate fact from interpretation/hypothesis, remove motive or trauma-causation certainty and diagnosis, validate impact without overriding boundaries, never present alcohol or drugs as the solution, calibrate uncertainty, and use only supplied grounded sources. Return only the revised user-facing reply.`;
}
