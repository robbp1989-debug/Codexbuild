export type FrameworkId = 'cbt' | 'act' | 'dbt' | 'ipt';

export type Difficulty = 'easy' | 'stretch' | 'hard';

export type ViewId = 'practice' | 'arcade' | 'progress' | 'report' | 'science';

export interface Framework {
  id: FrameworkId;
  shortName: string;
  name: string;
  focus: string;
  question: string;
  color: string;
  softColor: string;
}

export interface Drill {
  id: string;
  framework: FrameworkId;
  title: string;
  scenario: string;
  prompt: string;
  cue: string;
  modelResponse: string;
  steps: string[];
  therapistFocus: string;
}

export interface PracticeRecord {
  id: string;
  drillId: string;
  framework: FrameworkId;
  title: string;
  scenario: string;
  response: string;
  takeaway: string;
  confidence: number;
  difficulty: Difficulty;
  recalledBeforeReveal: boolean;
  completedAt: string;
}

export const frameworks: Framework[] = [
  {
    id: 'cbt',
    shortName: 'CBT',
    name: 'Cognitive Behavioral Therapy',
    focus: 'Test the thought',
    question: 'What is the evidence, and what is a more balanced thought?',
    color: '#57d8c4',
    softColor: 'rgba(87, 216, 196, 0.14)',
  },
  {
    id: 'act',
    shortName: 'ACT',
    name: 'Acceptance and Commitment Therapy',
    focus: 'Make room and choose',
    question: 'Can I notice this thought and still move toward what matters?',
    color: '#b8a1ff',
    softColor: 'rgba(184, 161, 255, 0.14)',
  },
  {
    id: 'dbt',
    shortName: 'DBT',
    name: 'Dialectical Behavior Therapy',
    focus: 'Regulate and respond',
    question: 'What skill lowers the intensity enough for wise action?',
    color: '#ffbe68',
    softColor: 'rgba(255, 190, 104, 0.14)',
  },
  {
    id: 'ipt',
    shortName: 'IPT',
    name: 'Interpersonal Psychotherapy',
    focus: 'Name the relationship need',
    question: 'What changed between us, and what needs to be communicated?',
    color: '#72a7ff',
    softColor: 'rgba(114, 167, 255, 0.14)',
  },
];

