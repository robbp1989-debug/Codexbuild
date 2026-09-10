import type { ArcadeModeType } from '../src/types';

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
  const lower = input.toLowerCase();

  if (lower.includes('friend') && (lower.includes('answered') || lower.includes('phone') || lower.includes('reply') || lower.includes('text'))) {
    return {
      observation: 'You sent a message to your friend and have not received a reply within your expected timeframe.',
      possible_emotions: ['Anxiety', 'Uncertainty', 'Rejection sensitivity', 'Restlessness'],
      confirmed_emotions: [],
      interpretation: 'Your mind concluded that silence indicates annoyance, diminishing interest, or a relationship rupture.',
      possible_needs: ['connection', 'predictability', 'acceptance', 'clarity'],
      protective_rule_hypothesis: 'If someone becomes distant or slow to reply, I predict I am being rejected, so I need to urgently fix it or protect myself by checking constantly.',
      hypothesis_confidence: 'high',
      updated_perspective: 'A delayed response gives me incomplete information. Silence reflects their current bandwidth or circumstances, not a verified verdict on my worth or our connection.',
      choice: 'Set your phone face down in another room for 45 minutes and focus on one sensory grounding task before rechecking.',
      recommended_skills: ['fact_vs_interpretation', 'prediction_testing', 'pause_before_react'],
      recommended_games: ['fact_or_story', 'known_possible_assumed', 'prediction_lab'],
      real_world_experiment: 'Wait until tomorrow morning before sending any follow-up message, testing whether silence leads to relationship catastrophe.',
      follow_up_question: 'Before your mind explained their silence, what physical sensation did you notice in your chest or stomach?',
    };
  }

  if (lower.includes('boss') || lower.includes('corrected') || lower.includes('meeting') || lower.includes('everyone') || lower.includes('feedback')) {
    return {
      observation: 'During a meeting with colleagues, your supervisor gave corrective feedback regarding your work.',
      possible_emotions: ['Embarrassment', 'Defensiveness', 'Shame', 'Dread'],
      confirmed_emotions: [],
      interpretation: 'Your mind added that public correction means you are perceived as incompetent, inadequate, or at risk of losing standing.',
      possible_needs: ['respect', 'competence', 'safety', 'belonging', 'fairness'],
      protective_rule_hypothesis: 'If my work is critiqued in front of others, I predict public humiliation and professional failure, so I must defend myself or replay the interaction obsessively.',
      hypothesis_confidence: 'high',
      updated_perspective: 'Work feedback evaluates a specific estimate or deliverable, not my overall character or competence. Correction is uncomfortable, but it does not equate to a verdict of unworthiness.',
      choice: 'Write down the single concrete suggestion made without defending or self-berating, then review it after your heart rate settles.',
      recommended_skills: ['fact_vs_interpretation', 'repurposing_standards', 'feel_before_explain'],
      recommended_games: ['both_can_be_true', 'perspective_flip', 'responsibility_split'],
      real_world_experiment: 'Ask a clarifying question on the feedback tomorrow without over-apologizing, testing if professional curiosity is received constructively.',
      follow_up_question: 'What standard did your mind use to evaluate the feedback: learning, or the requirement to appear completely flawless?',
    };
  }

  if (lower.includes('partner') || lower.includes('annoyed') || lower.includes('dinner') || lower.includes('distracted')) {
    return {
      observation: 'Your partner made a comment or appeared distracted, and you experienced an immediate internal wave of irritation.',
      possible_emotions: ['Irritation', 'Hurt', 'Emotional isolation', 'Confusion'],
      confirmed_emotions: [],
      interpretation: 'Your mind interpreted their tone or body language as unloving, critical, or indicating an emotional distance you are responsible for fixing.',
      possible_needs: ['connection', 'being heard', 'respect', 'emotional safety'],
      protective_rule_hypothesis: 'If my partner is not warmly attentive, I predict I am burdensome or unvalued, so I either withdraw defensively or rationalize their behavior.',
      hypothesis_confidence: 'medium',
      updated_perspective: 'Understanding why someone might be tired or stressed does not mean my need for warmth or attention is invalid. Both their fatigue and my desire for connection can exist together.',
      choice: 'Notice the annoyance for ten seconds before either excusing them or snapping; simply breathe and acknowledge that something felt off.',
      recommended_skills: ['feel_before_explain', 'both_can_be_true', 'boundary_setting'],
      recommended_games: ['me_first', 'both_can_be_true', 'boundary_builder'],
      real_world_experiment: 'Share one neutral, calm statement about your evening without analyzing their psychological motives.',
      follow_up_question: 'What did you feel inside your body in the five seconds right after they spoke, before your thoughts formed?',
    };
  }

  if (lower.includes('drink') || lower.includes('alcohol') || lower.includes('high') || lower.includes('substance') || lower.includes('numb')) {
    return {
      observation: 'You noticed a sudden urge to consume alcohol or a substance even though no major external crisis took place.',
      possible_emotions: ['Emotional restlessness', 'Subtle dread', 'Overstimulation', 'Boredom / emptiness'],
      confirmed_emotions: [],
      interpretation: 'Your mind suggested that a chemical change is the fastest or only available way to quiet internal restlessness or emotional volume.',
      possible_needs: ['relief', 'calm', 'autonomy', 'downtime'],
      protective_rule_hypothesis: 'When internal volume or discomfort rises, I predict I cannot tolerate it sober, so I need to turn my mind off immediately.',
      hypothesis_confidence: 'high',
      updated_perspective: 'An urge to alter consciousness is useful data: it signals what emotional discomfort the brain wants to escape. The urge is real, but alcohol is a temporary bypass rather than a solution.',
      choice: 'Name the specific target state your brain wants to alter right now (anxiety, restlessness, overstimulation, or fatigue) and take a 10-minute pause.',
      recommended_skills: ['urge_dissection', 'pause_gap', 'functional_analysis'],
      recommended_games: ['what_do_i_want_changed', 'pause_button', 'prediction_lab'],
      real_world_experiment: 'Engage in a 10-minute physical change of state (e.g. cold water wash, a brisk walk, or changing rooms) and re-rate urge intensity from 1-10.',
      follow_up_question: 'What exact internal feeling does your brain believe a drink would quiet or switch off right now?',
    };
  }

  // Default nuanced breakdown
  return {
    observation: input.length > 10 ? input.trim() : 'An ambiguous event triggered a noticeable shift in your internal state.',
    possible_emotions: ['Uncertainty', 'Apprehension', 'Vulnerability', 'Tension'],
    confirmed_emotions: [],
    interpretation: 'Your mind added an anticipatory meaning to the event, predicting an unwanted consequence or personal deficiency.',
    possible_needs: ['safety', 'predictability', 'autonomy', 'being understood'],
    protective_rule_hypothesis: 'When unpredictable situations arise, I predict negative outcomes, so my system automatically attempts to preemptively control or retreat.',
    hypothesis_confidence: 'medium',
    updated_perspective: 'The first thought that arrives in an activated moment is a hypothesis from an old safety program, not a verified fact about reality today.',
    choice: 'Pause for 30 seconds to separate what is factually verified from what was anticipated, before taking any action.',
    recommended_skills: ['fact_vs_interpretation', 'prediction_testing', 'pause_before_react'],
    recommended_games: ['fact_or_story', 'both_can_be_true', 'prediction_lab'],
    real_world_experiment: 'Observe the situation for 24 hours without acting on your first protective reflex.',
    follow_up_question: 'What is one verified camera fact about what happened, stripped of all inferences?',
  };
}
