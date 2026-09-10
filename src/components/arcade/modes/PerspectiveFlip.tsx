import { usePracticeContent } from '../../../context/usePracticeContent';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { CheckCircle2, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

type FlipCategory = 'known' | 'possible' | 'assumed' | 'overgeneralized';

interface FlipItem {
  id: string;
  statement: string;
  correct: FlipCategory;
  explanation: string;
}

export const PerspectiveFlip: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { playSoftSound, logPracticeSession } = useApp();
  const FLIP_ITEMS = usePracticeContent().perspectives;
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<FlipCategory | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const item = FLIP_ITEMS[index];

  const handleSelect = (cat: FlipCategory) => {
    if (selected) return;
    setSelected(cat);
    if (cat === item.correct) {
      playSoftSound('complete');
      setScore((s) => s + 1);
    } else {
      playSoftSound('tap');
    }
  };

  const handleNext = () => {
    playSoftSound('tap');
    if (index + 1 < FLIP_ITEMS.length) {
      setIndex((i) => i + 1);
      setSelected(null);
    } else {
      setFinished(true);
      logPracticeSession({
        mode: 'perspective_flip',
        durationSeconds: 45,
        itemsAttempted: FLIP_ITEMS.length,
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
        <h2 className="text-2xl font-bold text-slate-100">Flexibility Drill Completed!</h2>
        <p className="text-slate-300 text-sm">
          You scored {score} of {FLIP_ITEMS.length} correctly.
        </p>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Spotting <em>Overgeneralizations</em> (words like "always", "never", "everyone") loosens rigid catastrophe scripts.
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
          <span className="text-xs font-mono font-bold uppercase text-sky-400">
            GAME 5: PERSPECTIVE FLIP
          </span>
          <h2 className="text-lg font-bold text-slate-100">Cognitive Flexibility</h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Item {index + 1} of {FLIP_ITEMS.length}
        </span>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <span className="text-xs text-slate-400 uppercase tracking-wider block mb-2">
          Classify this statement:
        </span>
        <blockquote className="text-base sm:text-lg font-semibold text-slate-100 italic border-l-2 border-sky-400 pl-4 py-1">
          "{item.statement}"
        </blockquote>
      </div>

      {/* 4 Options Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'known' as FlipCategory, label: 'KNOWN FACT', desc: 'Direct camera evidence' },
          { key: 'possible' as FlipCategory, label: 'POSSIBLE', desc: 'One realistic explanation' },
          { key: 'assumed' as FlipCategory, label: 'ASSUMED', desc: 'Mind-reading story' },
          { key: 'overgeneralized' as FlipCategory, label: 'OVERGENERALIZED', desc: 'Extreme "always / never"' },
        ].map((btn) => {
          const isChosen = selected === btn.key;
          const isCorrect = item.correct === btn.key;
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
              <span className="block font-bold text-sm mb-0.5">{btn.label}</span>
              <span className="text-[11px] text-slate-400">{btn.desc}</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 animate-in fade-in">
          <p className="text-xs text-slate-300 leading-relaxed">{item.explanation}</p>
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
