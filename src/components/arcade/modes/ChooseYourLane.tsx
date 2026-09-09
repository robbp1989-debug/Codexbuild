import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { CheckCircle2, ArrowRight, ShieldCheck, MessageSquare, AlertCircle } from 'lucide-react';

interface LaneScenario {
  id: string;
  context: string;
  category: 'preference' | 'disagreement' | 'request' | 'boundary';
  options: {
    text: string;
    style: 'clean_direct' | 'overexplaining' | 'aggressive' | 'passive_aggressive';
    feedback: string;
  }[];
}

const LANE_SCENARIOS: LaneScenario[] = [
  {
    id: 'cyl-1',
    context: 'Friends are deciding where to get dinner. Someone suggests sushi, but you don’t eat raw fish.',
    category: 'preference',
    options: [
      {
        text: 'Sushi doesn’t work well for me tonight, but I’d love Italian or Mexican if either sounds good to you.',
        style: 'clean_direct',
        feedback: 'Direct, polite, states your preference without an apology or medical justification.',
      },
      {
        text: 'I am so so sorry to be difficult, I have this weird stomach thing and raw fish gives me anxiety, I feel awful ruining everyone’s plans...',
        style: 'overexplaining',
        feedback: 'Overexplaining signals shame for having a normal human food preference.',
      },
      {
        text: 'Whatever. You guys always pick whatever you want anyway.',
        style: 'passive_aggressive',
        feedback: 'Passive-aggressive resentment masks honest communication.',
      },
    ],
  },
  {
    id: 'cyl-2',
    context: 'A coworker asks you to take over their project notes while they leave early for personal errands.',
    category: 'boundary',
    options: [
      {
        text: 'I won’t be able to take that on today as I’m at capacity with the Q3 release.',
        style: 'clean_direct',
        feedback: 'Clean boundary. No fabricated excuse, no lengthy apologetic preamble.',
      },
      {
        text: 'Oh gosh, I wish I could, you know I’m always happy to help everyone, but my dog had a vet appointment and my aunt called and...',
        style: 'overexplaining',
        feedback: 'Fictional or excessive justification invites negotiation or judgment.',
      },
      {
        text: 'Why do you always expect me to do your work for you?!',
        style: 'aggressive',
        feedback: 'Aggressive escalation usually stems from failing to set boundaries earlier.',
      },
    ],
  },
  {
    id: 'cyl-3',
    context: 'In a design meeting, a team member presents a layout idea you believe will confuse users on mobile.',
    category: 'disagreement',
    options: [
      {
        text: 'I have a different perspective on the mobile layout. I worry the two-column cards will compress tap targets below 44px.',
        style: 'clean_direct',
        feedback: 'Professional, objective, grounds disagreement in concrete technical criteria rather than personal attack.',
      },
      {
        text: 'I mean, I know I’m probably totally wrong and you know way more than me, but maybe possibly could it be confusing? Sorry!',
        style: 'overexplaining',
        feedback: 'Extreme hedging undermines your professional expertise and wastes meeting time.',
      },
      {
        text: 'This design is completely unusable garbage.',
        style: 'aggressive',
        feedback: 'Hostile critique creates defensive shutdown rather than collaboration.',
      },
    ],
  },
];

export const ChooseYourLane: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { playSoftSound, logPracticeSession } = useApp();
  const [index, setIndex] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const scenario = LANE_SCENARIOS[index];

  const handleSelect = (idx: number) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(idx);
    const opt = scenario.options[idx];
    if (opt.style === 'clean_direct') {
      playSoftSound('complete');
      setScore((s) => s + 1);
    } else {
      playSoftSound('tap');
    }
  };

  const handleNext = () => {
    playSoftSound('tap');
    if (index + 1 < LANE_SCENARIOS.length) {
      setIndex((i) => i + 1);
      setSelectedIdx(null);
    } else {
      setFinished(true);
      logPracticeSession({
        mode: 'choose_your_lane',
        durationSeconds: 50,
        itemsAttempted: LANE_SCENARIOS.length,
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
        <h2 className="text-2xl font-bold text-slate-100">Clean Communication Practiced!</h2>
        <p className="text-slate-300 text-sm">
          You selected clean, direct responses in {score} of {LANE_SCENARIOS.length} scenarios.
        </p>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Stating your boundaries and preferences without apologetic overexplaining preserves your dignity and builds trust.
        </p>
        <button
          onClick={() => {
            setIndex(0);
            setSelectedIdx(null);
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
          <span className="text-xs font-mono font-bold uppercase text-teal-400">
            GAME 12: CHOOSE YOUR LANE
          </span>
          <h2 className="text-lg font-bold text-slate-100">Values-Aligned Clean Communication</h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Scenario {index + 1} of {LANE_SCENARIOS.length}
        </span>
      </div>

      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
        <span className="text-[11px] font-mono uppercase text-teal-400 font-bold">
          Category: {scenario.category.toUpperCase()}
        </span>
        <p className="text-sm font-medium text-slate-100">{scenario.context}</p>
      </div>

      <span className="text-xs text-slate-400 block font-medium">
        Select the clean, direct response (no unnecessary overexplaining or appeasement):
      </span>

      <div className="space-y-3">
        {scenario.options.map((opt, idx) => {
          const isChosen = selectedIdx === idx;
          const isDirect = opt.style === 'clean_direct';
          let style = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';

          if (selectedIdx !== null) {
            if (isDirect) style = 'bg-teal-950/60 border-teal-400 text-teal-200 font-medium';
            else if (isChosen) style = 'bg-rose-950/50 border-rose-400 text-rose-200';
            else style = 'bg-slate-950 border-slate-900 text-slate-600';
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selectedIdx !== null}
              className={`w-full p-4 rounded-xl border text-left text-xs transition-all cursor-pointer ${style}`}
            >
              <p className="leading-relaxed">"{opt.text}"</p>
              {selectedIdx !== null && (
                <span className="text-[11px] text-slate-400 block mt-2 pt-2 border-t border-slate-800">
                  <strong>{opt.style.replace('_', ' ').toUpperCase()}:</strong> {opt.feedback}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedIdx !== null && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold cursor-pointer"
          >
            <span>Next Scenario</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
