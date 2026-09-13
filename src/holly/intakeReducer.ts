import { QUESTIONS } from './questions';
import { restoreItems, type ContextItem } from '../personalization/model';
export interface IntakeState {
  index: number;
  answers: ContextItem[];
  history: ContextItem[];
  skipped: string[];
  phase: 'choice' | 'questions' | 'review' | 'paused';
}
export const initialIntake: IntakeState = {
  index: 0,
  answers: [],
  history: [],
  skipped: [],
  phase: 'choice',
};
export type IntakeAction =
  | { type: 'restore'; state: IntakeState }
  | { type: 'start' | 'back' | 'skip' | 'pause' | 'review' | 'reset' }
  | { type: 'answer'; answer: ContextItem }
  | {
      type: 'revise';
      id: string;
      text?: string;
      status?: ContextItem['status'];
    }
  | { type: 'remove'; id: string };
export function intakeReducer(
  state: IntakeState,
  action: IntakeAction,
): IntakeState {
  if (action.type === 'restore') return restoreIntake(action.state);
  if (action.type === 'reset') return initialIntake;
  if (action.type === 'start')
    return {
      ...state,
      phase: state.index >= QUESTIONS.length ? 'review' : 'questions',
    };
  if (action.type === 'pause') return { ...state, phase: 'paused' };
  if (action.type === 'review') return { ...state, phase: 'review' };
  if (action.type === 'back')
    return {
      ...state,
      index: Math.max(0, state.index - 1),
      phase: 'questions',
    };
  if (action.type === 'remove') {
    const q = state.answers.find((x) => x.id === action.id)?.question_id;
    return {
      ...state,
      answers: state.answers.filter((x) => x.id !== action.id),
      history: state.history.filter((x) => x.question_id !== q),
    };
  }
  if (action.type === 'revise')
    return {
      ...state,
      answers: state.answers.map((x) =>
        x.id === action.id
          ? {
              ...x,
              ...(action.text !== undefined
                ? { text: action.text, status: 'pending' as const }
                : {}),
              ...(action.status ? { status: action.status } : {}),
            }
          : x,
      ),
    };
  if (state.phase !== 'questions') return state;
  const question = QUESTIONS[state.index];
  if (!question) return state;
  const next = {
    index: state.index + 1,
    phase:
      state.index + 1 === QUESTIONS.length
        ? ('review' as const)
        : ('questions' as const),
  };
  if (action.type === 'skip')
    return {
      ...state,
      ...next,
      answers: state.answers.filter((x) => x.question_id !== question.id),
      history: state.history.filter((x) => x.question_id !== question.id),
      skipped: [...new Set([...state.skipped, question.id])],
    };
  if (action.type === 'answer') {
    if (action.answer.question_id !== question.id) return state;
    const prior = state.answers.find((x) => x.question_id === question.id);
    return {
      ...state,
      ...next,
      answers: [
        ...state.answers.filter((x) => x.question_id !== question.id),
        { ...action.answer, status: 'pending', supersedes: prior?.id },
      ],
      history: prior ? [...state.history, prior] : state.history,
      skipped: state.skipped.filter((x) => x !== question.id),
    };
  }
  return state;
}
export function restoreIntake(value: unknown): IntakeState {
  const x = value as IntakeState | null;
  if (
    !x ||
    !Number.isInteger(x.index) ||
    x.index < 0 ||
    x.index > QUESTIONS.length ||
    !Array.isArray(x.answers) ||
    !Array.isArray(x.history)
  )
    return initialIntake;
  return {
    index: x.index,
    phase: 'paused',
    answers: restoreItems(x.answers),
    history: restoreItems(x.history),
    skipped: Array.isArray(x.skipped)
      ? x.skipped.filter((id) => QUESTIONS.some((q) => q.id === id))
      : [],
  };
}
export function parseCommand(text: string) {
  const t = text
    .toLowerCase()
    .replace(/[.!?,]/g, '')
    .replace(/’/g, "'")
    .trim();
  const commands: Record<string, string> = {
    skip: 'skip',
    'prefer not to say': 'skip',
    'repeat that': 'repeat',
    repeat: 'repeat',
    'hear options': 'options',
    'read options': 'options',
    'what are my options': 'options',
    'go back': 'back',
    back: 'back',
    "i'd rather type": 'type',
    'type instead': 'type',
    'what did you hear': 'heard',
    'correct that': 'back',
    'change that': 'back',
    pause: 'pause',
    'stop for now': 'end',
  };
  return commands[t] || null;
}
