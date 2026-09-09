import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { CheckCircle2, XCircle, ArrowRight, Check, HelpCircle, Eye, AlertCircle } from 'lucide-react';

type Category = 'known' | 'possible' | 'assumed';

interface Item {
  id: string;
  statement: string;
  correctCategory: Category;
  explanation: string;
}

const DEFAULT_ITEMS: Item[] = [
  {
    id: 'kpa-1',
    statement: 'They read my text at 2:14 PM according to read receipts.',
    correctCategory: 'known',
    explanation: 'A timestamped read receipt is directly verifiable recorded data.',
  },
  {
    id: 'kpa-2',
    statement: 'They might be in a meeting or dealing with a personal emergency.',
    correctCategory: 'possible',
    explanation: 'This is a plausible hypothesis among several alternative explanations.',
  },
  {
    id: 'kpa-3',
    statement: 'They found my message annoying and are ignoring me on purpose.',
    correctCategory: 'assumed',
    explanation: 'Attributing deliberate malice or irritation without evidence is an unverified assumption.',
  },
  {
    id: 'kpa-4',
    statement: 'The supervisor frowned while reviewing slide 3.',
    correctCategory: 'known',
    explanation: 'A facial expression is an observable camera fact, even if the motive is unverified.',
  },
  {
    id: 'kpa-5',
    statement: 'My project will probably be cancelled by the end of Q3.',
    correctCategory: 'assumed',
    explanation: 'Catastrophizing about future administrative decisions is an anxiety-generated assumption.',
  },
  {
    id: 'kpa-6',
    statement: 'The supervisor might have been squinting to read the small font size on slide 3.',
    correctCategory: 'possible',
    explanation: 'A competing, benign physical explanation that accounts for the observed fact.',
  },
];

export const KnownPossibleAssumed: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { playSoftSound, logPracticeSession } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentItem = DEFAULT_ITEMS[currentIndex];

  const handleSelect = (category: Category) => {
    if (selectedCategory) return;
    setSelectedCategory(category);

    const isCorrect = category === currentItem.correctCategory;
    if (isCorrect) {
      playSoftSound('complete');
      setScore((prev) => prev + 1);
    } else {
      playSoftSound('tap');
    }
  };

  const handleNext = () => {
    playSoftSound('tap');
    if (currentIndex + 1 < DEFAULT_ITEMS.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedCategory(null);
    } else {
      setFinished(true);
      logPracticeSession({
        mode: 'known_possible_assumed',
        durationSeconds: 45,
        itemsAttempted: DEFAULT_ITEMS.length,
      });
      if (onComplete) onComplete();
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedCategory(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-300 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Drill Completed!</h2>
        <p className="text-slate-300 text-sm">
          You correctly classified {score} out of {DEFAULT_ITEMS.length} statements.
        </p>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Holding the distinction between what is <em>Known</em>, what is merely <em>Possible</em>, and what was <em>Assumed</em> protects against premature panic.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={handleRestart}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-xs font-mono font-bold uppercase text-sky-400">
            GAME 2: KNOWN / POSSIBLE / ASSUMED
          </span>
          <h2 className="text-lg font-bold text-slate-100">Information Sorting</h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Item {currentIndex + 1} of {DEFAULT_ITEMS.length}
        </span>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <span className="text-xs text-slate-400 uppercase tracking-wider block">
          Classify this statement:
        </span>
        <blockquote className="text-lg font-medium text-slate-100 italic leading-relaxed border-l-2 border-sky-400 pl-4 py-1">
          "{currentItem.statement}"
        </blockquote>
      </div>

      {/* 3 Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            key: 'known' as Category,
            title: 'KNOWN',
            subtitle: 'Directly verified facts',
            color: 'border-teal-500/40 hover:border-teal-400 text-teal-300',
            bg: 'bg-teal-950/30',
          },
          {
            key: 'possible' as Category,
            title: 'POSSIBLE',
            subtitle: 'One plausible scenario',
            color: 'border-sky-500/40 hover:border-sky-400 text-sky-300',
            bg: 'bg-sky-950/30',
          },
          {
            key: 'assumed' as Category,
            title: 'ASSUMED',
            subtitle: 'Unverified mind-reading',
            color: 'border-amber-500/40 hover:border-amber-400 text-amber-300',
            bg: 'bg-amber-950/30',
          },
        ].map((opt) => {
          const isSelected = selectedCategory === opt.key;
          const isCorrect = currentItem.correctCategory === opt.key;
          let borderStyle = opt.color;

          if (selectedCategory) {
            if (isCorrect) borderStyle = 'border-teal-400 bg-teal-950/50 text-teal-200';
            else if (isSelected) borderStyle = 'border-rose-400 bg-rose-950/50 text-rose-200';
            else borderStyle = 'border-slate-800 opacity-40 text-slate-500';
          }

          return (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              disabled={!!selectedCategory}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${opt.bg} ${borderStyle}`}
            >
              <span className="block text-sm font-bold">{opt.title}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">{opt.subtitle}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation Feedback */}
      {selectedCategory && (
        <div
          className={`p-4 rounded-xl border space-y-2 animate-in fade-in ${
            selectedCategory === currentItem.correctCategory
              ? 'bg-teal-950/40 border-teal-500/50 text-teal-200'
              : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-xs">
            {selectedCategory === currentItem.correctCategory ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Accurate Sorting!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Notice the distinction:</span>
              </>
            )}
          </div>
          <p className="text-xs leading-relaxed text-slate-300">{currentItem.explanation}</p>
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-white text-slate-950 text-xs font-bold cursor-pointer"
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
