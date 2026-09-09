import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Activity, Compass } from 'lucide-react';

const TARGET_STATES = [
  { id: 'anxiety', label: 'Anxiety / Racing Mind', altAction: '10 minutes of physical movement or cold water splash' },
  { id: 'social_inhibition', label: 'Social Inhibition / Self-Consciousness', altAction: 'Take 3 slow breaths, remind yourself: "I do not need to perform"' },
  { id: 'anger', label: 'Anger / Resentment', altAction: 'Write down raw uncensored thoughts on scrap paper, then tear it up' },
  { id: 'loneliness', label: 'Loneliness / Disconnection', altAction: 'Send a low-stakes friendly text or walk in a populated park' },
  { id: 'shame', label: 'Shame / Feeling Defective', altAction: 'Name the shame out loud: "I am feeling shame, which is human, not fatal"' },
  { id: 'emotional_intensity', label: 'Emotional Overwhelm / Volume Too High', altAction: 'Sensory downshift: dim the lights, put on noise-cancelling headphones' },
  { id: 'intrusive_thoughts', label: 'Intrusive Thoughts / Mental Replay', altAction: 'Ground in 5-4-3-2-1 sensory awareness' },
  { id: 'uncertainty', label: 'Uncertainty / Lack of Control', altAction: 'Focus on one 5-minute task you have 100% control over' },
  { id: 'boredom', label: 'Boredom / Restless Emptiness', altAction: 'Novel tactile activity (cook a complex recipe, stretch, organize)' },
  { id: 'need_for_relief', label: 'Exhaustion / Desperate Need for Relief', altAction: 'Lie flat on floor with legs up on wall for 10 minutes' },
];

export const WhatDoIWantChanged: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { playSoftSound, logPracticeSession } = useApp();
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleToggle = (id: string) => {
    if (confirmed) return;
    playSoftSound('tap');
    if (selectedTargets.includes(id)) {
      setSelectedTargets((prev) => prev.filter((t) => t !== id));
    } else {
      setSelectedTargets((prev) => [...prev, id]);
    }
  };

  const handleConfirm = () => {
    if (selectedTargets.length === 0) return;
    playSoftSound('complete');
    setConfirmed(true);
  };

  const handleFinish = () => {
    playSoftSound('complete');
    setFinished(true);
    logPracticeSession({
      mode: 'what_do_i_want_changed',
      durationSeconds: 60,
      itemsAttempted: selectedTargets.length,
    });
    if (onComplete) onComplete();
  };

  if (finished) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-300 mx-auto flex items-center justify-center">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Urge Dissection Completed!</h2>
        <p className="text-slate-300 text-sm">
          You separated the <strong>target emotional need</strong> from the automated chemical or escape impulse.
        </p>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          An urge is not a moral failing; it is information about an internal state your nervous system wants to alter.
        </p>
        <button
          onClick={() => {
            setSelectedTargets([]);
            setConfirmed(false);
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
          <span className="text-xs font-mono font-bold uppercase text-purple-400">
            GAME 11: WHAT DO I WANT CHANGED?
          </span>
          <h2 className="text-lg font-bold text-slate-100">Urge Dissection</h2>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <span className="text-[11px] text-purple-400 font-mono uppercase tracking-wider block">
          Core Question for Escapes, Cravings & Compulsions:
        </span>
        <h3 className="text-base sm:text-lg font-bold text-slate-100">
          "What does your brain believe this substance or escape would change right now?"
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Tap every internal condition below that your brain is attempting to alter or silence:
        </p>
      </div>

      {/* Target Chips Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {TARGET_STATES.map((state) => {
          const isSelected = selectedTargets.includes(state.id);
          let style = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';

          if (isSelected) {
            style = 'bg-purple-950/60 border-purple-400 text-purple-200 font-semibold shadow-sm';
          }

          return (
            <button
              key={state.id}
              onClick={() => handleToggle(state.id)}
              disabled={confirmed}
              className={`p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${style}`}
            >
              <span>{state.label}</span>
            </button>
          );
        })}
      </div>

      {!confirmed ? (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleConfirm}
            disabled={selectedTargets.length === 0}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTargets.length > 0
                ? 'bg-purple-500 hover:bg-purple-400 text-slate-950'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            Identify Target States
          </button>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/40 space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
            <Compass className="w-4 h-4 text-purple-400" />
            <span>Targeted Alternatives to Address the Real Need:</span>
          </div>

          <div className="space-y-2 text-xs">
            {selectedTargets.map((id) => {
              const state = TARGET_STATES.find((s) => s.id === id);
              if (!state) return null;
              return (
                <div key={id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="font-bold text-purple-300">{state.label}:</span>
                  <p className="text-slate-300">{state.altAction}</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleFinish}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold cursor-pointer"
            >
              <span>Complete Urge Dissection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
