export const QUESTIONS = [
  ['preferred_name', 'What would you like me to call you?'],
  [
    'age_range',
    'Which age range are you in? You can skip this.',
    ['Under 18', '18–24', '25–34', '35–44', '45–64', '65 or older'],
  ],
  [
    'gender_identity',
    'Is there a gender identity you want SHIFT to keep in mind, or would you rather skip that?',
  ],
  [
    'therapy_relationship_status',
    'Are you working with a therapist or counselor now, have you in the past, or not really?',
    ['Currently', 'In the past', 'Not really'],
  ],
  [
    'entry_reason',
    'What brought you to SHIFT today? You can say it however you want.',
  ],
  ['current_general_state', 'Overall, how have things been feeling lately?'],
  [
    'current_life_context',
    'What’s taking up most of life right now — work, family, caring for someone, a big change, figuring out what’s next, something else?',
  ],
  [
    'important_relationships',
    'Who matters most in your life right now? You can use relationship categories instead of names.',
  ],
  [
    'stress_signals',
    'When things get hard, what tends to show up first for you?',
  ],
  [
    'accommodations',
    'Are there any diagnoses or ways your brain works that you want SHIFT to accommodate? You can skip this.',
  ],
  [
    'faith_spirituality_relevance',
    'Does faith or spirituality matter in how you make sense of things, or not really?',
  ],
  ['current_concerns', 'What feels heaviest right now?'],
  [
    'recurring_patterns',
    'Are there patterns you catch yourself repeating, even when you wish you wouldn’t?',
  ],
  [
    'active_goals',
    'What are the top one to three things you’d want help working on?',
  ],
  [
    'desired_state',
    'Picture six weeks from now. What would you hope feels different?',
  ],
  [
    'support_mode_preference',
    'When something difficult hits, what do you usually want first — understand it, get it off your chest, figure out what to do, get some relief, feel less alone, sit with it, or something else?',
  ],
  [
    'action_barriers',
    'When you know you want to do something but get stuck, what usually gets in the way?',
  ],
  ['strengths', 'What are you already good at when life gets hard?'],
  ['recharge_preferences', 'What actually helps you recharge?'],
  [
    'processing_style',
    'When you’re trying to work something out, what helps most — talking it through, breaking it into steps, hearing an example, being asked good questions, or something else?',
  ],
  [
    'daily_time_budget',
    'On a normal day, how much time would you realistically want to spend on this?',
    [
      '3–5 minutes',
      '5–10 minutes',
      '10–15 minutes',
      'More than 15 minutes',
      'Not now',
    ],
  ],
  [
    'interaction_preferences',
    'Is there anything important about how you want to be treated here — or anything I should avoid doing — that we haven’t covered?',
  ],
].map(([target, prompt, options], i) => ({
  id: `V${i + 1}`,
  target: target as string,
  prompt: prompt as string,
  options: (options || []) as string[],
}));
