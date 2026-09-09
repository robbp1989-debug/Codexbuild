import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShiftBreakdown } from '../../types';
import {
  Sparkles,
  Gamepad2,
  FlaskConical,
  FileText,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Brain,
  Zap,
  Waves,
  Crosshair,
  RotateCcw,
  Scale,
  Play,
  CheckCircle2,
  ChevronDown,
  Eye,
  Activity,
  PlusCircle,
  Lightbulb,
} from 'lucide-react';
import { INITIAL_DEMO_SHIFTS } from '../../data/initialData';

export const MyShiftDashboard: React.FC = () => {
  const {
    shifts,
    setShifts,
    activeShift,
    setActiveShift,
    setActiveTab,
    predictions,
    skillNodes,
    memoryItems,
    launchGameWithContext,
    playSoftSound,
  } = useApp();

  const [selectedShiftId, setSelectedShiftId] = useState<string>(
    activeShift?.id || shifts[0]?.id || 'demo-shift-1'
  );

  // If shifts list is empty, offer fallback
  const availableShifts = shifts.length > 0 ? shifts : INITIAL_DEMO_SHIFTS;
  const currentShift: ShiftBreakdown =
    availableShifts.find((s) => s.id === selectedShiftId) ||
    activeShift ||
    availableShifts[0];

  const handleSelectShift = (shift: ShiftBreakdown) => {
    playSoftSound('tap');
    setSelectedShiftId(shift.id);
    setActiveShift(shift);
  };

  const handleRestoreSamples = () => {
    playSoftSound('chime');
    setShifts(INITIAL_DEMO_SHIFTS);
    setActiveShift(INITIAL_DEMO_SHIFTS[0]);
    setSelectedShiftId(INITIAL_DEMO_SHIFTS[0].id);
  };

  const handleLaunch3DGame = (gameId: string) => {
    playSoftSound('chime');
    launchGameWithContext({
      gameId: gameId as any,
      theme: currentShift.protective_rule_hypothesis || currentShift.observation,
      scenarioText: currentShift.observation,
      sourceShiftId: currentShift.id,
    });
  };

  const pendingPredictions = predictions.filter((p) => p.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      {/* ------------------------------------------------------------------- */}
      {/* HEADER BANNER */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950 border border-teal-500/30 text-teal-400 text-xs font-mono mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span>SHIFT LAB • INTERACTIVE WORKING MODEL</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Shift Lab & Cognitive Sandbox
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Work through real emotional events with 3D physical drills, active hypotheses, and behavioral experiments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              playSoftSound('tap');
              setActiveTab('home');
            }}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Process What Happened</span>
          </button>
          <button
            onClick={() => {
              playSoftSound('tap');
              setActiveTab('arcade');
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
          >
            <Gamepad2 className="w-4 h-4 text-teal-400" />
            <span>Arcade (16 Games)</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* SCENARIO SWITCHER (Ensures Shift Lab is always populated & interactive) */}
      {/* ------------------------------------------------------------------- */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase text-slate-400">
            Active Scenario:
          </span>
          <div className="flex flex-wrap gap-2">
            {availableShifts.map((s, idx) => {
              const isSelected = s.id === currentShift?.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectShift(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  Scenario #{idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {shifts.length === 0 && (
          <button
            onClick={handleRestoreSamples}
            className="text-xs text-teal-400 hover:underline cursor-pointer font-mono"
          >
            ↺ Load Pre-Populated Scenarios
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 5 3D GAMES QUICK LAUNCHER SUITE */}
      {/* ------------------------------------------------------------------- */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 border border-teal-500/40 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>3D INTERACTIVE ENGINES</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mt-1">
              Work Through This Scenario in 3D (No Typing)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Targets loaded from current scenario
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* 1. Kart Runner */}
          <div
            onClick={() => handleLaunch3DGame('scenario_replay')}
            className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-teal-500/60 hover:bg-slate-900/90 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Play className="w-4 h-4 fill-current" />
              </div>
              <h4 className="text-xs font-bold text-slate-100 group-hover:text-teal-300">
                3D Kart Runner
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                Steer through TRAP vs TRUTH gates at comfortable speed.
              </p>
            </div>
            <span className="text-[10px] font-mono text-teal-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>Race</span>
              <span>→</span>
            </span>
          </div>

          {/* 2. Urge Surfer */}
          <div
            onClick={() => handleLaunch3DGame('urge_surfer_3d')}
            className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-sky-500/60 hover:bg-slate-900/90 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Waves className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-100 group-hover:text-sky-300">
                3D Urge Surfer
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                Surf 3D ocean swells; catch anchors, dodge knee-jerk urges.
              </p>
            </div>
            <span className="text-[10px] font-mono text-sky-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>Surf</span>
              <span>→</span>
            </span>
          </div>

          {/* 3. Reality Target */}
          <div
            onClick={() => handleLaunch3DGame('reality_target_3d')}
            className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900/90 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Crosshair className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-300">
                3D Fact vs. Fog
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                Laser target drill: blast cognitive fog stories, dock facts.
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>Aim</span>
              <span>→</span>
            </span>
          </div>

          {/* 4. Perspective Prism */}
          <div
            onClick={() => handleLaunch3DGame('perspective_prism_3d')}
            className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/60 hover:bg-slate-900/90 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <RotateCcw className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-100 group-hover:text-purple-300">
                3D Prism Chamber
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                Rotate crystal: Alarm, Camera, Other Person, Synthesis.
              </p>
            </div>
            <span className="text-[10px] font-mono text-purple-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>Rotate</span>
              <span>→</span>
            </span>
          </div>

          {/* 5. Responsibility Scale */}
          <div
            onClick={() => handleLaunch3DGame('responsibility_scale_3d')}
            className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-900/90 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Scale className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-300">
                3D Responsibility
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                Physics balance: sort My 50% vs Their 50% / The World.
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>Balance</span>
              <span>→</span>
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* ACTIVE SHIFT DETAIL CARD */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Shift Anchor Card */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-teal-400 tracking-wider">
                COGNITIVE DECONSTRUCTION
              </span>
              <span className="text-[11px] text-slate-500">
                Updated {new Date(currentShift.updatedAt).toLocaleDateString()}
              </span>
            </div>

            {/* The Raw Event / Camera Fact */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5" />
                <span>1. Camera Fact (Verifiable Sensory Observation)</span>
              </div>
              <p className="text-sm font-bold text-slate-200 leading-relaxed">
                "{currentShift.userEditedObservation || currentShift.observation}"
              </p>
            </div>

            {/* Mind Story vs Protective Rule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-wider block">
                  2. Alarm Interpretation
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "{currentShift.userEditedInterpretation || currentShift.interpretation}"
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-wider block">
                  3. Underlying Protective Rule
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "{currentShift.userEditedHypothesis || currentShift.protective_rule_hypothesis}"
                </p>
              </div>
            </div>

            {/* Updated Perspective & Experiment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/30 space-y-1">
                <span className="text-[11px] font-mono font-bold text-teal-400 uppercase tracking-wider block">
                  4. Grounded Perspective (Dialectical Truth)
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {currentShift.userEditedPerspective || currentShift.updated_perspective}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-1">
                <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                  5. Deliberate Next Action
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {currentShift.userEditedChoice || currentShift.choice}
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
              <button
                onClick={() => {
                  playSoftSound('tap');
                  setActiveShift(currentShift);
                  setActiveTab('breakdown');
                }}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer underline flex items-center gap-1"
              >
                <span>Edit Full Step-by-Step Breakdown</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleLaunch3DGame('scenario_replay')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold cursor-pointer transition-all shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play in 3D Kart Runner</span>
              </button>
            </div>
          </div>

          {/* Prediction vs Outcome Comparison Panel */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Prediction vs. Real Outcome
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('prediction-lab')}
                className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
              >
                View Prediction Lab ({predictions.length})
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Recording feared consequences beforehand prevents hindsight distortion and allows real belief updating.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400">FEARED OUTCOME</span>
                <span className="text-rose-400 font-mono font-bold">Unconfirmed Feared Story</span>
              </div>
              <div className="text-xs text-slate-300">
                "{currentShift.userEditedInterpretation || currentShift.interpretation}"
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Behavioral Test:</span>
                <span className="text-[11px] text-teal-400 font-medium">
                  {currentShift.real_world_experiment || 'Testing without appeasing or withdrawing'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Skill Practice & Epistemic Memory */}
        <div className="space-y-6">
          {/* Skill Mastery Levels */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-slate-100">Skill Branches</h3>
              </div>
              <button
                onClick={() => setActiveTab('skills')}
                className="text-xs text-teal-400 hover:underline cursor-pointer"
              >
                Skill Tree
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { name: 'Self-Awareness', branch: 'self_awareness', color: 'bg-teal-400' },
                { name: 'Perspective', branch: 'perspective', color: 'bg-sky-400' },
                { name: 'Relationships & Boundaries', branch: 'relationships', color: 'bg-purple-400' },
                { name: 'Regulation', branch: 'regulation', color: 'bg-amber-400' },
              ].map((item) => {
                const count = skillNodes
                  .filter((n) => n.branch === item.branch)
                  .reduce((sum, n) => sum + n.practiceCount, 0);
                return (
                  <div key={item.branch} className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>{item.name}</span>
                      <span className="font-mono text-slate-400">{count} drills</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${item.color}`}
                        style={{ width: `${Math.min(100, count * 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Epistemic Memory Status */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-slate-100">Epistemic Status</h3>
              </div>
              <button
                onClick={() => setActiveTab('memory')}
                className="text-xs text-teal-400 hover:underline cursor-pointer"
              >
                Memory ({memoryItems.length})
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Facts, interpretations, hypotheses, and boundaries are tagged distinctly to prevent false assumptions from hardening into facts.
            </p>

            <div className="space-y-2">
              {memoryItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                      {item.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-300 line-clamp-2">{item.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Therapy Prep CTA Card */}
          <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-indigo-950/30 border border-indigo-500/20 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">Therapy / Counseling Prep</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate a clean summary of your recent reflections and open questions to bring to your next session.
            </p>
            <button
              onClick={() => setActiveTab('therapy-prep')}
              className="w-full py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold cursor-pointer transition-all"
            >
              Generate Therapy Prep Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
