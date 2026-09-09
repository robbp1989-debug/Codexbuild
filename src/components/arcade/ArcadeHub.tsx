import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ArcadeModeType } from '../../types';
import {
  Brain,
  Zap,
  RotateCcw,
  Sparkles,
  Shield,
  Layers,
  Scale,
  Compass,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Flame,
  Info,
  Play,
  Heart,
  UserCheck,
  Pause,
  MessageSquare,
  FlaskConical,
  Activity,
  Waves,
  Crosshair,
} from 'lucide-react';

// Game Engines
import { FactOrStoryMode } from './modes/FactOrStory';
import { KnownPossibleAssumed } from './modes/KnownPossibleAssumed';
import { BothCanBeTrue } from './modes/BothCanBeTrue';
import { MeFirst } from './modes/MeFirst';
import { PerspectiveFlip } from './modes/PerspectiveFlip';
import { EmotionDecoder } from './modes/EmotionDecoder';
import { ResponsibilitySplit } from './modes/ResponsibilitySplit';
import { BoundaryBuilderMode } from './modes/BoundaryBuilder';
import { PauseButton } from './modes/PauseButton';
import { PredictionCheckMode } from './modes/PredictionCheck';
import { WhatDoIWantChanged } from './modes/WhatDoIWantChanged';
import { ChooseYourLane } from './modes/ChooseYourLane';
import { RapidBlitz } from './RapidBlitz';
import { PersonalizedScenarioGame } from './modes/PersonalizedScenarioGame';
import { UrgeSurfer3D } from './3d/UrgeSurfer3D';
import { RealityTarget3D } from './3d/RealityTarget3D';
import { PerspectivePrism3D } from './3d/PerspectivePrism3D';
import { ResponsibilityScale3D } from './3d/ResponsibilityScale3D';

interface ModeMetadata {
  id: ArcadeModeType;
  title: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estMinutes: string;
  category: 'Separation' | 'Perspective' | 'Regulation' | 'Boundaries';
  gameNumber: number;
  is3D?: boolean;
}

const MODES: ModeMetadata[] = [
  {
    id: 'scenario_replay',
    gameNumber: 0,
    title: '3D Scenario Kart Runner',
    tagline: 'Real-time 3D active recall: Steer your kart through TRAP and TRUTH gates to cement psychological reflexes.',
    icon: Sparkles,
    difficulty: 'Beginner',
    estMinutes: '2 min',
    category: 'Regulation',
    is3D: true,
  },
  {
    id: 'urge_surfer_3d',
    gameNumber: 13,
    title: '3D Ocean Urge Surfer',
    tagline: 'Surf 3D ocean swells: ride out acute emotional spikes without acting on knee-jerk reflexes.',
    icon: Waves,
    difficulty: 'Beginner',
    estMinutes: '2 min',
    category: 'Regulation',
    is3D: true,
  },
  {
    id: 'reality_target_3d',
    gameNumber: 14,
    title: '3D Fact vs. Fog Blaster',
    tagline: 'Laser dome target drill: vaporize cognitive fog stories and dock camera facts.',
    icon: Crosshair,
    difficulty: 'Beginner',
    estMinutes: '2 min',
    category: 'Separation',
    is3D: true,
  },
  {
    id: 'perspective_prism_3d',
    gameNumber: 15,
    title: '3D Perspective Prism Chamber',
    tagline: 'Rotate a 3D crystal through 4 angles: Alarm, Camera, Other Person, and Dialectical Synthesis.',
    icon: RotateCcw,
    difficulty: 'Intermediate',
    estMinutes: '2 min',
    category: 'Perspective',
    is3D: true,
  },
  {
    id: 'responsibility_scale_3d',
    gameNumber: 16,
    title: '3D Responsibility Balance',
    tagline: '3D mechanical scale: balance items between My 50% (What I control) and Their 50% (The World).',
    icon: Scale,
    difficulty: 'Beginner',
    estMinutes: '2 min',
    category: 'Boundaries',
    is3D: true,
  },
  {
    id: 'fact_or_story',
    gameNumber: 1,
    title: 'Fact or Story',
    tagline: 'Separate camera-verifiable observations from automatic interpretations.',
    icon: Sparkles,
    difficulty: 'Beginner',
    estMinutes: '1 min',
    category: 'Separation',
  },
  {
    id: 'known_possible_assumed',
    gameNumber: 2,
    title: 'Known / Possible / Assumed',
    tagline: 'Sort statements into Known Facts, Possible Scenarios, and Assumed Mind-reading.',
    icon: Layers,
    difficulty: 'Beginner',
    estMinutes: '1 min',
    category: 'Separation',
  },
  {
    id: 'both_can_be_true',
    gameNumber: 3,
    title: 'Both Can Be True',
    tagline: 'Dialectical holding: understand someone’s stress without abandoning your feelings.',
    icon: Scale,
    difficulty: 'Intermediate',
    estMinutes: '2 min',
    category: 'Perspective',
  },
  {
    id: 'me_first',
    gameNumber: 4,
    title: 'Me First',
    tagline: 'Enforce the sequence: Observe → Feel → Want → Limit → Only then explain them.',
    icon: UserCheck,
    difficulty: 'Intermediate',
    estMinutes: '2 min',
    category: 'Boundaries',
  },
  {
    id: 'perspective_flip',
    gameNumber: 5,
    title: 'Perspective Flip',
    tagline: 'Classify facts, possibilities, assumptions, and rigid overgeneralizations.',
    icon: RotateCcw,
    difficulty: 'Intermediate',
    estMinutes: '2 min',
    category: 'Perspective',
  },
  {
    id: 'emotion_decoder',
    gameNumber: 6,
    title: 'Emotion Decoder',
    tagline: 'Connect body sensations & automatic thoughts to differentiated emotion labels.',
    icon: Heart,
    difficulty: 'Beginner',
    estMinutes: '1 min',
    category: 'Regulation',
  },
  {
    id: 'responsibility_split',
    gameNumber: 7,
    title: 'Responsibility Split',
    tagline: 'Allocate items: My Responsibility / Their Responsibility / Outside Anyone’s Control.',
    icon: Compass,
    difficulty: 'Beginner',
    estMinutes: '1 min',
    category: 'Boundaries',
  },
  {
    id: 'boundary_builder',
    gameNumber: 8,
    title: 'Boundary Builder',
    tagline: 'Assemble 4-part boundary statements: Situation + Boundary + Request + Next Action.',
    icon: Shield,
    difficulty: 'Intermediate',
    estMinutes: '2 min',
    category: 'Boundaries',
  },
  {
    id: 'pause_button',
    gameNumber: 9,
    title: 'The Pause Button',
    tagline: 'Decouple Reaction → Urge → Information Needed → Deliberate Choice.',
    icon: Pause,
    difficulty: 'Intermediate',
    estMinutes: '2 min',
    category: 'Regulation',
  },
  {
    id: 'prediction_lab',
    gameNumber: 10,
    title: 'Prediction Check',
    tagline: 'Select feared predictions and test them against verified reality.',
    icon: FlaskConical,
    difficulty: 'Advanced',
    estMinutes: '2 min',
    category: 'Perspective',
  },
  {
    id: 'what_do_i_want_changed',
    gameNumber: 11,
    title: 'What Do I Want Changed?',
    tagline: 'Urge Dissection: What does your brain believe a drink or escape would alter right now?',
    icon: Activity,
    difficulty: 'Intermediate',
    estMinutes: '2 min',
    category: 'Regulation',
  },
  {
    id: 'choose_your_lane',
    gameNumber: 12,
    title: 'Choose Your Lane',
    tagline: 'Practice clean, direct communication without apologetic overexplaining.',
    icon: MessageSquare,
    difficulty: 'Intermediate',
    estMinutes: '2 min',
    category: 'Boundaries',
  },
];

