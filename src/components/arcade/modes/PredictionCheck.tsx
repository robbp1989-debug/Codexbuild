import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { ReflectionRecord } from '../../../types';
import { Eye, ArrowRight, BookmarkCheck, Scale, CheckCircle2, Zap, Brain } from 'lucide-react';

export const PredictionCheckMode: React.FC<{ onCompleteSession?: () => void }> = ({
  onCompleteSession,
}) => {
  const { reflections, rules, playSoftSound, logPracticeSession } = useApp();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [userRating, setUserRating] = useState<string | null>(null);

  // Filter reflections that have BOTH prediction and outcome
  const pairedReflections = reflections.filter((r) => r.prediction && r.outcome);

  if (pairedReflections.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl max-w-xl mx-auto space-y-3">
        <Scale className="w-8 h-8 text-sky-400 mx-auto" />
        <h3 className="text-base font-semibold text-slate-200">
          No Completed Prediction-Outcome Pairs Yet
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Prediction Check tests your memory of what you feared before learning reality. Complete a reflection with both a prediction and an outcome to practice this mode.
        </p>
      </div>
    );
  }

  const currentRef = pairedReflections[index];
  const pred = currentRef.prediction!;
  const out = currentRef.outcome!;
  const linkedRule = rules.find((r) => r.id === currentRef.protectiveRuleId);

  // Tap-to-match fear options
  const fearOptions = [
    pred.fearedConsequence,
    'They would cut me off and exclude me from the team permanently',
    'Total emotional collapse and inability to function',
  ].sort((a, b) => a.localeCompare(b));

  const handleSelectFearChoice = (text: string) => {
    playSoftSound('chime');
    setRevealed(true);
  };

  const handleReveal = () => {
    playSoftSound('chime');
    setRevealed(true);
  };

  const handleRate = (rating: 'easy' | 'hard' | 'need_clue') => {
    playSoftSound('tap');
    setUserRating(rating);
    logPracticeSession({
      mode: 'prediction_check',
      durationSeconds: 45,
      itemsAttempted: 1,
      userRating: rating,
    });
  };

  const handleNext = () => {
    playSoftSound('tap');
    setRevealed(false);
    setUserRating(null);
    if (index < pairedReflections.length - 1) {
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
            Mode 3: Prediction Check
          </span>
          <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 text-[10px] border border-teal-500/30 flex items-center gap-1 font-sans">
            <Zap className="w-3 h-3" /> Zero-Typing
          </span>
        </div>
        <span>
          Record {index + 1} of {pairedReflections.length}
        </span>
      </div>

      {/* Context Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <span className="text-xs font-mono uppercase text-sky-400 font-semibold">
          Context & Intended Next Step
        </span>
        <h3 className="text-base font-bold text-white leading-relaxed">
          {currentRef.title}
        </h3>
        <p className="text-xs text-slate-300">
          <strong>Intended Action:</strong> {pred.intendedAction}
        </p>
        <p className="text-xs text-slate-400">
          <strong>Context:</strong> {pred.cueContext}
        </p>
      </div>

      {/* Retrieval Attempt (Zero-Typing) */}
      {!revealed ? (
        <div className="space-y-4">
          <label className="text-xs font-mono text-teal-300 font-semibold block">
            Before taking that step, which feared prediction did you lock in?
          </label>

          {/* 1-Tap Multiple Choice Buttons */}
          <div className="space-y-2.5">
            {fearOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelectFearChoice(opt)}
                className="w-full text-left p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 transition-all text-xs sm:text-sm text-slate-200 leading-relaxed flex items-start gap-3 group"
              >
                <span className="w-6 h-6 rounded-lg bg-slate-800 group-hover:bg-teal-500/20 text-slate-400 group-hover:text-teal-300 flex items-center justify-center font-mono text-xs shrink-0 border border-slate-700">
                  {['A', 'B', 'C'][i]}
                </span>
                <span className="pt-0.5">{opt}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleReveal}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-teal-500/20"
            >
              <Brain className="w-4 h-4" />
              <span>I Remember My Prediction (Instant Reveal)</span>
            </button>
          </div>
        </div>
      ) : (
        /* Revealed Comparison Grid */
        <div className="p-6 rounded-2xl bg-slate-900 border border-teal-500/40 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Prediction */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                Original Locked Prediction
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                "{pred.predictedOutcome || pred.fearedConsequence}"
              </p>
              <div className="text-[10px] font-mono text-slate-500">
                Belief confidence: {pred.confidencePercent}% • Committed{' '}
                {new Date(pred.committedAt).toLocaleDateString()}
              </div>
            </div>

            {/* Actual Outcome */}
            <div className="p-4 rounded-xl bg-slate-950 border border-teal-500/30 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-teal-400 font-bold block">
                Actual Real-World Outcome
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                "{out.whatActuallyHappened}"
              </p>
              <div className="text-[10px] font-mono text-teal-400">
                Evaluation: {out.outcomeRating.replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          {/* Discrepancy / Evidence Summary */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
            <span className="font-mono text-sky-300 font-semibold block">
              Discrepancy / Evidence Analysis:
            </span>
            <p className="text-slate-300 leading-relaxed">
              {out.discrepancySummary || 'Feared outcome did not match the observed real-world reality.'}
            </p>
            {linkedRule?.currentPresentDayWording && (
              <div className="pt-2 border-t border-slate-800 text-teal-300 font-medium">
                <strong>Updated Present-Day Rule:</strong> "{linkedRule.currentPresentDayWording}"
              </div>
            )}
          </div>

          {/* User rating */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono">Recall accuracy:</span>
              <button
                onClick={() => handleRate('easy')}
                className={`px-3 py-1.5 rounded-lg border text-xs ${
                  userRating === 'easy'
                    ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                Accurate
              </button>
              <button
                onClick={() => handleRate('hard')}
                className={`px-3 py-1.5 rounded-lg border text-xs ${
                  userRating === 'hard'
                    ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                Hindsight Shifted It
              </button>
            </div>

            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Next Check</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
