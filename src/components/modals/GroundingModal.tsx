import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Eye, Hand, Ear, Wind, Heart, Sparkles, X, Compass, ArrowRight } from 'lucide-react';

export const GroundingModal: React.FC = () => {
  const { groundingModalOpen, setGroundingModalOpen, playSoftSound, setActiveTab } = useApp();
  const [activeStep, setActiveStep] = useState<number>(0);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [breathCounter, setBreathCounter] = useState<number>(4);

  // Breathing pacer loop
  useEffect(() => {
    if (!groundingModalOpen) return;
    const interval = setInterval(() => {
      setBreathCounter((prev) => {
        if (prev <= 1) {
          setBreathPhase((currentPhase) => {
            if (currentPhase === 'Inhale') return 'Hold';
            if (currentPhase === 'Hold') return 'Exhale';
            if (currentPhase === 'Exhale') return 'Pause';
            return 'Inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [groundingModalOpen]);

  if (!groundingModalOpen) return null;

  const groundingSteps = [
    {
      title: 'Feel your feet on the floor',
      instruction:
        'Press your feet gently into the ground. Feel the solid surface beneath you holding your weight. You are right here in this physical room, safe right now.',
      icon: Compass,
      cue: 'Notice the physical contact between the soles of your shoes and the floor.',
    },
    {
      title: '5 Things You Can See',
      instruction:
        'Look around your space and silently notice 5 physical items (e.g. a pattern on the wall, the edge of a desk, light reflections, a pen, a plant).',
      icon: Eye,
      cue: 'Notice their colors, textures, and shadows without judging them.',
    },
    {
      title: '4 Things You Can Touch',
      instruction:
        'Touch 4 surfaces near you: your clothes, the coolness of a desk, the texture of a chair, or the skin of your wrists.',
      icon: Hand,
      cue: 'Feel the tactile temperature and texture directly.',
    },
    {
      title: '3 Things You Can Hear',
      instruction:
        'Listen for 3 distinct ambient sounds: hum of a fan, distant traffic, your own steady breath, or birds outside.',
      icon: Ear,
      cue: 'Just register the acoustic frequency without needing it to stop.',
    },
    {
      title: '2 Things You Can Smell or Taste',
      instruction:
        'Notice any scent in the air (coffee, clean laundry, outside air) or take a sip of cool water.',
      icon: Wind,
      cue: 'Let the sensory data ground your nervous system in the immediate present.',
    },
    {
      title: '1 Sensation of Self-Kindness',
      instruction:
        'Place a warm hand gently over your chest or upper belly. Feel the rise and fall of your heartbeat.',
      icon: Heart,
      cue: 'You do not have to solve anything in this exact moment.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 transition-all">
      <div
        id="grounding-modal-panel"
        className="w-full max-w-2xl bg-slate-900/95 border border-slate-700/60 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100 relative overflow-hidden"
      >
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-wide text-slate-100">
                Grounding & Pause Console
              </h2>
              <p className="text-xs text-slate-400">
                Step back from analysis. Reconnect to your senses and physical safety.
              </p>
            </div>
          </div>
          <button
            id="close-grounding-btn"
            onClick={() => {
              playSoftSound('tap');
              setGroundingModalOpen(false);
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breathing Pacer Banner */}
        <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-14 h-14">
              <div
                className={`absolute inset-0 rounded-full border-2 border-teal-400/40 transition-transform duration-1000 ${
                  breathPhase === 'Inhale'
                    ? 'scale-125 bg-teal-500/20'
                    : breathPhase === 'Hold'
                    ? 'scale-125 bg-teal-500/30'
                    : breathPhase === 'Exhale'
                    ? 'scale-90 bg-teal-500/10'
                    : 'scale-90 bg-slate-800/40'
                }`}
              />
              <span className="text-sm font-mono font-bold text-teal-300">
                {breathCounter}s
              </span>
            </div>
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-teal-400 font-semibold">
                Gentle Box Breathing
              </span>
              <p className="text-sm text-slate-200 font-medium">
                {breathPhase}: {breathPhase === 'Inhale' ? 'Breathe into your belly' : breathPhase === 'Hold' ? 'Hold softly without strain' : breathPhase === 'Exhale' ? 'Slowly release tension' : 'Rest in the stillness'}
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            No rush. Allow your shoulders to drop.
          </span>
        </div>

        {/* Sensory Step Carousel */}
        <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800/70 mb-6 relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-medium">
              Step {activeStep + 1} of {groundingSteps.length}
            </span>
            <div className="flex gap-1.5">
              {groundingSteps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    playSoftSound('tap');
                    setActiveStep(i);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeStep ? 'w-6 bg-teal-400' : 'w-2 bg-slate-700'
                  }`}
                  title={`Go to step ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-start gap-4">
            {React.createElement(groundingSteps[activeStep].icon, {
              className: 'w-7 h-7 text-teal-400 shrink-0 mt-0.5',
            })}
            <div>
              <h3 className="text-base font-semibold text-slate-100 mb-1">
                {groundingSteps[activeStep].title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                {groundingSteps[activeStep].instruction}
              </p>
              <div className="text-xs font-mono text-teal-300/80 bg-teal-950/40 px-3 py-1.5 rounded-md border border-teal-800/30">
                Tip: {groundingSteps[activeStep].cue}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-800/70">
            <button
              disabled={activeStep === 0}
              onClick={() => {
                playSoftSound('tap');
                setActiveStep((prev) => Math.max(0, prev - 1));
              }}
              className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 px-3 py-1.5 rounded transition-colors"
            >
              Previous Cue
            </button>
            <button
              onClick={() => {
                playSoftSound('tap');
                if (activeStep < groundingSteps.length - 1) {
                  setActiveStep((prev) => prev + 1);
                } else {
                  setActiveStep(0);
                }
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {activeStep < groundingSteps.length - 1 ? 'Next Cue' : 'Restart Sensory Cycle'}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            Take as much time as you need. Nothing in SHIFT is timed or forced.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="grounding-take-break-btn"
              onClick={() => {
                playSoftSound('tap');
                setGroundingModalOpen(false);
                setActiveTab('learn');
              }}
              className="flex-1 sm:flex-none text-xs text-slate-300 hover:text-white px-4 py-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 transition-colors border border-slate-700"
            >
              Take a Break (Explore Learn)
            </button>
            <button
              id="grounding-resume-btn"
              onClick={() => {
                playSoftSound('tap');
                setGroundingModalOpen(false);
              }}
              className="flex-1 sm:flex-none text-xs font-medium text-slate-900 px-5 py-2 rounded-lg bg-teal-400 hover:bg-teal-300 transition-colors shadow-lg shadow-teal-500/20"
            >
              I Feel Ready to Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
