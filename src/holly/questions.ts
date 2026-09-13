// Examples from the supplied V0–V24 blueprint; wording is adapted for readability.
// Fields without enumerated blueprint choices use optional, non-diagnostic starting points.
const EXAMPLES: Record<string, string[]> = {
  gender_identity: [
    'Woman',
    'Man',
    'Nonbinary',
    'I describe myself another way',
  ],
  entry_reason: [
    'Something is weighing on me',
    'I feel off',
    'My mind won’t calm down',
    'I want to understand myself',
    'I need to think out loud',
    'I feel stressed or overwhelmed',
    'I’m just exploring',
  ],
  current_general_state: [
    'Generally good',
    'Getting by',
    'Up and down',
    'Running on empty',
    'Struggling',
  ],
  current_life_context: [
    'Work or study',
    'Family',
    'Caring for someone',
    'A big change',
    'Figuring out what’s next',
  ],
  important_relationships: [
    'My partner',
    'Family',
    'Friends',
    'Someone who supports me',
    'I’d rather use relationship categories than names',
  ],
  stress_signals: [
    'Racing thoughts',
    'Irritability',
    'Body tension',
    'Trouble sleeping',
    'Withdrawing',
    'Feeling numb',
    'Not noticing until later',
  ],
  accommodations: [
    'One question at a time',
    'Clear, direct wording',
    'More time to respond',
    'Fewer distractions',
    'I’m not sure',
  ],
  faith_spirituality_relevance: [
    'It matters a lot to me',
    'It matters sometimes',
    'Not really',
    'I’m still figuring that out',
  ],
  current_concerns: [
    'Work or study',
    'My relationship',
    'Friendships',
    'Family',
    'Health',
    'My direction in life',
    'How I see myself',
    'Everything feels heavy',
  ],
  recurring_patterns: [
    'Overthinking',
    'Avoiding difficult conversations',
    'Putting other people first',
    'Reacting before I can pause',
    'Getting stuck before taking action',
    'I’m not sure yet',
  ],
  active_goals: [
    'Managing stress',
    'A steadier mood',
    'Confidence',
    'Less overthinking',
    'Relationships',
    'Understanding myself',
    'Sleep',
    'Being kinder to myself',
  ],
  desired_state: [
    'Calmer',
    'More confident',
    'More connected',
    'More like myself',
    'More hopeful',
    'Proud of my progress',
  ],
  support_mode_preference: [
    'Understand it',
    'Get it off my chest',
    'Figure out what to do',
    'Get some relief',
    'Feel less alone',
    'Sit with it for a while',
  ],
  action_barriers: [
    'Not knowing where to start',
    'Overthinking',
    'Fear of getting it wrong',
    'Low energy',
    'Nothing in particular',
  ],
  strengths: [
    'Staying calm under pressure',
    'Persistence',
    'Humor',
    'Showing up',
    'Problem solving',
    'Reaching out',
  ],
  recharge_preferences: [
    'Time alone',
    'Time with people',
    'Being outdoors',
    'Creating something',
    'Movement',
    'Rest',
  ],
  processing_style: [
    'Talking it through',
    'Breaking it into steps',
    'Hearing an example',
    'Being asked helpful questions',
  ],
  interaction_preferences: [
    'Listen before offering advice',
    'Avoid making assumptions',
    'Keep suggestions short',
    'Let me set the pace',
    'Ask before discussing sensitive topics',
  ],
};
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
  ['current_life_context', 'What’s taking up most of life right now?'],
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
    'When something difficult hits, what do you usually want first?',
  ],
  [
    'action_barriers',
    'When you know you want to do something but get stuck, what usually gets in the way?',
  ],
  ['strengths', 'What are you already good at when life gets hard?'],
  ['recharge_preferences', 'What actually helps you recharge?'],
  [
    'processing_style',
    'When you’re trying to work something out, what helps most?',
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
  options: (options || EXAMPLES[target as string] || []) as string[],
}));

export function spokenQuestion(
  question: (typeof QUESTIONS)[number],
  allExamples = false,
): string {
  const options = allExamples ? question.options : question.options.slice(0, 3);
  if (!options.length) return question.prompt;
  return `${question.prompt} Some starting points are: ${options.join('; ')}. These are only examples. You can answer in your own words, combine ideas, or skip.${!allExamples && question.options.length > 3 ? ' Say hear options if you want the full list.' : ''}`;
}