export const drills: Drill[] = [
  {
    id: 'cbt-camera-test',
    framework: 'cbt',
    title: 'Camera Test',
    scenario: 'A friend read your message six hours ago and has not replied.',
    prompt: 'Separate the observable fact from the automatic story. Then write one balanced alternative.',
    cue: 'Facts first. Stories second.',
    modelResponse: 'Fact: the message shows as read and no reply has arrived. Story: they are upset with me. Balanced alternative: I do not know the reason yet; they may be busy, unsure what to say, or planning to respond later.',
    steps: ['Name only what a camera could record', 'Identify the first interpretation', 'Generate a credible alternative'],
    therapistFocus: 'Mind reading, uncertainty tolerance, and evidence-based alternatives.',
  },
  {
    id: 'cbt-evidence-ledger',
    framework: 'cbt',
    title: 'Evidence Ledger',
    scenario: 'Your manager asks to talk tomorrow and gives no agenda.',
    prompt: 'Write evidence that supports your feared prediction, evidence that challenges it, and what remains unknown.',
    cue: 'A prediction is a hypothesis, not a verdict.',
    modelResponse: 'Supports: there is no agenda, and I made a recent mistake. Challenges: my manager schedules routine check-ins this way and has not said there is a problem. Unknown: the topic and their view of my work.',
    steps: ['State the feared prediction', 'Sort evidence on both sides', 'Keep unknowns visible'],
    therapistFocus: 'Catastrophizing, evidence quality, and alternative explanations.',
  },
  {
    id: 'cbt-reappraisal-quality',
    framework: 'cbt',
    title: 'Believable Reframe',
    scenario: 'You made an error during a presentation and keep thinking, “I ruined everything.”',
    prompt: 'Write a reframe that is accurate enough to believe—not simply positive.',
    cue: 'Useful reframes keep the facts.',
    modelResponse: 'I made a noticeable error and felt embarrassed. One mistake does not define the entire presentation. I can correct the information, learn what caused it, and ask for specific feedback.',
    steps: ['Keep the difficult fact', 'Reduce global conclusions', 'Name a workable next action'],
    therapistFocus: 'All-or-nothing thinking and the credibility of reappraisal.',
  },
  {
    id: 'act-defusion',
    framework: 'act',
    title: 'Name the Thought',
    scenario: 'Before speaking in a meeting, your mind says, “Everyone will see that I do not belong here.”',
    prompt: 'Rewrite the thought using a defusion phrase, then name the value you want to act on.',
    cue: 'Notice the thought without obeying it.',
    modelResponse: 'I am noticing that my mind is telling the “I do not belong” story. I can carry that discomfort and still act from the value of contribution by sharing one prepared point.',
    steps: ['Add “I am noticing…”', 'Name the recurring story', 'Choose one value-led action'],
    therapistFocus: 'Cognitive defusion, willingness, and values-guided action.',
  },
  {
    id: 'act-willingness',
    framework: 'act',
    title: 'Make Room',
    scenario: 'You want to cancel a meaningful plan because anxiety has shown up strongly.',
    prompt: 'Describe how you could make room for the feeling while taking one smaller values-aligned step.',
    cue: 'The goal is flexibility, not zero discomfort.',
    modelResponse: 'I can notice the tight chest and anxious urge without making them the decision-maker. Connection matters to me, so I can attend for twenty minutes and give myself permission to leave if needed.',
    steps: ['Notice the internal experience', 'Name what matters', 'Scale the action to something workable'],
    therapistFocus: 'Experiential avoidance, willingness, and flexible committed action.',
  },
  {
    id: 'act-choice-point',
    framework: 'act',
    title: 'Choice Point',
    scenario: 'After receiving criticism, you feel the urge to withdraw and ignore follow-up messages.',
    prompt: 'Name the “away move,” then write a small “toward move” connected to a value.',
    cue: 'Ask which move serves the life you want.',
    modelResponse: 'Away move: disappear so I do not feel exposed. Toward move: acknowledge the feedback, ask one clarifying question, and take an hour before deciding what I agree with.',
    steps: ['Name the protective move', 'Identify the value at stake', 'Choose the smallest toward move'],
    therapistFocus: 'Avoidance patterns and values-consistent behavior under discomfort.',
  },
  {
    id: 'dbt-stop',
    framework: 'dbt',
    title: 'STOP Before Sending',
    scenario: 'You receive a message that feels dismissive and immediately start typing an angry reply.',
    prompt: 'Apply the STOP skill in your own words before deciding whether to respond.',
    cue: 'Stop. Step back. Observe. Proceed mindfully.',
    modelResponse: 'Stop typing. Put the phone down and take one step back. Observe anger, heat in my face, and the urge to prove my point. Proceed by waiting ten minutes and drafting a factual response without sending it yet.',
    steps: ['Interrupt the automatic action', 'Observe emotion, body, and urge', 'Choose the next effective step'],
    therapistFocus: 'Impulse interruption, mindfulness, and effective responding.',
  },
  {
    id: 'dbt-both-and',
    framework: 'dbt',
    title: 'Both And',
    scenario: 'A family member disappointed you, but you also understand why they made their choice.',
    prompt: 'Write a dialectical statement that holds your feeling and the other reality at the same time.',
    cue: 'Two truths can exist together.',
    modelResponse: 'I am hurt that they changed the plan, and I can understand that they were overwhelmed. Understanding their reason does not erase my disappointment or my need for clearer notice.',
    steps: ['Validate your experience', 'Include the other truth', 'Keep the need or boundary'],
    therapistFocus: 'Dialectical thinking, validation, and reduced polarization.',
  },
  {
    id: 'dbt-wise-mind',
    framework: 'dbt',
    title: 'Wise Mind Signal',
    scenario: 'You must decide whether to confront someone while feeling highly activated.',
    prompt: 'Write what emotion mind says, what reasonable mind says, and what wise mind might choose next.',
    cue: 'Wise mind integrates feeling and fact.',
    modelResponse: 'Emotion mind says confront them now. Reasonable mind says ignore the feeling completely. Wise mind says the issue matters, and I will address it after I regulate enough to speak clearly and safely.',
    steps: ['Hear emotion mind', 'Hear reasonable mind', 'Integrate both into effective action'],
    therapistFocus: 'Emotion regulation and timing of interpersonal action.',
  },
  {
    id: 'ipt-role-transition',
    framework: 'ipt',
    title: 'Role Transition Map',
    scenario: 'A new job has changed your schedule, confidence, and availability to people close to you.',
    prompt: 'Name what was lost, what the new role asks of you, and one conversation that could help.',
    cue: 'Transitions change expectations on both sides.',
    modelResponse: 'I lost familiarity and flexible evenings. The new role asks me to tolerate being new and protect recovery time. I need to tell my partner what this first month requires and agree on one dependable time to connect.',
    steps: ['Name the old role and losses', 'Describe the new demands', 'Plan a direct conversation'],
    therapistFocus: 'Role transitions, grief, and renegotiating expectations.',
  },
  {
    id: 'ipt-communication-analysis',
    framework: 'ipt',
    title: 'Replay the Conversation',
    scenario: 'A conversation with a sibling ended with both of you feeling misunderstood.',
    prompt: 'Reconstruct what was said, what you intended, what you felt, and what you needed to communicate more directly.',
    cue: 'Slow the exchange down line by line.',
    modelResponse: 'I said “forget it,” intending to end the tension. I felt dismissed and wanted reassurance. My words hid the need. A clearer version is: “I felt brushed off. Can you tell me how you understood what I asked?”',
    steps: ['Recall the actual words', 'Name feeling and intention', 'Try a clearer message'],
    therapistFocus: 'Communication patterns, indirect signals, and unmet interpersonal needs.',
  },
  {
    id: 'ipt-dispute',
    framework: 'ipt',
    title: 'Expectation Gap',
    scenario: 'You and a close friend keep arguing about how often you should stay in contact.',
    prompt: 'State each person’s likely expectation without mind reading, then write one specific request.',
    cue: 'Conflict often hides an unspoken expectation.',
    modelResponse: 'My expectation is regular check-ins; their pattern suggests more space, but I need to ask rather than assume. Request: “Could we decide on a rhythm that works for both of us, such as one planned call each week?”',
    steps: ['Name your expectation', 'Mark the other expectation as unknown', 'Make a concrete request'],
    therapistFocus: 'Interpersonal disputes, expectations, and direct negotiation.',
  },
];

export const STORAGE_KEY = 'shift-reflection-arcade-v1';

export function getFramework(id: FrameworkId) {
  return frameworks.find((framework) => framework.id === id) ?? frameworks[0];
}

export function getDrillsForFramework(id: FrameworkId) {
  return drills.filter((drill) => drill.framework === id);
}

export function loadPracticeRecords(): PracticeRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PracticeRecord[]) : [];
  } catch {
    return [];
  }
}

export function savePracticeRecords(records: PracticeRecord[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

