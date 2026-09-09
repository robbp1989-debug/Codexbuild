import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { CheckCircle2, ArrowRight, UserCheck, Users, CloudRain, AlertCircle } from 'lucide-react';

type ResponsibilityCategory = 'mine' | 'theirs' | 'outside_control';

interface SplitItem {
  id: string;
  factor: string;
  correct: ResponsibilityCategory;
  explanation: string;
}

const DEFAULT_FACTORS: SplitItem[] = [
  {
    id: 'rs-1',
    factor: 'Whether my coworker feels disappointed when I decline their weekend request.',
    correct: 'theirs',
    explanation: 'Their emotional processing and expectations belong to them. You are responsible for delivering your answer respectfully, not managing their feelings.',
  },
  {
    id: 'rs-2',
    factor: 'Speaking with calm clarity when setting my boundary.',
    correct: 'mine',
    explanation: 'Your tone, timing, and word choice are 100% within your personal agency.',
  },
  {
    id: 'rs-3',
    factor: 'A flight delay caused by sudden mechanical maintenance.',
    correct: 'outside_control',
    explanation: 'Mechanical and atmospheric realities are outside anyone in the room’s personal control.',
  },
  {
    id: 'rs-4',
    factor: 'Deciding how much sleep I prioritize before my Monday presentation.',
    correct: 'mine',
    explanation: 'Your sleep habits and self-care choices belong squarely in your sphere of control.',
  },
  {
    id: 'rs-5',
    factor: 'My supervisor’s overall mood and temperament today.',
    correct: 'theirs',
    explanation: 'Their mood belongs to them. Anxious people often over-function by trying to regulate other adults.',
  },
];

export const ResponsibilitySplit: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { playSoftSound, logPracticeSession } = useApp();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<ResponsibilityCategory | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = DEFAULT_FACTORS[index];

  const handleSelect = (cat: ResponsibilityCategory) => {
    if (selected) return;
    setSelected(cat);
    if (cat === current.correct) {
      playSoftSound('complete');
      setScore((s) => s + 1);
    } else {
      playSoftSound('tap');
    }
  };

  const handleNext = () => {
    playSoftSound('tap');
    if (index + 1 < DEFAULT_FACTORS.length) {
      setIndex((i) => i + 1);
      setSelected(null);
    } else {
      setFinished(true);
      logPracticeSession({
        mode: 'responsibility_split',
        durationSeconds: 45,
        itemsAttempted: DEFAULT_FACTORS.length,
      });
      if (onComplete) onComplete();
    }
  };

  if (finished) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-300 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Responsibility Split Completed!</h2>
        <p className="text-slate-300 text-sm">
          You correctly allocated {score} of {DEFAULT_FACTORS.length} factors.
        </p>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Over-functioning—taking emotional responsibility for other adults—is a major driver of chronic burnout.
        </p>
        <button
          onClick={() => {
            setIndex(0);
            setSelected(null);
            setScore(0);
            setFinished(false);
          }}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
        >
          Practice Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-xs font-mono font-bold uppercase text-teal-400">
            GAME 7: RESPONSIBILITY SPLIT
          </span>
          <h2 className="text-lg font-bold text-slate-100">Agency & Control Allocation</h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Factor {index + 1} of {DEFAULT_FACTORS.length}
        </span>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <span className="text-xs text-slate-400 uppercase tracking-wider block">
          Whose responsibility is this?
        </span>
        <blockquote className="text-base sm:text-lg font-semibold text-slate-100 italic border-l-2 border-teal-400 pl-4 py-1">
          "{current.factor}"
        </blockquote>
      </div>

      {/* 3 Choice Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            key: 'mine' as ResponsibilityCategory,
            label: 'MY RESPONSIBILITY',
            desc: 'My words, boundaries, and choices',
            icon: UserCheck,
            color: 'border-teal-500/40 text-teal-300',
          },
          {
            key: 'theirs' as ResponsibilityCategory,
            label: 'THEIR RESPONSIBILITY',
            desc: 'Their emotions, mood, and reactions',
            icon: Users,
            color: 'border-sky-500/40 text-sky-300',
          },
          {
            key: 'outside_control' as ResponsibilityCategory,
            label: 'OUTSIDE CONTROL',
            desc: 'External circumstances, weather, luck',
            icon: CloudRain,
            color: 'border-amber-500/40 text-amber-300',
          },
        ].map((btn) => {
          const isChosen = selected === btn.key;
          const isCorrect = current.correct === btn.key;
          const Icon = btn.icon;
          let style = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';

          if (selected) {
            if (isCorrect) style = 'bg-teal-950/60 border-teal-400 text-teal-200 font-bold';
            else if (isChosen) style = 'bg-rose-950/50 border-rose-400 text-rose-200';
            else style = 'bg-slate-950 border-slate-900 opacity-40 text-slate-500';
          }

          return (
            <button
              key={btn.key}
              onClick={() => handleSelect(btn.key)}
              disabled={!!selected}
              className={`p-4 rounded-xl border text-left text-xs transition-all cursor-pointer ${style}`}
            >
              <Icon className="w-5 h-5 mb-2 opacity-80" />
              <span className="block font-bold mb-1">{btn.label}</span>
              <span className="text-[11px] text-slate-400 block">{btn.desc}</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 animate-in fade-in">
          <p className="text-xs text-slate-300 leading-relaxed">{current.explanation}</p>
          <div className="flex justify-end pt-1">
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
