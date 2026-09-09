import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { CheckCircle2, XCircle, ArrowRight, Sparkles } from 'lucide-react';

interface CueMatchItem {
  id: string;
  cue: string;
  options: {
    text: string;
    isAdaptive: boolean;
    type: 'reactive_anxious' | 'grounded_adaptive' | 'avoidant_shutdown';
    rationale: string;
  }[];
}

const DEFAULT_CUE_ITEMS: CueMatchItem[] = [
  {
    id: 'cue-1',
    cue: 'Someone takes longer than usual to reply to an important personal text.',
    options: [
      {
        text: 'Assume they are angry, send multiple clarifying texts, or obsessively monitor their status.',
        isAdaptive: false,
        type: 'reactive_anxious',
        rationale: 'Anxious appeasement attempts to relieve internal uncertainty by demanding an immediate external response.',
      },
      {
        text: 'Pause, name the internal uncertainty, and engage in your own day until a reasonable time passes.',
        isAdaptive: true,
        type: 'grounded_adaptive',
        rationale: 'Holds space for uncertainty without projecting negative intent. Other people have complex schedules and bandwidth limits.',
      },
      {
        text: 'Conclude they never respected you, delete the thread, and permanently withdraw.',
        isAdaptive: false,
        type: 'avoidant_shutdown',
        rationale: 'Premature defensive withdrawal protects against rejection but destroys relationships based on unverified assumptions.',
      },
    ],
  },
  {
    id: 'cue-2',
    cue: 'A colleague critiques your slide deck in front of a project team.',
    options: [
      {
        text: 'Immediately over-explain and get defensive to prove you did not make a mistake.',
        isAdaptive: false,
        type: 'reactive_anxious',
        rationale: 'Defensiveness treats feedback as an attack on personal worth rather than a technical detail.',
      },
      {
        text: 'Shut down completely, remain silent, and assume your credibility is permanently ruined.',
        isAdaptive: false,
        type: 'avoidant_shutdown',
        rationale: 'Catastrophizing turns a single critique into a permanent global defect.',
      },
      {
        text: 'Take a breath, acknowledge the specific point, and ask: "What specific change would clarify that for the stakeholders?"',
        isAdaptive: true,
        type: 'grounded_adaptive',
        rationale: 'Anchors in professional clarity and collaboration while keeping personal safety intact.',
      },
    ],
  },
  {
    id: 'cue-3',
    cue: 'A friend asks you for a weekend favor during a week you feel completely depleted.',
    options: [
      {
        text: 'Say "I would love to help another time, but this weekend I need to rest and recharge."',
        isAdaptive: true,
        type: 'grounded_adaptive',
        rationale: 'Honors your real capacity with kindness. Saying no to an activity is not saying no to the person.',
      },
      {
        text: 'Say yes enthusiastically, then secretly feel bitter and exhausted all weekend.',
        isAdaptive: false,
        type: 'reactive_anxious',
        rationale: 'People-pleasing sacrifices personal sustainability to manage another person’s momentary impression.',
      },
      {
        text: 'Ghost their message and make up a dramatic excuse two days later.',
        isAdaptive: false,
        type: 'avoidant_shutdown',
        rationale: 'Avoidance creates anxiety and erodes trust.',
      },
    ],
  },
];

export const CueResponseMatchMode: React.FC<{ onCompleteSession?: () => void }> = ({
  onCompleteSession,
}) => {
  const { playSoftSound, logPracticeSession } = useApp();
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const currentItem = DEFAULT_CUE_ITEMS[index];

  const handleSelect = (idx: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(idx);
    const isCorrect = currentItem.options[idx].isAdaptive;
    if (isCorrect) {
      playSoftSound('chime');
    } else {
      playSoftSound('tap');
    }

    logPracticeSession({
      mode: 'cue_response',
      durationSeconds: 60,
      itemsAttempted: 1,
      userRating: isCorrect ? 'easy' : 'hard',
    });
  };

  const handleNext = () => {
    playSoftSound('tap');
    setSelectedIndex(null);
    if (index < DEFAULT_CUE_ITEMS.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      setIndex(0);
      if (onCompleteSession) onCompleteSession();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="text-teal-400 font-semibold uppercase tracking-wider">
          Mode 2: Cue → Response Match
        </span>
        <span>
          Scenario {index + 1} of {DEFAULT_CUE_ITEMS.length}
        </span>
      </div>

      {/* Cue Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
        <span className="text-xs font-mono text-indigo-400 font-semibold uppercase tracking-wider">
          Environmental Trigger Cue
        </span>
        <h3 className="text-lg font-bold text-white leading-relaxed">
          {currentItem.cue}
        </h3>
        <p className="text-xs text-slate-400">
          Which response represents a grounded, present-day move?
        </p>
      </div>

      {/* Choices */}
      <div className="space-y-3">
        {currentItem.options.map((opt, i) => {
          const isChosen = selectedIndex === i;
          const isAnswered = selectedIndex !== null;
          let containerClass =
            'p-4 rounded-xl border text-sm text-left transition-all flex items-start gap-3 w-full ';

          if (!isAnswered) {
            containerClass +=
              'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 text-slate-200 hover:border-slate-700';
          } else if (opt.isAdaptive) {
            containerClass +=
              'bg-teal-950/40 border-teal-500/80 text-teal-100 shadow-sm shadow-teal-500/10';
          } else if (isChosen && !opt.isAdaptive) {
            containerClass += 'bg-slate-950 border-amber-500/60 text-slate-300';
          } else {
            containerClass += 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60';
          }

          return (
            <button
              key={i}
              disabled={isAnswered}
              onClick={() => handleSelect(i)}
              className={containerClass}
            >
              <div className="shrink-0 mt-0.5">
                {isAnswered && opt.isAdaptive && (
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                )}
                {isAnswered && isChosen && !opt.isAdaptive && (
                  <XCircle className="w-5 h-5 text-amber-400" />
                )}
                {!isAnswered && (
                  <span className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-400">
                    {i + 1}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <p className="leading-relaxed font-medium">{opt.text}</p>
                {isAnswered && (
                  <p className="text-xs text-slate-400 pt-1 leading-normal border-t border-slate-800/60">
                    {opt.rationale}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedIndex !== null && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <span>Next Scenario</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
