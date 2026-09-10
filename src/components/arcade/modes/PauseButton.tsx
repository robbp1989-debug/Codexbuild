import { usePracticeContent } from '../../../context/usePracticeContent';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Play, Pause, CheckCircle2, ArrowRight, Activity, Zap, HelpCircle, Navigation } from 'lucide-react';

interface PauseStep {
  title: string;
  question: string;
  icon: any;
  options: { label: string; isAdaptive: boolean; note: string }[];
}

export const PauseButton: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { playSoftSound, logPracticeSession, activeShift } = useApp();
  const sample = usePracticeContent().scenes[0];
  const PAUSE_SCENARIO = {
    title: 'Pause before choosing a response',
    situation: sample.fact,
    steps: [
      { title: '1. Notice', question: 'Which approach helps you notice your own response?', icon: Activity, options: [
        { label: 'Notice any feeling or sensation, including not being sure yet.', isAdaptive: true, note: 'No particular feeling or physical response is required.' },
        { label: 'Decide what I must be feeling based on what other people would feel.', isAdaptive: false, note: 'Come back to your own experience rather than prescribing a response.' },
      ] },
      { title: '2. Separate', question: 'Which statement adds an interpretation?', icon: Zap, options: [
        { label: sample.story, isAdaptive: true, note: 'This conclusion goes beyond the stated event.' },
        { label: sample.fact, isAdaptive: false, note: 'This is the stated observation in this fictional example.' },
      ] },
      { title: '3. Make room for uncertainty', question: 'Which response leaves room for missing information?', icon: HelpCircle, options: [
        { label: sample.possible, isAdaptive: true, note: 'A possibility is not a certainty. You can consider it without dismissing your feelings.' },
        { label: 'I already know the reason, so there is nothing to ask.', isAdaptive: false, note: 'The facts provided do not establish a motive.' },
      ] },
      { title: '4. Choose', question: sample.request, icon: Navigation, options: [
        { label: sample.response, isAdaptive: true, note: 'This is a concrete request. Adapt it to your circumstances and safety.' },
        { label: 'Assume the worst and respond as if it is proven.', isAdaptive: false, note: 'Check the facts before choosing your next step.' },
      ] },
    ],
  };
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const scenarioData = React.useMemo(() => {
    if (!activeShift || activeShift.id.startsWith('demo-')) return PAUSE_SCENARIO;

    const obs = activeShift.userEditedObservation || activeShift.observation;
    const emotions = activeShift.confirmed_emotions.length > 0
      ? activeShift.confirmed_emotions.join(', ')
      : 'uncertainty and somatic tension';
    const reflex = activeShift.userEditedHypothesis || activeShift.protective_rule_hypothesis;
    const choice = activeShift.userEditedChoice || activeShift.choice;

    return {
      title: 'Your Real Scenario Rehearsal',
      situation: obs,
      isPersonalized: true,
      steps: [
        {
          title: '1. NOTICE REACTION (Somatic Activation)',
          question: `When "${obs}" occurred, what somatic reaction fired in your body?`,
          icon: Activity,
          options: [
            {
              label: `Physical tightening, surge of ${emotions}, alertness in chest/throat.`,
              isAdaptive: true,
              note: 'Spotting this bodily state prevents operating automatically on sympathetic nervous arousal.',
            },
            {
              label: 'Zero physical sensations; purely intellectual calm.',
              isAdaptive: false,
              note: 'Denying body cues usually leads to subconscious reactive habits.',
            },
          ],
        },
        {
          title: '2. IDENTIFY URGE (Behavioral Impulse)',
          question: 'What was your automated protective impulse or urge?',
          icon: Zap,
          options: [
            {
              label: reflex,
              isAdaptive: true,
              note: 'Spotting this protective reflex lets you hit the pause button before acting it out.',
            },
            {
              label: 'Complete apathy and disregard for the situation.',
              isAdaptive: false,
              note: 'A protective numbing reaction rather than your grounded awareness.',
            },
          ],
        },
        {
          title: '3. INFORMATION NEEDED (Missing Facts)',
          question: 'What objective camera-verifiable information is actually missing right now?',
          icon: HelpCircle,
          options: [
            {
              label: 'The other party’s actual intent, schedule, competing emergencies, or verbal confirmation.',
              isAdaptive: true,
              note: 'Until verified, rushing to conclude rejection or disaster is premature mind-reading.',
            },
            {
              label: 'Confirmation of whether your catastrophic prediction is 100% destined to happen.',
              isAdaptive: false,
              note: 'Seeking certainty on catastrophic hypotheses keeps the anxiety loop spinning.',
            },
          ],
        },
        {
          title: '4. DELIBERATE CHOICE (Values-Aligned Move)',
          question: 'What intentional, grounded response will you execute?',
          icon: Navigation,
          options: [
            {
              label: choice,
              isAdaptive: true,
              note: 'Grounded, proactive, honors your needs without reactive panic.',
            },
            {
              label: 'Double down on the old panic habit and seek immediate emergency appeasement.',
              isAdaptive: false,
              note: 'Reinforces the false narrative that discomfort equals danger.',
            },
          ],
        },
      ],
    };
  }, [activeShift]);

  const step = scenarioData.steps[currentStepIdx] || scenarioData.steps[0];
  const Icon = step.icon;

  const handleSelect = (idx: number) => {
    setSelectedOpt(idx);
    playSoftSound(step.options[idx].isAdaptive ? 'complete' : 'tap');
  };

  const handleNext = () => {
    if (selectedOpt === null) return;
    playSoftSound('tap');
    if (currentStepIdx + 1 < scenarioData.steps.length) {
      setCurrentStepIdx((prev) => prev + 1);
      setSelectedOpt(null);
    } else {
      setFinished(true);
      logPracticeSession({
        mode: 'pause_button',
        durationSeconds: 60,
        itemsAttempted: scenarioData.steps.length,
      });
      if (onComplete) onComplete();
    }
  };

  if (finished) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-300 mx-auto flex items-center justify-center">
          <Pause className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">The Pause Gap Mastered!</h2>
        <p className="text-slate-300 text-sm">
          You successfully decoupled Reaction → Urge → Information Needed → Deliberate Choice.
        </p>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Widening this gap between stimulus and response is where human agency lives.
        </p>
        <button
          onClick={() => {
            setCurrentStepIdx(0);
            setSelectedOpt(null);
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
          <span className="text-xs font-mono font-bold uppercase text-amber-400">
            GAME 9: THE PAUSE BUTTON
          </span>
          <h2 className="text-lg font-bold text-slate-100">Impulse Control & Nervous System</h2>
        </div>
        <div className="flex items-center gap-2">
          {(scenarioData as any).isPersonalized && (
            <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300 text-[10px]">
              ⭐ Personalized
            </span>
          )}
          <span className="text-xs font-mono text-slate-400">
            Phase {currentStepIdx + 1} of {scenarioData.steps.length}
          </span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
        <span className="text-[11px] text-amber-400 uppercase font-mono font-semibold">
          Triggering Event:
        </span>
        <p className="text-sm font-semibold text-slate-200">{scenarioData.title}</p>
        <p className="text-xs text-slate-400 leading-relaxed">{scenarioData.situation}</p>
      </div>

      {/* Step Header */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
        <Icon className="w-4 h-4 text-amber-400" />
        <span>{step.title}</span>
      </div>

      <p className="text-xs text-slate-300">{step.question}</p>

      {/* Options */}
      <div className="space-y-3">
        {step.options.map((opt, idx) => {
          const isChosen = selectedOpt === idx;
          let style = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';

          if (selectedOpt !== null) {
            if (opt.isAdaptive) style = 'bg-teal-950/60 border-teal-400 text-teal-200 font-semibold';
            else if (isChosen) style = 'bg-rose-950/50 border-rose-400 text-rose-200';
            else style = 'bg-slate-950 border-slate-900 text-slate-600';
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selectedOpt !== null}
              className={`w-full p-4 rounded-xl border text-left text-xs transition-all cursor-pointer ${style}`}
            >
              <span className="block leading-relaxed">{opt.label}</span>
              {selectedOpt !== null && (
                <span className="block text-[11px] text-slate-400 mt-1">{opt.note}</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedOpt !== null && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
          >
            <span>Next Phase</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
