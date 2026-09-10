import { useState } from 'react';
import { useApp } from './AppContext';
import { CONTEXT_SCENES, type LifeContextId } from '../data/lifeContexts';
import type { ShiftBreakdown } from '../types';

export function makePracticeExample(context: LifeContextId): ShiftBreakdown {
  const scene = CONTEXT_SCENES[context][0];
  return {
    id: `context-example-${context}`, rawInput: scene.fact, createdAt: '', updatedAt: '',
    observation: scene.fact, interpretation: scene.story,
    possible_emotions: ['uncertainty'], confirmed_emotions: [],
    possible_needs: ['clarity'], confirmed_needs: [],
    protective_rule_hypothesis: 'I must resolve all uncertainty before I can take a next step.',
    hypothesis_confidence: 'low', hypothesisUserStatus: 'unreviewed',
    updated_perspective: 'I can notice my feelings without treating an unverified interpretation as fact.',
    choice: scene.response, real_world_experiment: 'Try a small, appropriate request and notice the response.',
    follow_up_question: 'What did you observe, and what remains uncertain?',
    recommended_skills: ['fact_vs_interpretation'], recommended_games: ['fact_or_story', 'both_can_be_true', 'pause_button'],
    isSavedToProfile: false, savePreference: 'dont_save',
  };
}

export function usePracticeSource(override?: ShiftBreakdown | null) {
  const { activeShift, lifeContext } = useApp();
  // Capture the source at launch. Never mutate or save a sample as a personal reflection.
  const [source] = useState(() => override || (activeShift && !activeShift.id.startsWith('demo-') ? activeShift : makePracticeExample(lifeContext)));
  return source;
}
