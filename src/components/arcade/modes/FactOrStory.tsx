import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { StatementClassification } from '../../../types';
import { CheckCircle2, XCircle, ArrowRight, Eye, Heart, HelpCircle, BrainCircuit } from 'lucide-react';

interface StatementItem {
  id: string;
  text: string;
  correctCategory: StatementClassification;
  explanation: string;
}

const DEFAULT_STATEMENTS: StatementItem[] = [
  {
    id: 's-1',
    text: 'They did not respond to my text message for six hours.',
    correctCategory: 'observation',
    explanation:
      'Time elapsed without a reply is an objective, verifiable event that a digital clock or video camera could record without guessing.',
  },
  {
    id: 's-2',
    text: 'They don’t respect my time or care about our project.',
    correctCategory: 'interpretation',
    explanation:
      'Respect and care are internal motives. Attributing indifference is an interpretation and mind-reading, not a recorded fact.',
  },
  {
    id: 's-3',
    text: 'I felt a sudden clenching in my chest and a surge of panic.',
    correctCategory: 'feeling',
    explanation:
      'Internal somatic sensations and discrete emotional experiences are immediate first-person experiences.',
  },
  {
    id: 's-4',
    text: 'The meeting started at 9:05 AM instead of 9:00 AM.',
    correctCategory: 'observation',
    explanation:
      'Start time is an objective, observable fact.',
  },
  {
    id: 's-5',
    text: 'Whether they saw my email before the presentation.',
    correctCategory: 'unknown',
    explanation:
      'Unless confirmed with read receipts or verbal confirmation, whether they saw it is genuinely unknown.',
  },
  {
    id: 's-6',
    text: 'My manager was passive-aggressive during the sprint retro.',
    correctCategory: 'interpretation',
    explanation:
      '"Passive-aggressive" is an evaluative label. Observable facts would be: "She sighed and looked down when I presented slide 4."',
  },
  {
    id: 's-7',
    text: 'I noticed an impulse to shut down and avoid speaking for the rest of the day.',
    correctCategory: 'feeling',
    explanation:
      'First-person reaction urge noticed directly within one’s own consciousness.',
  },
  {
    id: 's-8',
    text: 'What other deadlines my teammate was balancing this afternoon.',
    correctCategory: 'unknown',
    explanation:
      'Another person’s invisible workload is unknown data unless asked directly.',
  },
];

export const FactOrStoryMode: React.FC<{ onCompleteSession?: () => void }> = ({
  onCompleteSession,
}) => {
  const { playSoftSound, logPracticeSession, activeShift } = useApp();
  const [index, setIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<StatementClassification | null>(null);
  const [score, setScore] = useState(0);

  // Derive dynamic personalized statements from activeShift if present
  const statements: StatementItem[] = React.useMemo(() => {
    if (!activeShift) return DEFAULT_STATEMENTS;

    const obs = activeShift.userEditedObservation || activeShift.observation;
    const interp = activeShift.userEditedInterpretation || activeShift.interpretation;
    const emotions = activeShift.confirmed_emotions.length > 0
      ? activeShift.confirmed_emotions.join(', ')
      : activeShift.possible_emotions.slice(0, 2).join(', ');

    const personalized: StatementItem[] = [
      {
        id: 'user-obs',
        text: obs,
        correctCategory: 'observation',
        explanation: 'Your Scenario Observation: A direct, camera-verifiable record of what physically happened without added motives.',
      },
      {
        id: 'user-interp',
        text: interp,
        correctCategory: 'interpretation',
        explanation: 'Your Scenario Mind Story: The protective catastrophe or assumption your brain formulated in response to ambiguity.',
      },
      {
        id: 'user-feel',
        text: `I noticed an immediate internal surge of ${emotions} and somatic tension.`,
        correctCategory: 'feeling',
        explanation: 'Your Scenario Feeling: First-person somatic and emotional sensations experienced directly in your body.',
      },
      {
        id: 'user-unknown',
        text: 'What other external crises, deadlines, or fatigue the other party was navigating at that moment.',
        correctCategory: 'unknown',
        explanation: 'Your Scenario Unknown: Missing information that cannot be determined without direct inquiry.',
      },
    ];

    return [...personalized, ...DEFAULT_STATEMENTS];
  }, [activeShift]);

  const current = statements[index] || DEFAULT_STATEMENTS[0];

  const categories: {
    id: StatementClassification;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }[] = [
    { id: 'observation', label: 'Direct Observation', icon: Eye, color: 'teal' },
    { id: 'feeling', label: 'First-Person Feeling', icon: Heart, color: 'indigo' },
    { id: 'interpretation', label: 'Assumption / Story', icon: BrainCircuit, color: 'amber' },
    { id: 'unknown', label: 'Unknown Data', icon: HelpCircle, color: 'slate' },
  ];

  const handleSelect = (cat: StatementClassification) => {
    if (selectedCategory !== null) return;
    setSelectedCategory(cat);
    const isCorrect = cat === current.correctCategory;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      playSoftSound('chime');
    } else {
      playSoftSound('tap');
    }

    logPracticeSession({
      mode: 'fact_or_story',
      durationSeconds: 30,
      itemsAttempted: 1,
      userRating: isCorrect ? 'easy' : 'hard',
    });
  };

  const handleNext = () => {
    playSoftSound('tap');
    setSelectedCategory(null);
    if (index < statements.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      setIndex(0);
      if (onCompleteSession) onCompleteSession();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-teal-400 font-semibold uppercase tracking-wider">
            Mode 1: Fact or Story
          </span>
          {activeShift && (
            <span className="px-2 py-0.5 rounded bg-teal-950 border border-teal-500/40 text-teal-300 text-[10px]">
              ⭐ Personalized to Your Scenario
            </span>
          )}
        </div>
        <span>
          Statement {index + 1} of {statements.length}
        </span>
      </div>

      {/* Statement Card */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 text-center">
        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
          Classify this statement
        </span>
        <blockquote className="text-xl sm:text-2xl font-serif text-slate-100 italic leading-relaxed">
          "{current.text}"
        </blockquote>
      </div>

      {/* Classification Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isChosen = selectedCategory === cat.id;
          const isCorrect = cat.id === current.correctCategory;
          const isAnswered = selectedCategory !== null;

          let btnStyle =
            'p-4 rounded-xl border text-sm font-medium flex items-center gap-3 transition-all ';

          if (!isAnswered) {
            btnStyle +=
              'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 text-slate-200 hover:border-slate-700';
          } else if (isCorrect) {
            btnStyle += 'bg-teal-950/50 border-teal-400 text-teal-200';
          } else if (isChosen && !isCorrect) {
            btnStyle += 'bg-amber-950/30 border-amber-500 text-amber-200';
          } else {
            btnStyle += 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-50';
          }

          return (
            <button
              key={cat.id}
              disabled={isAnswered}
              onClick={() => handleSelect(cat.id)}
              className={btnStyle}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-xs">{cat.label}</div>
              </div>
              {isAnswered && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
              )}
              {isAnswered && isChosen && !isCorrect && (
                <XCircle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Psychological Explanation Reveal */}
      {selectedCategory !== null && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                selectedCategory === current.correctCategory
                  ? 'bg-teal-950 text-teal-300 border border-teal-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {selectedCategory === current.correctCategory
                ? 'Accurate Classification'
                : 'Helpful Distinction'}
            </span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {current.explanation}
          </p>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <span>Next Statement</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
