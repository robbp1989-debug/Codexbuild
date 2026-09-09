import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { CheckCircle2, ArrowRight, ShieldCheck, AlertCircle, Heart, User } from 'lucide-react';

interface MeFirstStep {
  prompt: string;
  options: string[];
  correctType: 'self' | 'other_explaining';
  feedbackIfRedirect: string;
  selfLesson: string;
}

const STEPS: MeFirstStep[] = [
  {
    prompt: 'STEP 1: What objectively happened? (Select the camera fact)',
    options: [
      'My friend cancelled dinner with 20 minutes notice via text.',
      'My friend was overwhelmed with her toddler and had no choice.',
      'My friend is selfish and takes my time for granted.',
    ],
    correctType: 'self',
    feedbackIfRedirect: 'Notice how quickly your mind jumps to explaining her schedule. First, stick to the observable camera event.',
    selfLesson: 'Camera Fact: Dinner was cancelled 20 minutes prior via text.',
  },
  {
    prompt: 'STEP 2: What did YOU feel when reading that text? (First-person response)',
    options: [
      'I felt a wave of disappointment, irritation, and disrespect.',
      'She was probably just super busy and stressed out.',
      'I thought that her boss must have kept her late at work.',
    ],
    correctType: 'self',
    feedbackIfRedirect: 'Good theory about her day! But first: what happened inside YOU? Name your own emotional response before excusing her.',
    selfLesson: 'First-Person Emotion: Disappointment & irritation.',
  },
  {
    prompt: 'STEP 3: What did YOU want in that moment?',
    options: [
      'I wanted reliable plans and reciprocal respect for my evening time.',
      'I wanted her to feel less stressed about her toddler.',
      'I wanted to make sure she did not feel guilty.',
    ],
    correctType: 'self',
    feedbackIfRedirect: 'Your reflex is to manage HER feelings. Come back to your side of the table: what was your own preference?',
    selfLesson: 'Personal Desire: Predictability and mutual respect for time.',
  },
  {
    prompt: 'STEP 4: Was this event acceptable to your personal boundaries?',
    options: [
      'Repeated last-minute cancellations without urgent emergencies are not acceptable to me.',
      'It has to be acceptable because she is my friend and friends must sacrifice.',
      'I will just act like it did not bother me at all.',
    ],
    correctType: 'self',
    feedbackIfRedirect: 'Sacrificing personal limits without honest communication breeds long-term resentment. Evaluate acceptability honestly.',
    selfLesson: 'Standard: Last-minute cancellations require a clear conversation.',
  },
  {
    prompt: 'STEP 5 (ONLY NOW): What plausible context explains her behavior?',
    options: [
      'She likely had a domestic emergency with her child; understanding this does not mean I must pretend I was not inconvenienced.',
      'She hates me and planned this to embarrass me.',
      'I am not allowed to think about her reasons at all.',
    ],
    correctType: 'self',
    feedbackIfRedirect: 'Now that you have grounded your own experience, you can explore external context with clarity.',
    selfLesson: 'Integrated Balance: Compassion for her stress + clarity on your boundaries.',
  },
];

export const MeFirst: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { playSoftSound, logPracticeSession } = useApp();
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [redirectWarning, setRedirectWarning] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const currentStep = STEPS[stepIndex];

  const handleSelect = (idx: number) => {
    setSelectedIndex(idx);

    // Option 0 is always the grounded self-respecting choice in our steps
    if (idx !== 0) {
      playSoftSound('tap');
      setRedirectWarning(currentStep.feedbackIfRedirect);
    } else {
      playSoftSound('complete');
      setRedirectWarning(null);
    }
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    if (selectedIndex !== 0) {
      // User must choose the self-grounded response before moving forward
      return;
    }

    playSoftSound('tap');
    if (stepIndex + 1 < STEPS.length) {
      setStepIndex((prev) => prev + 1);
      setSelectedIndex(null);
      setRedirectWarning(null);
    } else {
      setFinished(true);
      logPracticeSession({
        mode: 'me_first',
        durationSeconds: 60,
        itemsAttempted: STEPS.length,
      });
      if (onComplete) onComplete();
    }
  };

  if (finished) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-300 mx-auto flex items-center justify-center">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">"Me First" Sequence Completed!</h2>
        <p className="text-slate-300 text-sm">
          You successfully walked the healthy relational sequence:
        </p>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs text-slate-300 space-y-2">
          <div>1. <strong>Observe fact</strong> before analyzing motives.</div>
          <div>2. <strong>Name your feeling</strong> before excusing them.</div>
          <div>3. <strong>State what you want</strong> before managing their guilt.</div>
          <div>4. <strong>Evaluate boundary</strong> before appeasing.</div>
          <div>5. <strong>Consider their context</strong> without abandoning yourself.</div>
        </div>
        <button
          onClick={() => {
            setStepIndex(0);
            setSelectedIndex(null);
            setRedirectWarning(null);
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
            GAME 4: ME FIRST
          </span>
          <h2 className="text-lg font-bold text-slate-100">Assertiveness & Decentering</h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Step {stepIndex + 1} of {STEPS.length}
        </span>
      </div>

      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <span className="text-[11px] text-teal-400 font-mono uppercase tracking-wider block">
          Core Discipline: Feel Before Explaining
        </span>
        <h3 className="text-sm font-semibold text-slate-100">{currentStep.prompt}</h3>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {currentStep.options.map((option, idx) => {
          const isChosen = selectedIndex === idx;
          let style = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';

          if (selectedIndex !== null) {
            if (idx === 0) style = 'bg-teal-950/60 border-teal-400 text-teal-200 font-medium';
            else if (isChosen) style = 'bg-amber-950/50 border-amber-400 text-amber-200';
            else style = 'bg-slate-950 border-slate-900 text-slate-600';
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full p-4 rounded-xl border text-left text-xs transition-all cursor-pointer ${style}`}
            >
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] shrink-0 font-bold">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Gentle Redirect Notice */}
      {redirectWarning && (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Gentle Redirect:</span>
          </div>
          <p className="leading-relaxed">{redirectWarning}</p>
          <span className="text-[11px] text-amber-300 block font-semibold">
            Choose Option 1 to center your own internal state first.
          </span>
        </div>
      )}

      {selectedIndex === 0 && (
        <div className="p-4 rounded-xl bg-teal-950/50 border border-teal-500/40 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-300">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>Grounded First-Person Anchor</span>
          </div>
          <p className="text-xs text-slate-300">{currentStep.selfLesson}</p>
          <div className="flex justify-end pt-1">
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold cursor-pointer"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
