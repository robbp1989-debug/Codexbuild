import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { ProtectiveRule } from '../../../types';
import {
  Eye,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  Zap,
  Check,
  Brain,
} from 'lucide-react';

export const RuleRecallMode: React.FC<{ onCompleteSession?: () => void }> = ({
  onCompleteSession,
}) => {
  const { rules, playSoftSound, logPracticeSession } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showClue, setShowClue] = useState(false);
  const [rating, setRating] = useState<string | null>(null);
  const [showManualTyping, setShowManualTyping] = useState(false);
  const [userAttempt, setUserAttempt] = useState('');

  const activeRules = rules.filter(
    (r) => r.currentPresentDayWording && r.currentPresentDayWording.trim().length > 0
  );

  const currentRule: ProtectiveRule | undefined = activeRules[currentIndex];

  if (!currentRule) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <p className="mb-4">No present-day rules mapped yet.</p>
        <p className="text-xs text-slate-500">
          Complete a guided reflection or add a rule in My Patterns to practice Rule Recall.
        </p>
      </div>
    );
  }

  // Generate 3 tap choices: the actual rule + 2 alternatives from other rules
  const otherRules = activeRules.filter((r) => r.id !== currentRule.id);
  const distractor1 =
    otherRules[0]?.currentPresentDayWording ||
    'I can pause, name uncertainty, and let others process without assuming rejection.';
  const distractor2 =
    otherRules[1]?.currentPresentDayWording ||
    'Discomfort is tolerable; expressing my real limits preserves true connection.';

  const choices = [
    { text: currentRule.currentPresentDayWording, isCorrect: true },
    { text: distractor1, isCorrect: false },
    { text: distractor2, isCorrect: false },
  ].sort((a, b) => a.text.localeCompare(b.text)); // deterministic shuffle

  const handleChooseOption = (optText: string, isCorrect: boolean) => {
    setSelectedOption(optText);
    setRevealed(true);
    if (isCorrect) {
      playSoftSound('chime');
    } else {
      playSoftSound('tap');
    }
  };

  const handleMentalRecallReveal = () => {
    playSoftSound('chime');
    setRevealed(true);
    setSelectedOption(currentRule.currentPresentDayWording);
  };

  const handleRate = (rateValue: 'easy' | 'hard' | 'need_clue' | 'not_relevant') => {
    playSoftSound('tap');
    setRating(rateValue);
    logPracticeSession({
      mode: 'rule_recall',
      durationSeconds: 45,
      itemsAttempted: 1,
      userRating: rateValue,
    });
  };

  const handleNext = () => {
    playSoftSound('tap');
    setUserAttempt('');
    setSelectedOption(null);
    setRevealed(false);
    setShowClue(false);
    setRating(null);
    setShowManualTyping(false);
    if (currentIndex < activeRules.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
      if (onCompleteSession) onCompleteSession();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-teal-400 font-semibold uppercase tracking-wider">
            Mode 1: Rule Recall
          </span>
          <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 text-[10px] border border-teal-500/30 flex items-center gap-1 font-sans">
            <Zap className="w-3 h-3" /> Zero-Typing
          </span>
        </div>
        <span>
          Rule {currentIndex + 1} of {activeRules.length}
        </span>
      </div>

      {/* Cue Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-amber-400 font-semibold flex items-center gap-1.5">
            <span>Familiar Trigger Cue</span>
          </span>
          <span className="text-[11px] font-mono text-slate-500">{currentRule.title}</span>
        </div>
        <p className="text-lg text-slate-100 font-medium leading-relaxed font-serif">
          "{currentRule.cueContext}"
        </p>

        {currentRule.originalWording && (
          <div className="text-xs text-slate-400 italic pt-2 border-t border-slate-800/80">
            Learned survival reflex: "{currentRule.originalWording}"
          </div>
        )}
      </div>

      {/* 1-Tap Recall Interface */}
      {!revealed ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-mono text-teal-300 font-semibold">
              Select your present-day rule (or recall mentally):
            </span>
            <button
              type="button"
              onClick={() => {
                playSoftSound('tap');
                setShowClue(!showClue);
              }}
              className="text-slate-400 hover:text-teal-300 underline"
            >
              {showClue ? 'Hide Clue' : 'Need Clue?'}
            </button>
          </div>

          {showClue && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
              <span className="text-teal-400 font-semibold">Clue:</span>{' '}
              {currentRule.currentPresentDayWording.slice(0, 35)}...
            </div>
          )}

          {/* 1-Tap Multiple Choice Buttons */}
          <div className="space-y-2.5">
            {choices.map((c, i) => (
              <button
                key={i}
                onClick={() => handleChooseOption(c.text, c.isCorrect)}
                className="w-full text-left p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 transition-all text-xs sm:text-sm text-slate-200 leading-relaxed flex items-start gap-3 group"
              >
                <span className="w-6 h-6 rounded-lg bg-slate-800 group-hover:bg-teal-500/20 text-slate-400 group-hover:text-teal-300 flex items-center justify-center font-mono text-xs shrink-0 border border-slate-700">
                  {['A', 'B', 'C'][i]}
                </span>
                <span className="pt-0.5">{c.text}</span>
              </button>
            ))}
          </div>

          {/* Fast Mental Recall Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleMentalRecallReveal}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-500/20"
            >
              <Brain className="w-4 h-4" />
              <span>I Recalled It in My Head (Instant Reveal)</span>
            </button>

            <button
              onClick={() => setShowManualTyping(!showManualTyping)}
              className="text-[11px] text-slate-500 hover:text-slate-300 underline font-mono"
            >
              {showManualTyping ? 'Hide manual typing' : 'Prefer to type? (Optional)'}
            </button>
          </div>

          {showManualTyping && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <textarea
                rows={2}
                value={userAttempt}
                onChange={(e) => setUserAttempt(e.target.value)}
                placeholder="Type your memory here if desired..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-teal-500"
              />
              <button
                onClick={() => setRevealed(true)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold"
              >
                Reveal Answer
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Revealed Card */
        <div className="p-6 rounded-2xl bg-teal-950/30 border border-teal-800/60 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-teal-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-bold">
                Your Target Present-Day Rule
              </span>
            </div>
            <p className="text-base text-slate-100 font-medium leading-relaxed bg-slate-900/90 p-4 rounded-xl border border-teal-900/40 font-serif">
              "{currentRule.currentPresentDayWording}"
            </p>
          </div>

          {/* Supportive Self-Rating */}
          <div className="space-y-2 pt-2 border-t border-teal-900/40">
            <span className="text-xs font-mono text-slate-300 block">
              How did the retrieval feel? (1-Tap feedback)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                onClick={() => handleRate('easy')}
                className={`p-2 rounded-lg border text-center transition-colors ${
                  rating === 'easy'
                    ? 'bg-teal-500/20 border-teal-400 text-teal-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Fast & Clear
              </button>
              <button
                onClick={() => handleRate('need_clue')}
                className={`p-2 rounded-lg border text-center transition-colors ${
                  rating === 'need_clue'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Needed a Clue
              </button>
              <button
                onClick={() => handleRate('hard')}
                className={`p-2 rounded-lg border text-center transition-colors ${
                  rating === 'hard'
                    ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Felt Stiff / Hard
              </button>
              <button
                onClick={() => handleRate('not_relevant')}
                className={`p-2 rounded-lg border text-center transition-colors ${
                  rating === 'not_relevant'
                    ? 'bg-slate-700 border-slate-500 text-slate-200 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Needs Rewrite
              </button>
            </div>
            {rating && (
              <p className="text-xs text-teal-300/80 pt-1">
                Feedback logged. Great job—retrieval gets faster and more automatic each time.
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Next Rule Prompt</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
