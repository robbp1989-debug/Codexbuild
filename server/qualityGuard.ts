import type { QualityGuardResult, ResearchPacket, ShiftResponseMode } from '../lib/shift-intelligence-types.js';

function urlsIn(text: string): string[] {
  return text.match(/https?:\/\/[^\s)\]}>,]+/g) || [];
}

function containsUnsafeTraumaDirective(reply: string): boolean {
  const unsafe = /\b(force yourself to remember|try to recover (?:the )?memory|recreate (?:the )?(?:event|attack|abuse)|flood yourself|do emdr on yourself|self-administer emdr|keep reliving (?:the )?(?:event|memory|trauma))\b/i;
  const protective = /\b(do not|don't|never|avoid)\b[^.!?]{0,40}\b(force yourself to remember|try to recover (?:the )?memory|recreate (?:the )?(?:event|attack|abuse)|flood yourself|do emdr on yourself|self-administer emdr|keep reliving (?:the )?(?:event|memory|trauma))\b/i;
  return unsafe.test(reply) && !protective.test(reply);
}

function containsUnsafeMedicationDirective(reply: string): boolean {
  const prescriptive = /\b(you should|you need to|go ahead and|just)\b[^.!?]{0,40}\b(stop taking|skip|double|increase|decrease|halve|change)\b[^.!?]{0,30}\b(your )?(medication|medications|meds|dose|lithium|antidepressant|antidepressants|mood stabilizer|mood stabilizers)\b/i;
  const directDose = /\b(take|use)\b[^.!?]{0,20}\b(an? )?(extra|double) dose\b/i;
  return prescriptive.test(reply) || directDose.test(reply);
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

  if (/\b(we diagnosed|i diagnosed|this proves you have|this proves (he|she|they) (has|have))\b/i.test(reply)
    || /\b(you|he|she|they) (?:definitely |clearly )?(?:have|has|are|is) (?:ptsd|bipolar(?: disorder)?|borderline personality disorder|narcissistic personality disorder|a narcissist|a psychopath|a sociopath)\b/i.test(reply)) {
    criticalFailures.push('unsupported_diagnosis');
  }

  if (/\b(he|she|they) (did|said|reacted|acted) (that|this)(?: way)? because\b/i.test(reply)) criticalFailures.push('motive_presented_as_fact');
  if (/\b(he|she|they) (?:is|are|was|were) (?:definitely|clearly|obviously) (?:lying|manipulating|deceiving|retaliating|trying to control|trying to punish)\b/i.test(reply)) {
    criticalFailures.push('motive_presented_as_fact');
  }

  if (/\b(definitely|certainly|without a doubt)\b[^.!?]{0,120}\b(knows|remembered|remembers|protecting|protects|thinks|feels|intends|meant to)\b/i.test(reply)) criticalFailures.push('subjective_state_overcertainty');

  if (/\b(this (?:proves|shows for certain)|definitely|certainly)\b[^.!?]{0,120}\b(trauma|childhood|abuse)\b/i.test(reply)
    || /\b(your|this) (?:reaction|response|fear|feeling) (?:proves|means for certain)\b[^.!?]{0,100}\b(abuse|trauma|childhood)\b/i.test(reply)) {
    criticalFailures.push('trauma_causation_overcertainty');
  }

  if (/\b(dream|intuition|gut feeling|body sensation|physical sensation|reaction)\b[^.!?]{0,100}\b(proves|confirms|shows for certain)\b[^.!?]{0,100}\b(abuse|assault|trauma|memory|event)\b/i.test(reply)
    || /\b(your body remembers|the body remembers)\b[^.!?]{0,100}\b(so|therefore|which means)\b[^.!?]{0,100}\b(it happened|the abuse happened|the event happened)\b/i.test(reply)) {
    criticalFailures.push('memory_or_event_inference_overcertainty');
  }

  if (/\btrauma (?:is|gets|becomes) stored in (?:the |your )?(?:body|hips|shoulders|muscles|fascia|cells)\b/i.test(reply)
    || /\breleas(?:e|es|ing) trauma (?:from|out of) (?:the |your )?(?:body|hips|shoulders|muscles|fascia|cells)\b/i.test(reply)) {
    criticalFailures.push('body_trauma_storage_claim');
  }

  if (containsUnsafeTraumaDirective(reply)) criticalFailures.push('unsafe_trauma_processing_instruction');
  if (containsUnsafeMedicationDirective(reply)) criticalFailures.push('unsafe_medication_direction');

  // Recovery safety is a display-time invariant, not merely prompt guidance. These
  // patterns target prescriptive substance use, not neutral discussion of past use.
  if (/\b(have|take|pour) (yourself )?(a )?(drink|shot)\b/i.test(reply)
    || /\b(alcohol|drinking|getting drunk|drugs?) (?:is|are|will be) (?:what )?you need\b/i.test(reply)
    || /\buse (?:alcohol|drugs?) to (?:calm down|relax|cope|sleep|feel better)\b/i.test(reply)
    || /\b(a drink|alcohol) (?:will|would|can) help you (?:calm down|relax|cope|sleep|feel better)\b/i.test(reply)) {
    criticalFailures.push('substance_presented_as_solution');
  }

  if (/\b(research|science|studies?) (proves?|proven)\b/i.test(reply)) warnings.push('research_overstatement_language');
  if (/\b(always|never)\b[^.!?]{0,100}\b(your pattern|you react|you do this|people like you)\b/i.test(reply)) warnings.push('overgeneralized_user_pattern');
  if (/\b(you(?:'re| are) overreacting|you(?:'re| are) too sensitive|you should(?:n't| not) be (?:angry|upset|hurt)|there(?:'s| is) no reason to be (?:angry|upset|hurt))\b/i.test(reply)) {
    warnings.push('emotion_or_impact_invalidation');
  }
  if (/\b(you should|you need to) (?:just )?(forgive|accept|let it go|get over it|move on)\b/i.test(reply)
    || /\byou owe (?:him|her|them) forgiveness\b/i.test(reply)
    || /\bunderstanding (?:them|him|her) means (?:accepting|forgiving|letting it go)\b/i.test(reply)) {
    warnings.push('boundary_may_be_overridden');
  }
  if (/\b(ignore|disregard) (?:what )?(?:your )?(therapist|counselor|psychiatrist|doctor|medical provider|sponsor)\b/i.test(reply)) {
    warnings.push('professional_care_may_be_overridden');
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
  return `Revise the draft before display. Critical failures: ${result.criticalFailures.join(', ') || 'none'}. Warnings: ${result.warnings.join(', ') || 'none'}. Preserve the useful content, but answer the actual question, separate fact from interpretation/hypothesis, remove motive or trauma-causation certainty and unsupported diagnosis, never use sensations/dreams/reactions as proof of an unverified past event, do not claim trauma is literally stored or released from body parts, validate impact without overriding boundaries, never present alcohol or drugs as the solution, do not prescribe medication changes or self-directed intensive trauma procedures, do not override professional care, calibrate uncertainty, and use only supplied grounded sources. Return only the revised user-facing reply.`;
}
