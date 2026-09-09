import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Zap,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Flame,
  Award,
  ArrowRight,
  Shield,
  Brain,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface BlitzQuestion {
  id: string;
  category: string;
  badge: string;
  prompt: string;
  options: {
    label: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

const BLITZ_POOL: BlitzQuestion[] = [
  {
    id: 'b1',
    category: 'The Camera Test',
    badge: 'Fact vs Story',
    prompt: '"Jordan didn’t reply to my question in Slack for 4 hours."',
    options: [
      {
        label: 'Observable Fact (Camera Test passed)',
        isCorrect: true,
        explanation: 'A video camera or screen log could verify the timestamp and lack of reply.',
      },
      {
        label: 'Mental Interpretation / Story',
        isCorrect: false,
        explanation: 'This is an objective, observable fact without speculation.',
      },
    ],
  },
  {
    id: 'b2',
    category: 'Reflex vs Response',
    badge: 'Cue → Move Match',
    prompt: 'Trigger Cue: Your manager sends "Do you have 5 minutes to chat?" with no context.',
    options: [
      {
        label: 'Assume you did something wrong and frantically review recent mistakes',
        isCorrect: false,
        explanation: 'That is the old knee-jerk anxiety reflex.',
      },
      {
        label: 'Take a breath, note uncertainty, and reply: "Yes! What’s the topic so I can prep?"',
        isCorrect: true,
        explanation: 'Adaptive grounded move: creates clarity without assuming catastrophe.',
      },
      {
        label: 'Ignore the message until the end of the day',
        isCorrect: false,
        explanation: 'Avoidant freeze behavior increases long-term anxiety.',
      },
    ],
  },
  {
    id: 'b3',
    category: 'Clear Communication',
    badge: 'Boundary Builder',
    prompt: 'Which boundary is firm, kind, and non-blaming for an evening work request?',
    options: [
      {
        label: '"You always dump tasks on me right as I am trying to leave."',
        isCorrect: false,
        explanation: 'Blaming and accusatory language sparks defensiveness.',
      },
      {
        label: '"I am wrapping up for today. I will review this first thing tomorrow at 9 AM."',
        isCorrect: true,
        explanation: 'Clean 4-part boundary: states current limit and positive next action clearly.',
      },
      {
        label: '"Sorry sorry sorry, I guess I can stay up late tonight if you really need it."',
        isCorrect: false,
        explanation: 'Appeasement sacrifices legitimate rest and builds hidden resentment.',
      },
    ],
  },
  {
    id: 'b4',
    category: 'Empirical Evidence',
    badge: 'Evidence Sort',
    prompt:
      'Old Rule: "If I express disagreement, people will reject me."\nReal Event: "I suggested an alternative design. The lead said ‘Good catch, let’s test that.’"',
    options: [
      {
        label: 'Supports the Old Rule',
        isCorrect: false,
        explanation: 'They agreed and welcomed the input!',
      },
      {
        label: 'Challenges the Old Rule (Direct Disconfirming Evidence)',
        isCorrect: true,
        explanation: 'Directly disproves the catastrophic prediction of rejection.',
      },
    ],
  },
  {
    id: 'b5',
    category: 'Present-Day Heuristics',
    badge: 'Rule Recall',
    prompt:
      'Trigger Cue: A close friend looks quiet and tired during dinner.\nWhich present-day rule protects your peace?',
    options: [
      {
        label: 'Ask once with care, then let them be; their quietness is not my failure to fix.',
        isCorrect: true,
        explanation: 'Compassionate differentiation: caring without codependent over-responsibility.',
      },
      {
        label: 'Immediately over-perform, make jokes, and apologize repeatedly for boring them.',
        isCorrect: false,
        explanation: 'Exhausting appeasement reflex based on old childhood vigilance.',
      },
      {
        label: 'Get irritated that they are ruining the mood and withdraw coldly.',
        isCorrect: false,
        explanation: 'Protective aggression masking underlying vulnerability.',
      },
    ],
  },
];

export const RapidBlitz: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { playSoftSound, logPracticeSession } = useApp();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedOptIndex, setSelectedOptIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const question = BLITZ_POOL[currentIdx];

  const handleSelectOption = (idx: number, isCorrect: boolean) => {
    if (isAnswered) return;
    setSelectedOptIndex(idx);
    setIsAnswered(true);

    if (isCorrect) {
      playSoftSound('chime');
      setScore((prev) => prev + 100 + streak * 25);
      setStreak((prev) => prev + 1);
    } else {
      playSoftSound('tap');
      setStreak(0);
    }
  };

  const handleNext = () => {
    playSoftSound('tap');
    if (currentIdx < BLITZ_POOL.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setIsAnswered(false);
      setSelectedOptIndex(null);
    } else {
      setIsCompleted(true);
      playSoftSound('complete');
      logPracticeSession({
        mode: 'cue_response',
        durationSeconds: 60,
        itemsAttempted: BLITZ_POOL.length,
        userRating: 'easy',
      });
    }
  };

  const handleRestart = () => {
    playSoftSound('tap');
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setIsAnswered(false);
    setSelectedOptIndex(null);
    setIsCompleted(false);
  };

  if (isCompleted) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-3xl bg-slate-900 border border-teal-500/40 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-teal-400 font-semibold">
            Blitz Complete • Zero Typing
          </span>
          <h2 className="text-3xl font-bold text-white">Rapid Recall Mastery</h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            You just practiced 5 high-leverage cognitive discrimination moves in 60 seconds.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] font-mono text-slate-500 block">FINAL SCORE</span>
            <span className="text-2xl font-bold font-mono text-teal-300">{score} pts</span>
          </div>
          <div>
            <span className="text-[11px] font-mono text-slate-500 block">RETRIEVAL DRILLS</span>
            <span className="text-2xl font-bold font-mono text-sky-300">5 of 5</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleRestart}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Another Blitz</span>
          </button>

          <button
            onClick={onExit}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Back to Arcade Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Blitz Header Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-teal-300 uppercase tracking-wide">
              Rapid Arcade Blitz
            </div>
            <div className="text-[11px] text-slate-400">
              Drill {currentIdx + 1} of {BLITZ_POOL.length} • {question.category}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          {streak > 1 && (
            <div className="flex items-center gap-1 text-amber-400 font-bold bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-800/40">
              <Flame className="w-3.5 h-3.5" />
              <span>{streak}x Combo</span>
            </div>
          )}
          <div className="text-teal-300 font-bold">{score} pts</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-400 transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / BLITZ_POOL.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-mono text-teal-300 border border-slate-700">
            {question.badge}
          </span>
          <span className="text-[11px] font-mono text-slate-500">100% 1-Tap</span>
        </div>

        <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed font-serif whitespace-pre-line">
          {question.prompt}
        </p>

        {/* 1-Tap Options */}
        <div className="space-y-3 pt-2">
          {question.options.map((opt, i) => {
            const isSelected = selectedOptIndex === i;
            let btnStyle =
              'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-teal-500/50 hover:bg-slate-850';

            if (isAnswered) {
              if (opt.isCorrect) {
                btnStyle = 'bg-teal-950/50 border-teal-400 text-teal-100 font-medium';
              } else if (isSelected && !opt.isCorrect) {
                btnStyle = 'bg-red-950/50 border-red-500 text-red-200';
              } else {
                btnStyle = 'opacity-50 bg-slate-950 border-slate-800 text-slate-500';
              }
            }

            return (
              <button
                key={i}
                disabled={isAnswered}
                onClick={() => handleSelectOption(i, opt.isCorrect)}
                className={`w-full text-left p-4 rounded-xl border transition-all text-xs sm:text-sm leading-relaxed flex items-start gap-3 ${btnStyle}`}
              >
                <span className="w-6 h-6 rounded-lg bg-slate-900 text-slate-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 border border-slate-700">
                  {isAnswered && opt.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  ) : isAnswered && isSelected && !opt.isCorrect ? (
                    <XCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    ['A', 'B', 'C'][i]
                  )}
                </span>
                <div className="space-y-1">
                  <div>{opt.label}</div>
                  {isAnswered && (
                    <p className="text-[11px] text-slate-400 font-mono pt-1">
                      {opt.explanation}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Next Button after answering */}
        {isAnswered && (
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-teal-500/20"
            >
              <span>{currentIdx < BLITZ_POOL.length - 1 ? 'Next Move' : 'See Results'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
