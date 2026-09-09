import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { ArrowUp, ArrowDown, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

interface StageCard {
  id: string;
  name: string;
  question: string;
  correctOrder: number;
}

const INITIAL_SHUFFLED_STAGES: StageCard[] = [
  { id: 'interpret', name: 'Interpret', question: 'What story did your mind make about this?', correctOrder: 3 },
  { id: 'observe', name: 'Observe', question: 'What directly happened (observable facts)?', correctOrder: 0 },
  { id: 'predict', name: 'Predict', question: 'What outcome do you forecast before acting?', correctOrder: 5 },
  { id: 'name', name: 'Name', question: 'What discrete emotion and somatic sensations showed up?', correctOrder: 1 },
  { id: 'update', name: 'Update', question: 'What present-day rule fits your life now?', correctOrder: 7 },
  { id: 'need', name: 'Need / Boundary', question: 'What did you need, value, or need to protect?', correctOrder: 2 },
  { id: 'rule', name: 'Protective Rule', question: 'What learned survival rule activated?', correctOrder: 4 },
  { id: 'outcome', name: 'Actual Outcome', question: 'What happened in reality vs. prediction?', correctOrder: 6 },
];

export const SequenceSprintMode: React.FC<{ onCompleteSession?: () => void }> = ({
  onCompleteSession,
}) => {
  const { playSoftSound, logPracticeSession } = useApp();
  const [stages, setStages] = useState<StageCard[]>(INITIAL_SHUFFLED_STAGES);
  const [verified, setVerified] = useState(false);

  const moveUp = (index: number) => {
    if (index === 0) return;
    playSoftSound('tap');
    const next = [...stages];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setStages(next);
    setVerified(false);
  };

  const moveDown = (index: number) => {
    if (index === stages.length - 1) return;
    playSoftSound('tap');
    const next = [...stages];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setStages(next);
    setVerified(false);
  };

  const isCorrectOrder = stages.every((s, i) => s.correctOrder === i);

  const handleVerify = () => {
    setVerified(true);
    if (isCorrectOrder) {
      playSoftSound('complete');
      logPracticeSession({
        mode: 'sequence_sprint',
        durationSeconds: 90,
        itemsAttempted: 8,
        userRating: 'easy',
      });
    } else {
      playSoftSound('tap');
    }
  };

  const handleReset = () => {
    playSoftSound('tap');
    setStages(INITIAL_SHUFFLED_STAGES);
    setVerified(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="text-teal-400 font-semibold uppercase tracking-wider">
          Mode 7: Sequence Sprint
        </span>
        <span>Order the 8 Stages</span>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <h3 className="text-base font-bold text-white">
          Why Does Sequence Matter?
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Arrange the steps in their strict grounding sequence. Starting with observation, emotion, and need reduces the chance that assumptions and mind-reading take over too early.
        </p>
      </div>

      {/* Stage list with reordering controls */}
      <div className="space-y-2">
        {stages.map((stage, i) => {
          const isCurrentInPlace = verified && stage.correctOrder === i;
          const isCurrentOutOfPlace = verified && stage.correctOrder !== i;

          return (
            <div
              key={stage.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                isCurrentInPlace
                  ? 'bg-teal-950/40 border-teal-500/70 text-teal-100'
                  : isCurrentOutOfPlace
                  ? 'bg-amber-950/30 border-amber-500/60 text-amber-200'
                  : 'bg-slate-900/90 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 font-mono text-xs text-teal-300 flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <div>
                  <div className="font-semibold text-sm">{stage.name}</div>
                  <div className="text-xs text-slate-400">{stage.question}</div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  disabled={i === 0}
                  onClick={() => moveUp(i)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-slate-300"
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  disabled={i === stages.length - 1}
                  onClick={() => moveDown(i)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-slate-300"
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verification / Result */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={handleReset}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Order</span>
        </button>

        <div className="flex items-center gap-2">
          {!isCorrectOrder ? (
            <button
              onClick={handleVerify}
              className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Check Sequence
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-teal-300 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                Perfect Sequence!
              </span>
              {onCompleteSession && (
                <button
                  onClick={onCompleteSession}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-medium"
                >
                  Finish
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {verified && isCorrectOrder && (
        <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-800/60 text-xs text-teal-200 leading-relaxed">
          <strong>Psychological sequence locked:</strong> Starting with observation, emotion, and personal need reduces the chance that assumptions take over too early. You preserve first-person grounded reality before cognitive interpretation.
        </div>
      )}
    </div>
  );
};
