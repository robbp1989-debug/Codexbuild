export const LIFE_CONTEXTS = [
  { id: 'everyday', title: 'Everyday life', description: 'Friendships, home, plans, and daily uncertainty.' },
  { id: 'service', title: 'Service, hospitality & retail', description: 'Customers, changing shifts, and busy days.' },
  { id: 'caregiving', title: 'Parenting & caregiving', description: 'Shared care, asking for help, and time for yourself.' },
  { id: 'frontline', title: 'Healthcare & frontline work', description: 'Handoffs, teamwork, and recovery between shifts.' },
  { id: 'education', title: 'Students & education', description: 'Learning, feedback, classmates, and deadlines.' },
  { id: 'creative', title: 'Creative & independent work', description: 'Sharing your work, clients, and changing plans.' },
  { id: 'trades', title: 'Trades, transport & physical work', description: 'Crews, schedules, and practical coordination.' },
  { id: 'transitions', title: 'Life changes & pacing', description: 'New routines, job searching, rest, and changing capacity.' },
  { id: 'office', title: 'Office & team projects', description: 'Meetings, messages, feedback, and workload.' },
] as const;

export type LifeContextId = typeof LIFE_CONTEXTS[number]['id'];
export function normalizeLifeContext(value: unknown): LifeContextId {
  return LIFE_CONTEXTS.find(context => context.id === value)?.id ?? 'everyday';
}

interface PracticeScene {
  fact: string;
  story: string;
  possible: string;
  request: string;
  response: string;
}

// Authored fictional practice material, never edits to a user's reflection.
export const CONTEXT_SCENES: Record<LifeContextId, PracticeScene[]> = {
  everyday: [
    { fact: 'A friend cancelled our walk an hour before we planned to meet.', story: 'They cancelled because spending time with me is a burden.', possible: 'Their plans may have changed for a reason I do not know.', request: 'A friend asks for a favor when you already have plans.', response: 'I cannot help at that time. Can we look at another option?' },
    { fact: 'Someone in my household left dishes in the sink overnight.', story: 'They left them there to show that my time does not matter.', possible: 'We may have different expectations about when dishes get done.', request: 'You want to agree on a shared household task.', response: 'Could we agree on who will do the dishes and when?' },
  ],
  service: [
    { fact: 'A customer asked to speak to someone else after I answered their question.', story: 'That customer thinks I am useless at my job.', possible: 'They may want information I do not have.', request: 'You need help answering a customer question.', response: 'I want to give you accurate information. I will check with someone who can help.' },
    { fact: 'The shift schedule changed after I arranged a ride home.', story: 'My needs never matter to anyone here.', possible: 'The person changing the schedule may not know about my ride.', request: 'A change to your shift conflicts with your transport.', response: 'My ride is arranged for the original finish time. Can we discuss coverage?' },
  ],
  caregiving: [
    { fact: 'The person I care for declined the meal I prepared.', story: 'This means I am failing at caring for them.', possible: 'Their appetite or preferences may be different today.', request: 'You need help with the next part of a care routine.', response: 'Could you help with this task while I handle the other part?' },
    { fact: 'A family member has not answered my request to share a care task.', story: 'They expect me to do everything forever.', possible: 'They may not have seen the request yet.', request: 'You want a dependable break with care safely covered.', response: 'Can we agree on a time when you can take over so I can rest?' },
  ],
  frontline: [
    { fact: 'A teammate asked me to repeat part of a handoff.', story: 'They believe I cannot do my role.', possible: 'They may be checking details to understand the handoff.', request: 'You need to clarify a handoff before moving on.', response: 'Which part needs clarifying? Let us check it together.' },
    { fact: 'My teammate was quiet during our break.', story: 'They are quiet because they are angry with me.', possible: 'They may prefer quiet during their break.', request: 'You want time to decompress when coverage is arranged.', response: 'Once coverage is confirmed, I would like a quiet break.' },
  ],
  education: [
    { fact: 'My assignment came back with three requests for revision.', story: 'This proves I do not belong in this class.', possible: 'The feedback may be pointing to skills I can still develop.', request: 'You do not understand part of the assignment feedback.', response: 'Could you show me an example of what this comment means?' },
    { fact: 'A classmate has not replied about our shared study plan.', story: 'They must think I am not worth studying with.', possible: 'They may not have checked their messages.', request: 'The proposed study time does not work for you.', response: 'I cannot make that time. Would another time work?' },
  ],
  creative: [
    { fact: 'A client asked for two changes to a draft.', story: 'They regret choosing me for this work.', possible: 'They may be clarifying their preferences.', request: 'A client requests work beyond the agreed scope.', response: 'That is outside our current agreement. Can we discuss the time and cost first?' },
    { fact: 'My latest creative post received fewer responses than the previous one.', story: 'Nobody will ever care about what I make.', possible: 'The audience or timing may have been different.', request: 'You want specific feedback on a piece of work.', response: 'Could you tell me which part felt clear and which part needs work?' },
  ],
  trades: [
    { fact: 'A delivery arrived later than the scheduled time.', story: 'Everyone will blame me for the delay.', possible: 'Transport conditions may have affected the arrival time.', request: 'A delay changes what your crew can finish today.', response: 'The delivery is late. Can we agree on an updated plan?' },
    { fact: 'A crew member asked me to check a measurement again.', story: 'They think I cannot be trusted with this task.', possible: 'They may want a second check before the next step.', request: 'Instructions for a task are unclear.', response: 'Before I start, can we confirm the instructions and required safety checks?' },
  ],
  transitions: [
    { fact: 'I completed one of the three tasks I planned today.', story: 'Doing less today means I will never make progress.', possible: 'My plan may need adjusting to my available energy or resources.', request: 'A proposed plan exceeds your current capacity.', response: 'That is more than I can manage today. Could we make the plan smaller?' },
    { fact: 'I have not received an update on an application this week.', story: 'The delay proves I have no chance.', possible: 'The review process may still be underway.', request: 'You want information about the next step in an application.', response: 'Could you let me know the expected timeline for an update?' },
  ],
  office: [
    { fact: 'My colleague left three comments on the draft.', story: 'Those comments mean they think I am incompetent.', possible: 'They may be trying to clarify the draft.', request: 'You need more detail about feedback.', response: 'Which change is the priority, and what would a good revision look like?' },
    { fact: 'A new task was added while I was finishing another task.', story: 'I must finish everything immediately or lose their respect.', possible: 'The person assigning it may not know my current workload.', request: 'Two deadlines compete for your available time.', response: 'I can finish one first. Which should take priority?' },
  ],
};

