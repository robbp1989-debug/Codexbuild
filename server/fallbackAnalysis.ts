import type { ArcadeModeType } from '../src/types/index.js';

export interface ShiftBreakdownOutput {
  observation: string;
  possible_emotions: string[];
  confirmed_emotions: string[];
  interpretation: string;
  possible_needs: string[];
  protective_rule_hypothesis: string;
  hypothesis_confidence: 'low' | 'medium' | 'high';
  updated_perspective: string;
  choice: string;
  recommended_skills: string[];
  recommended_games: ArcadeModeType[];
  real_world_experiment: string;
  follow_up_question: string;
}

export function generateFallbackBreakdown(input: string): ShiftBreakdownOutput {
  return {
    observation: input.trim().slice(0, 12000),
    possible_emotions: [], confirmed_emotions: [], possible_needs: [],
    interpretation: 'What meaning, if any, did you attach to this? You can leave this unanswered.',
    protective_rule_hypothesis: 'No protective pattern has been established. You can explore one if you want to.',
    hypothesis_confidence: 'low',
    updated_perspective: 'Your account matters. What is known, what remains uncertain, and what would help you now?',
    choice: 'Choose whether to keep talking, review the situation, or pause.',
    real_world_experiment: 'No experiment is selected. Only choose a safe action you want to try.',
    follow_up_question: 'What would you like help with right now?',
    recommended_skills: [], recommended_games: [],
  };
}