export const ArcadeHub: React.FC = () => {
  const { practiceSessions, playSoftSound, activeGameContext, clearGameContext, activeShift } = useApp();
  const [activeMode, setActiveMode] = useState<ArcadeModeType | null>(null);
  const [isBlitzActive, setIsBlitzActive] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // If launched with an active context, open that mode automatically
  useEffect(() => {
    if (activeGameContext?.gameId) {
      setActiveMode(activeGameContext.gameId);
    }
  }, [activeGameContext]);

  const filteredModes =
    filterCategory === 'All'
      ? MODES
      : filterCategory === '3D Interactive'
      ? MODES.filter((m) => m.is3D)
      : MODES.filter((m) => m.category === filterCategory);

  const handleSelectMode = (modeId: ArcadeModeType) => {
    playSoftSound('tap');
    setActiveMode(modeId);
  };

  const handleBackToHub = () => {
    playSoftSound('tap');
    setActiveMode(null);
    setIsBlitzActive(false);
    clearGameContext();
  };

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      {/* Rapid Blitz Overlay */}
      {isBlitzActive ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <button
              onClick={handleBackToHub}
              className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-teal-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Arcade Hub</span>
            </button>
            <div className="text-xs font-mono text-teal-300 font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>60-Second Rapid Blitz Active</span>
            </div>
          </div>
          <RapidBlitz onExit={handleBackToHub} />
        </div>
      ) : activeMode ? (
        /* Active Game Engine Viewport */
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <button
              onClick={handleBackToHub}
              className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-teal-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Arcade Hub</span>
            </button>
            <div className="text-xs font-mono text-slate-400">
              Active Engine:{' '}
              <span className="text-teal-300 font-bold">
                {MODES.find((m) => m.id === activeMode)?.title}
              </span>
            </div>
          </div>

          {activeGameContext && (
            <div className="p-3.5 rounded-xl bg-teal-950/60 border border-teal-500/40 text-xs text-teal-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
                <span>
                  <strong>Personalized Context:</strong> Practicing against your theme:{' '}
                  <em>"{activeGameContext.theme || activeGameContext.scenarioText}"</em>
                </span>
              </div>
              <button
                onClick={clearGameContext}
                className="text-teal-400 hover:underline shrink-0 cursor-pointer ml-3 font-medium"
              >
                Reset to Standard Library
              </button>
            </div>
          )}

          {/* Render chosen mode among all 16 */}
          {activeMode === 'scenario_replay' && <PersonalizedScenarioGame onComplete={handleBackToHub} />}
          {activeMode === 'urge_surfer_3d' && <UrgeSurfer3D onComplete={handleBackToHub} />}
          {activeMode === 'reality_target_3d' && <RealityTarget3D onComplete={handleBackToHub} />}
          {activeMode === 'perspective_prism_3d' && <PerspectivePrism3D onComplete={handleBackToHub} />}
          {activeMode === 'responsibility_scale_3d' && <ResponsibilityScale3D onComplete={handleBackToHub} />}
          {activeMode === 'fact_or_story' && <FactOrStoryMode onCompleteSession={handleBackToHub} />}
          {activeMode === 'known_possible_assumed' && <KnownPossibleAssumed onComplete={handleBackToHub} />}
          {activeMode === 'both_can_be_true' && <BothCanBeTrue onComplete={handleBackToHub} />}
          {activeMode === 'me_first' && <MeFirst onComplete={handleBackToHub} />}
          {activeMode === 'perspective_flip' && <PerspectiveFlip onComplete={handleBackToHub} />}
          {activeMode === 'emotion_decoder' && <EmotionDecoder onComplete={handleBackToHub} />}
          {activeMode === 'responsibility_split' && <ResponsibilitySplit onComplete={handleBackToHub} />}
          {activeMode === 'boundary_builder' && <BoundaryBuilderMode onCompleteSession={handleBackToHub} />}
          {activeMode === 'pause_button' && <PauseButton onComplete={handleBackToHub} />}
          {activeMode === 'prediction_lab' && <PredictionCheckMode onCompleteSession={handleBackToHub} />}
          {activeMode === 'what_do_i_want_changed' && <WhatDoIWantChanged onComplete={handleBackToHub} />}
          {activeMode === 'choose_your_lane' && <ChooseYourLane onComplete={handleBackToHub} />}
        </div>
      ) : (
        /* Arcade Hub Catalog View */
        <div className="space-y-8">
          {/* Hero Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/50 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950 border border-teal-500/30 text-teal-400 text-xs font-mono">
                <span>16 REUSABLE GAME ENGINES (5 IN 3D)</span>
                <span>•</span>
                <span>ZERO TYPING</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
                The Reflection Arcade
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Build durable neural retrieval under low stress. Practice separating facts from stories,
                riding out emotional waves, holding dialectical perspectives, and balancing responsibility in real-time 3D environments.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={() => {
                  playSoftSound('chime');
                  setIsBlitzActive(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 transition-all cursor-pointer active:scale-98"
              >
                <Zap className="w-4 h-4" />
                <span>Launch Rapid Blitz (60s)</span>
              </button>
            </div>
          </div>

          {/* Featured Active Scenario Game Card */}
          {activeShift && (
            <div className="rounded-2xl bg-gradient-to-r from-teal-950/90 via-slate-900 to-sky-950/80 border-2 border-teal-500/60 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-mono font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>5 3D PERSONALIZED SCENARIO DRILLS READY</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-100">
                  Play Your Scenario in 3D: "{activeShift.userEditedObservation || activeShift.observation}"
                </h3>
                <p className="text-xs text-slate-300">
                  No turn typing: play with the 3D Kart Runner, 3D Urge Surfer, 3D Fact vs. Fog, 3D Perspective Prism, or 3D Responsibility Balance!
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => {
                    playSoftSound('chime');
                    setActiveMode('scenario_replay');
                  }}
                  className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-950/50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>3D Kart Runner →</span>
                </button>
                <button
                  onClick={() => {
                    playSoftSound('chime');
                    setActiveMode('urge_surfer_3d');
                  }}
                  className="px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-950/50"
                >
                  <Waves className="w-4 h-4" />
                  <span>3D Urge Surfer →</span>
                </button>
              </div>
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
            {['All', '3D Interactive', 'Separation', 'Perspective', 'Boundaries', 'Regulation'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  playSoftSound('tap');
                  setFilterCategory(cat);
                }}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-teal-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'All' ? 'All 16 Engines' : cat === '3D Interactive' ? '⚡ 3D Engines (5)' : cat}
              </button>
            ))}
          </div>

          {/* 16 Game Engines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <div
                  key={mode.id}
                  onClick={() => handleSelectMode(mode.id)}
                  className={`group rounded-2xl bg-slate-900 border p-5 transition-all cursor-pointer shadow-md flex flex-col justify-between space-y-4 ${
                    mode.is3D
                      ? 'border-teal-500/40 hover:border-teal-400 hover:bg-slate-850 hover:shadow-teal-950/30'
                      : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-transform ${
                          mode.is3D
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {mode.is3D && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-950 border border-teal-500/50 text-teal-300 font-black">
                            3D ENGINE
                          </span>
                        )}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                          Game #{mode.gameNumber}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                        {mode.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {mode.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                    <span className="font-mono">{mode.estMinutes}</span>
                    <span className="font-semibold text-teal-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      <span>{mode.is3D ? 'Play in 3D' : 'Play Drill'}</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
