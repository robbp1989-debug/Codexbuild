import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Heart, CheckCircle2, ArrowRight, Activity, Brain } from 'lucide-react';

interface EmotionScenario {
  id: string;
  situation: string;
  bodySensations: string[];
  mindThoughts: string[];
  options: { label: string; plausible: boolean; note: string }[];
}

const DECODER_SCENARIOS: EmotionScenario[] = [
  {
    id: 'ed-1',
    situation: 'You are waiting alone at a restaurant table. Your dinner companion is 25 minutes late and has not answered your message.',
    bodySensations: ['Hollow drop in stomach', 'Heat in the face', 'Fidgeting with cutlery'],
    mindThoughts: ['"Everyone in the restaurant is looking at me pityingly."', '"I bet they forgot completely."'],
    options: [
      { label: 'Vulnerability / Embarrassment', plausible: true, note: 'Very natural when waiting alone in public.' },
      { label: 'Abandonment fear', plausible: true, note: 'Taps directly into old fears of not mattering.' },
      { label: 'Irritation / Resentment', plausible: true, note: 'Your time is valuable; feeling irritated is completely valid.' },
      { label: 'Euphoria', plausible: false, note: 'Rarely fits this activating social exposure context.' },
    ],
  },
  {
    id: 'ed-2',
    situation: 'A colleague receives a promotion you quietly hoped to be considered for.',
    bodySensations: ['Tightness across the throat', 'Sudden fatigue', 'Numb chest'],
    mindThoughts: ['"I work twice as hard and remain completely invisible."', '"I should smile and say congratulations."'],
    options: [
      { label: 'Grief / Unmet Longing', plausible: true, note: 'Recognizing lost opportunity is a form of grief.' },
      { label: 'Professional Envy', plausible: true, note: 'Envy is honest data pointing to what you desire.' },
      { label: 'Self-Doubt / Inadequacy', plausible: true, note: 'Comparing yourself triggers automatic unworthiness scripts.' },
      { label: 'Apathy', plausible: false, note: 'Numbness here is likely defense against pain, not true apathy.' },
    ],
  },
];

export const EmotionDecoder: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { playSoftSound, logPracticeSession } = useApp();
  const [index, setIndex] = useState(0);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [finished, setFinished] = useState(false);

  const scenario = DECODER_SCENARIOS[index];

  const handleToggle = (label: string) => {
    if (submitted) return;
    playSoftSound('tap');
    if (selectedEmotions.includes(label)) {
      setSelectedEmotions((prev) => prev.filter((e) => e !== label));
    } else {
      setSelectedEmotions((prev) => [...prev, label]);
    }
  };

  const handleSubmit = () => {
    if (selectedEmotions.length === 0) return;
    playSoftSound('complete');
    setSubmitted(true);
  };

  const handleNext = () => {
    playSoftSound('tap');
    if (index + 1 < DECODER_SCENARIOS.length) {
      setIndex((i) => i + 1);
      setSelectedEmotions([]);
      setSubmitted(false);
    } else {
      setFinished(true);
      logPracticeSession({
        mode: 'emotion_decoder',
        durationSeconds: 45,
        itemsAttempted: DECODER_SCENARIOS.length,
      });
      if (onComplete) onComplete();
    }
  };

  if (finished) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-300 mx-auto flex items-center justify-center">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Emotional Granularity Practiced!</h2>
        <p className="text-slate-300 text-sm">
          Research shows that differentiating subtle emotions (e.g., distinguishing vulnerability from anger) regulates the amygdala faster than generic "bad" feelings.
        </p>
        <button
          onClick={() => {
            setIndex(0);
            setSelectedEmotions([]);
            setSubmitted(false);
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
            GAME 6: EMOTION DECODER
          </span>
          <h2 className="text-lg font-bold text-slate-100">Emotional Granularity</h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Scenario {index + 1} of {DECODER_SCENARIOS.length}
        </span>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <p className="text-sm font-medium text-slate-100 leading-relaxed">{scenario.situation}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="font-semibold text-rose-400 flex items-center gap-1.5 uppercase text-[10px]">
              <Activity className="w-3.5 h-3.5" />
              Somatic Signals:
            </span>
            <ul className="list-disc list-inside text-slate-300 space-y-0.5">
              {scenario.bodySensations.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="font-semibold text-sky-400 flex items-center gap-1.5 uppercase text-[10px]">
              <Brain className="w-3.5 h-3.5" />
              Automatic Thoughts:
            </span>
            <ul className="list-disc list-inside text-slate-300 space-y-0.5">
              {scenario.mindThoughts.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-xs text-slate-400 block font-medium">
          Select all plausible emotion labels that fit this scenario (multiple answers valid):
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {scenario.options.map((opt) => {
            const isSelected = selectedEmotions.includes(opt.label);
            let style = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';

            if (isSelected) {
              style = 'bg-sky-950/60 border-sky-400 text-sky-200 font-semibold';
            }

            return (
              <button
                key={opt.label}
                onClick={() => handleToggle(opt.label)}
                disabled={submitted}
                className={`p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${style}`}
              >
                <span>{opt.label}</span>
                {submitted && (
                  <span className="text-[11px] text-slate-400 block mt-1 leading-snug">
                    {opt.note}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedEmotions.length === 0}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedEmotions.length > 0
                ? 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            Confirm Emotional Choices
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold cursor-pointer"
          >
            <span>Next Scenario</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
