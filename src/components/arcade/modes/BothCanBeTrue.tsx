import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { CheckCircle2, ArrowRight, GitFork, AlertCircle, Heart, Shield } from 'lucide-react';

interface DialecticalScenario {
  id: string;
  context: string;
  sideA: string;
  sideB: string;
  correctAnswer: 'both' | 'a_only' | 'b_only';
  synthesis: string;
}

const SCENARIOS: DialecticalScenario[] = [
  {
    id: 'bcbt-1',
    context: 'Your partner snapped at you after arriving home late.',
    sideA: 'They had an agonizing 12-hour shift and are physically drained.',
    sideB: 'Their sharp tone felt hurtful and disrespectful to you.',
    correctAnswer: 'both',
    synthesis:
      'Both can be true. Understanding someone’s fatigue explains their irritability, but it does not erase your legitimate emotional impact or require you to accept mistreatment.',
  },
  {
    id: 'bcbt-2',
    context: 'A coworker declined to help you with an urgent project sprint.',
    sideA: 'They have strict deadlines on their own assigned queue.',
    sideB: 'You feel isolated and stressed under the current workload.',
    correctAnswer: 'both',
    synthesis:
      'Both can be true. Their boundary is legitimate, and your stress is also real. One does not invalidate the other.',
  },
  {
    id: 'bcbt-3',
    context: 'Your parent gave unsolicited critical advice about your career.',
    sideA: 'They genuinely desire your financial safety and stability.',
    sideB: 'Their delivery felt intrusive, undermining, and invalidating.',
    correctAnswer: 'both',
    synthesis:
      'Both can be true. Love and anxiety can motivate advice while the boundary violation remains genuine. You can recognize their intent without adopting their critique.',
  },
];

export const BothCanBeTrue: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { playSoftSound, logPracticeSession, activeShift } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const scenarioList = React.useMemo(() => {
    if (!activeShift) return SCENARIOS;

    const obs = activeShift.userEditedObservation || activeShift.observation;
    const emotions = activeShift.confirmed_emotions.length > 0
      ? activeShift.confirmed_emotions.join(', ')
      : 'distress and uncertainty';
    const perspective = activeShift.userEditedPerspective || activeShift.updated_perspective;

    const userScenario: DialecticalScenario = {
      id: 'bcbt-user',
      context: `Your Scenario: "${obs}"`,
      sideA: 'The other person has their own invisible pressures, timing constraints, and internal workload.',
      sideB: `Your feeling of ${emotions} is real, legitimate, and does not need to be silenced.`,
      correctAnswer: 'both',
      synthesis: perspective,
    };

    return [userScenario, ...SCENARIOS];
  }, [activeShift]);

  const scenario = scenarioList[currentIndex] || SCENARIOS[0];

  const handleSelect = (choice: string) => {
    if (selected) return;
    setSelected(choice);
    playSoftSound(choice === 'both' ? 'complete' : 'tap');
  };

  const handleNext = () => {
    playSoftSound('tap');
    if (currentIndex + 1 < scenarioList.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelected(null);
    } else {
      setFinished(true);
      logPracticeSession({
        mode: 'both_can_be_true',
        durationSeconds: 50,
        itemsAttempted: scenarioList.length,
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
        <h2 className="text-2xl font-bold text-slate-100">Dialectical Mastery Practiced!</h2>
        <p className="text-slate-300 text-sm">
          You practiced holding dual truths without collapsing into either self-erasure or demonizing the other person.
        </p>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Remember: <em>Understanding</em> someone’s behavior does not require <em>accepting</em> or tolerating it.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setSelected(null);
              setFinished(false);
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-xs font-mono font-bold uppercase text-indigo-400">
            GAME 3: BOTH CAN BE TRUE
          </span>
          <h2 className="text-lg font-bold text-slate-100">Dialectical Integration</h2>
        </div>
        <div className="flex items-center gap-2">
          {scenario.id === 'bcbt-user' && (
            <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-[10px]">
              ⭐ Personalized
            </span>
          )}
          <span className="text-xs font-mono text-slate-400">
            Scenario {currentIndex + 1} of {scenarioList.length}
          </span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
          Scenario Context:
        </span>
        <p className="text-sm font-medium text-slate-200">{scenario.context}</p>
      </div>

      {/* The Two Polar Perspectives */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/80 border border-sky-500/30 space-y-2">
          <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5 uppercase">
            <Heart className="w-3.5 h-3.5" />
            Truth A (Empathy / Context)
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">"{scenario.sideA}"</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-teal-500/30 space-y-2">
          <span className="text-[11px] font-bold text-teal-400 flex items-center gap-1.5 uppercase">
            <Shield className="w-3.5 h-3.5" />
            Truth B (Your Experience & Limits)
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">"{scenario.sideB}"</p>
        </div>
      </div>

      {/* Decision Options */}
      <div className="space-y-2.5 pt-2">
        <span className="text-xs text-slate-400 block font-medium">
          Which conclusion reflects mature emotional reality?
        </span>

        {[
          {
            id: 'a_only',
            label: 'Only Truth A matters (I should erase my feelings because they were stressed)',
          },
          {
            id: 'b_only',
            label: 'Only Truth B matters (They are completely malicious and incapable of stress)',
          },
          {
            id: 'both',
            label: 'BOTH CAN BE TRUE (I can understand their stress AND honor my feelings/boundary)',
            highlight: true,
          },
        ].map((choice) => {
          const isChosen = selected === choice.id;
          let style = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';

          if (selected) {
            if (choice.id === 'both') style = 'bg-teal-950/60 border-teal-400 text-teal-200 font-semibold';
            else if (isChosen) style = 'bg-rose-950/50 border-rose-400 text-rose-200';
            else style = 'bg-slate-950 border-slate-900 text-slate-600';
          }

          return (
            <button
              key={choice.id}
              onClick={() => handleSelect(choice.id)}
              disabled={!!selected}
              className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${style}`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>

      {/* Synthesis explanation */}
      {selected && (
        <div className="p-4 rounded-xl bg-slate-900 border border-teal-500/40 space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-300">
            <GitFork className="w-4 h-4 text-teal-400" />
            <span>Psychological Synthesis</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{scenario.synthesis}</p>
          <div className="flex justify-end pt-1">
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold cursor-pointer"
            >
              <span>Next Scenario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