export function buildContextPractice(context: LifeContextId) {
  const scenes = CONTEXT_SCENES[context];
  const factNote = 'This is an observable event in this fictional example. It does not establish anyone’s motive.';
  const storyNote = 'This adds a conclusion that the stated facts do not establish.';
  const possibleNote = 'This is one possibility, not a fact or a reason to dismiss your feelings.';
  const facts = scenes.flatMap((s, i) => [
    { id: `${context}-${i}-fact`, text: s.fact, correctCategory: 'observation' as const, explanation: factNote },
    { id: `${context}-${i}-story`, text: s.story, correctCategory: 'interpretation' as const, explanation: storyNote },
    { id: `${context}-${i}-feeling`, text: 'In this example, I notice that I feel disappointed.', correctCategory: 'feeling' as const, explanation: 'This names a first-person feeling. Your own response may be different.' },
    { id: `${context}-${i}-unknown`, text: `The reason behind this event: ${s.fact}`, correctCategory: 'unknown' as const, explanation: 'The event alone does not tell us the reason.' },
  ]);
  const known = scenes.flatMap((s, i) => [
    { id: `${context}-${i}-known`, statement: s.fact, correctCategory: 'known' as const, explanation: factNote },
    { id: `${context}-${i}-possible`, statement: s.possible, correctCategory: 'possible' as const, explanation: possibleNote },
    { id: `${context}-${i}-assumed`, statement: s.story, correctCategory: 'assumed' as const, explanation: storyNote },
  ]);
  const lanes = scenes.map((s, i) => ({ id: `${context}-lane-${i}`, context: s.request, category: 'request' as const, options: [
    { text: s.response, style: 'clean_direct' as const, feedback: 'This names the need or limit and invites a concrete next step.' },
    { text: 'You never care about what I need!', style: 'aggressive' as const, feedback: 'An absolute accusation can obscure the specific request.' },
    { text: 'Fine. I will do whatever you want, but do not expect me to be happy.', style: 'passive_aggressive' as const, feedback: 'The need is left unstated. A direct request gives the other person clearer information.' },
  ] }));
  return {
    scenes, facts, known,
    perspectives: [...known.map(item => ({ id: item.id, statement: item.statement, correct: item.correctCategory, explanation: item.explanation })), { id: `${context}-generalization`, statement: `After this event, “${scenes[0].fact}”, I conclude that nothing I try will ever go well.`, correct: 'overgeneralized' as const, explanation: 'One event does not establish what will happen every time. “Nothing” and “ever” extend the claim beyond the evidence.' }],
    both: scenes.map((s, i) => ({ id: `${context}-both-${i}`, context: s.fact, sideA: s.possible, sideB: 'I can acknowledge my own feelings and decide what support or information I need.', correctAnswer: 'both' as const, synthesis: 'I can leave room for uncertainty without dismissing my experience. A possible explanation does not excuse harm.' })),
    emotions: scenes.map((s, i) => ({ id: `${context}-emotion-${i}`, situation: `Fictional example: ${s.fact}`, bodySensations: ['The person in this example notices tension and restlessness.'], mindThoughts: [s.story], options: [
      { label: 'Disappointment or frustration', plausible: true, note: 'This could fit. Feelings differ between people; this is not a diagnosis.' },
      { label: 'Worry or uncertainty', plausible: true, note: 'This could fit an uncertain moment. It is not the only possible feeling.' },
      { label: 'A different feeling, or no clear label yet', plausible: true, note: 'You do not need to force an emotion label. Notice what is there.' },
    ] })),
    responsibilities: scenes.flatMap((s, i) => [
      { id: `${context}-mine-${i}`, factor: `Trying a clear request: “${s.response}”`, correct: 'mine' as const, explanation: 'You can work on your request and seek support. You cannot guarantee how it lands.' },
      { id: `${context}-theirs-${i}`, factor: `How the other person interprets my request: ${s.request}`, correct: 'theirs' as const, explanation: 'Their interpretation is not yours to control; your impact still matters.' },
      { id: `${context}-outside-${i}`, factor: 'An unexpected interruption outside either person’s control.', correct: 'outside_control' as const, explanation: 'Not every outcome is caused or controlled by either person.' },
    ]),
    lanes,
    boundaries: scenes.map((s, i) => ({ title: `Practice ${i + 1}: a clear request`, situation: s.request, situationOptions: [s.fact], boundaryOptions: ['I need a plan that respects my available time and capacity.', 'I need more information before I can agree.'], requestOptions: [s.response], nextActionOptions: ['I will check what is possible before committing.', 'I will ask for support with the next step.'] })),
    meFirst: [
      { prompt: 'What happened in this example?', options: [scenes[0].fact, scenes[0].story, 'I already know exactly why it happened.'], correctType: 'self' as const, feedbackIfRedirect: 'Start with the stated event, without adding a motive.', selfLesson: scenes[0].fact },
      { prompt: 'Which response makes room for your own feelings?', options: ['I can notice my feelings, even if I do not have a label yet.', 'Only the other person’s feelings matter.', 'I must decide their motive before noticing my feelings.'], correctType: 'self' as const, feedbackIfRedirect: 'Your experience matters alongside the other person’s.', selfLesson: 'There is no required feeling. Notice your own response.' },
      { prompt: 'What is one clear next step in this example?', options: [scenes[0].response, 'Say nothing and expect the other person to guess.', 'Treat my first interpretation as proven.'], correctType: 'self' as const, feedbackIfRedirect: 'Try a specific request rather than mind-reading.', selfLesson: scenes[0].response },
    ],
    blitz: facts.filter(item => item.correctCategory === 'observation' || item.correctCategory === 'interpretation').map(item => ({ id: item.id, category: 'The camera test', badge: 'Fact vs story', prompt: item.text, options: [
      { label: 'Observable fact', isCorrect: item.correctCategory === 'observation', explanation: item.explanation },
      { label: 'Added interpretation', isCorrect: item.correctCategory === 'interpretation', explanation: item.explanation },
    ] })),
    evidence: scenes.flatMap((s, i) => [
      { id: `${context}-e-${i}`, statement: s.fact, sourceContext: 'Fictional practice: does this prove “My needs never matter”?', defaultCol: 'uncertain' as const },
      { id: `${context}-c-${i}`, statement: `In a fictional follow-up, I asked “${s.response}” and we agreed on a next step.`, sourceContext: 'One example that challenges an absolute rule, not a guarantee.', defaultCol: 'challenges' as const },
    ]),
    cues: lanes.map(s => ({ id: s.id, cue: s.context, options: s.options.map(o => ({ text: o.text, isAdaptive: o.style === 'clean_direct', type: o.style === 'clean_direct' ? 'grounded_adaptive' as const : 'reactive_anxious' as const, rationale: o.feedback })) })),
    rehearsals: scenes.map((s, i) => ({ id: `${context}-rehearsal-${i}`, title: `Everyday practice ${i + 1}`, cue: s.fact, historicalResponse: s.story, suggestedActions: [s.response, 'Pause and separate what I know from what I am assuming.'], suggestedPredictions: ['I predict they may decline my request.', 'I predict we may agree on a next step.'] })),
  };
}
