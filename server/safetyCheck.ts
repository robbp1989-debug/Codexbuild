export interface SafetyCheckResult {
  isCrisis: boolean;
  crisisType?: 'self_harm' | 'harm_others' | 'overdose' | 'medical_emergency' | 'abuse';
  crisisMessage?: string;
  isSubstanceUrge: boolean;
  substanceDetails?: {
    detectedTarget?: string[];
    guidingPrompt: string;
  };
}

const CRISIS_PATTERNS = [
  {
    type: 'self_harm' as const,
    regex: /\b(kill myself|end my life|commit suicide|suicidal|want to die|slit my wrists|take all my pills|hang myself|better off dead)\b/i,
    message:
      'We hear that you are going through intense pain, but SHIFT cannot provide emergency crisis support. Please connect immediately with free, confidential help available 24/7.',
  },
  {
    type: 'harm_others' as const,
    regex: /\b(kill (him|her|them|everyone)|shoot (him|her|them|up)|stab (him|her|them)|murder)\b/i,
    message:
      'SHIFT cannot assist with situations involving harm or violence toward others. Please reach out to emergency resources immediately.',
  },
  {
    type: 'overdose' as const,
    regex: /\b(overdosing|took too many pills|drank bleach|poisoned myself|heart stopping)\b/i,
    message:
      'This appears to be an acute medical emergency. Please call 911 or visit the nearest emergency room immediately.',
  },
];

const SUBSTANCE_PATTERNS = /\b(want to drink|urge to drink|crave alcohol|need a drink|want a beer|take a shot|want to get high|smoke weed|use drugs|relapse|cravings to use)\b/i;

export function evaluateSafety(input: string): SafetyCheckResult {
  // Check for crisis patterns
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.regex.test(input)) {
      return {
        isCrisis: true,
        crisisType: pattern.type,
        crisisMessage: pattern.message,
        isSubstanceUrge: false,
      };
    }
  }

  // Check for substance / escape urges
  const isSubstanceUrge = SUBSTANCE_PATTERNS.test(input);
  if (isSubstanceUrge) {
    return {
      isCrisis: false,
      isSubstanceUrge: true,
      substanceDetails: {
        guidingPrompt: 'What does your brain believe this would change right now?',
        detectedTarget: [
          'anxiety',
          'inhibition',
          'anger',
          'loneliness',
          'shame',
          'emotional intensity',
          'intrusive thoughts',
          'uncertainty',
          'boredom',
          'need for relief',
        ],
      },
    };
  }

  return {
    isCrisis: false,
    isSubstanceUrge: false,
  };
}
