import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Gamepad2,
  FlaskConical,
  Save,
  CheckCircle2,
  XCircle,
  Edit3,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Sliders,
  Tag,
  Check,
  RotateCcw,
  BookOpen,
  Eye,
  Pause,
  Scale,
} from 'lucide-react';
import { ShiftBreakdown, ArcadeModeType } from '../../types';

const COMMON_NEEDS = [
  'safety',
  'connection',
  'respect',
  'predictability',
  'autonomy',
  'fairness',
  'acceptance',
  'being heard',
  'control',
  'competence',
  'belonging',
  'relief',
];

export const ShiftBreakdownScreen: React.FC = () => {
  const {
    activeShift,
    saveShiftBreakdown,
    updateShiftBreakdown,
    launchGameWithContext,
    addPrediction,
    setActiveTab,
    playSoftSound,
  } = useApp();

  if (!activeShift) {
    return (
      <div className="text-center py-20 max-w-lg mx-auto px-4">
        <h2 className="text-xl font-semibold text-slate-200 mb-2">No Active Shift Loaded</h2>
        <p className="text-sm text-slate-400 mb-6">
          Start by describing an event on the Home screen or pick an existing shift from your Journal.
        </p>
        <button
          onClick={() => setActiveTab('home')}
          className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold cursor-pointer text-sm"
        >
          Go to Home Screen
        </button>
      </div>
    );
  }

  // Local editable states
  const [editingObservation, setEditingObservation] = useState(false);
  const [obsText, setObsText] = useState(activeShift.userEditedObservation || activeShift.observation);

  const [editingInterpretation, setEditingInterpretation] = useState(false);
  const [interpText, setInterpText] = useState(activeShift.userEditedInterpretation || activeShift.interpretation);

  const [editingHypothesis, setEditingHypothesis] = useState(false);
  const [hypoText, setHypoText] = useState(activeShift.userEditedHypothesis || activeShift.protective_rule_hypothesis);

  const [editingPerspective, setEditingPerspective] = useState(false);
  const [perspText, setPerspText] = useState(activeShift.userEditedPerspective || activeShift.updated_perspective);

  const [customEmotionInput, setCustomEmotionInput] = useState('');
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [fearedConsequence, setFearedConsequence] = useState('');
  const [intendedExperiment, setIntendedExperiment] = useState(activeShift.real_world_experiment || '');
  const [savedBanner, setSavedBanner] = useState(false);

  // Handlers
  const handleToggleEmotion = (emotion: string) => {
    playSoftSound('tap');
    const current = [...activeShift.confirmed_emotions];
    const next = current.includes(emotion) ? current.filter((e) => e !== emotion) : [...current, emotion];
    updateShiftBreakdown(activeShift.id, { confirmed_emotions: next });
  };

  const handleAddCustomEmotion = () => {
    if (!customEmotionInput.trim()) return;
    playSoftSound('tap');
    const emotion = customEmotionInput.trim();
    const current = [...activeShift.confirmed_emotions];
    if (!current.includes(emotion)) {
      updateShiftBreakdown(activeShift.id, {
        confirmed_emotions: [...current, emotion],
        possible_emotions: [...activeShift.possible_emotions, emotion],
      });
    }
    setCustomEmotionInput('');
  };

  const handleToggleNeed = (need: string) => {
    playSoftSound('tap');
    const current = [...activeShift.confirmed_needs];
    const next = current.includes(need) ? current.filter((n) => n !== need) : [...current, need];
    updateShiftBreakdown(activeShift.id, { confirmed_needs: next });
  };

  const handleHypothesisDecision = (status: 'accepted' | 'rejected') => {
    playSoftSound('chime');
    updateShiftBreakdown(activeShift.id, { hypothesisUserStatus: status });
  };

  const handleSaveToProfile = (pref: 'remember' | 'session_only' | 'dont_save') => {
    playSoftSound('complete');
    const updated: ShiftBreakdown = {
      ...activeShift,
      savePreference: pref,
      isSavedToProfile: pref !== 'dont_save',
      userEditedObservation: obsText,
      userEditedInterpretation: interpText,
      userEditedHypothesis: hypoText,
      userEditedPerspective: perspText,
    };
    saveShiftBreakdown(updated);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const handleCommitPrediction = () => {
    if (!intendedExperiment.trim()) return;
    playSoftSound('chime');
    addPrediction({
      reflectionId: activeShift.id,
      cueContext: activeShift.observation,
      intendedAction: intendedExperiment,
      fearedConsequence: fearedConsequence || 'Old catastrophic prediction occurs',
      predictedOutcome: fearedConsequence || 'Old catastrophic prediction occurs',
      confidencePercent: 70,
    });
    setShowPredictionModal(false);
    setActiveTab('prediction-lab');
  };

  const handleLaunchArcade = (gameId?: ArcadeModeType) => {
    playSoftSound('chime');
    if (gameId) {
      launchGameWithContext({
        gameId,
        theme: activeShift.protective_rule_hypothesis,
        scenarioText: activeShift.observation,
        sourceShiftId: activeShift.id,
      });
      setActiveTab('arcade');
    } else {
      setActiveTab('scenario-game');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-teal-950 border border-teal-500/30 text-teal-400 text-xs font-mono mb-2">
            <span>SHIFT BREAKDOWN</span>
            <span>•</span>
            <span className="text-slate-400">Feelings, Techniques & Active Recall Game</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            Personalized Reflection Sequence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Break down feelings & facts → Work through techniques → Cement through active recall in your personalized scenario game.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleLaunchArcade()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-400 to-amber-400 hover:from-teal-300 hover:to-amber-300 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Play Scenario Game</span>
          </button>
          <button
            onClick={() => handleSaveToProfile('remember')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition-all cursor-pointer border border-slate-700"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {savedBanner && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-teal-950 border border-teal-500/50 text-teal-200 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Saved to My Shift profile! Epistemic memory and active theme updated.</span>
        </div>
      )}

      {/* 3-Step Journey Indicator */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="p-3 rounded-xl bg-slate-900 border border-teal-500/30 text-teal-300 flex items-center gap-2.5">
          <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center text-[10px]">
            1
          </span>
          <div>
            <div className="font-bold">Breakdown Feelings & Facts</div>
            <div className="text-[10px] text-slate-400">Camera evidence vs mind stories</div>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 border border-sky-500/30 text-sky-300 flex items-center gap-2.5">
          <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 font-bold flex items-center justify-center text-[10px]">
            2
          </span>
          <div>
            <div className="font-bold">Work Through Techniques</div>
            <div className="text-[10px] text-slate-400">Dialectics & pause button reflex</div>
          </div>
        </div>
        <div
          onClick={() => handleLaunchArcade()}
          className="p-3 rounded-xl bg-gradient-to-r from-teal-950/90 to-amber-950/60 border-2 border-amber-400/80 text-amber-200 flex items-center justify-between cursor-pointer hover:border-amber-300 transition-all shadow-md group"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-[10px]">
              3
            </span>
            <div>
              <div className="font-bold flex items-center gap-1.5">
                <span>Play 3D Scenario Kart Game</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="text-[10px] text-amber-300/80">Cement with active recall in 3D</div>
            </div>
          </div>
          <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-extrabold">
            3D MAIN FOCUS
          </span>
        </div>
      </div>

      {/* Featured Callout Hero: Personalized 3D Scenario Kart Game */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-950/90 via-slate-900 to-amber-950/70 border-2 border-teal-500/60 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-2xl">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-mono font-bold">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>3D ACTIVE RECALL SIMULATOR</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100">
            Play Your Scenario in the 3D Kart Runner
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            No turn-based typing: steer your 3D kart down the highway in real time through TRAP vs TRUTH gates to rewire automatic panic reflexes into grounded responses.
          </p>
        </div>
        <button
          onClick={() => handleLaunchArcade()}
          className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 to-amber-400 hover:from-teal-300 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2.5 cursor-pointer shadow-xl shadow-teal-950/60 shrink-0 hover:scale-105 active:scale-95 transition-all"
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Launch 3D Kart Game Now →</span>
        </button>
      </div>

      {/* S — WHAT HAPPENED (Observation Facts Only) */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center text-xs font-bold font-mono">
              S
            </span>
            <h2 className="text-base font-semibold text-slate-200">
              What Happened <span className="text-xs font-normal text-teal-400">(Objective Camera Facts Only)</span>
            </h2>
          </div>
          <button
            onClick={() => setEditingObservation(!editingObservation)}
            className="text-xs text-slate-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editingObservation ? 'Done' : 'Edit'}</span>
          </button>
        </div>

        {editingObservation ? (
          <textarea
            value={obsText}
            onChange={(e) => {
              setObsText(e.target.value);
              updateShiftBreakdown(activeShift.id, { userEditedObservation: e.target.value });
            }}
            className="w-full h-24 bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 resize-none focus:outline-none focus:border-teal-500"
          />
        ) : (
          <p className="text-sm text-slate-300 bg-slate-950/60 rounded-xl p-4 border border-slate-800/60 leading-relaxed">
            {obsText}
          </p>
        )}
        <span className="text-[11px] text-slate-500 block">
          Observable facts describe what a video camera would record, without motives or conclusions added.
        </span>
      </div>

      {/* H — WHAT YOU MAY BE FEELING (Human Response) */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center text-xs font-bold font-mono">
            H
          </span>
          <h2 className="text-base font-semibold text-slate-200">
            What You May Be Feeling{' '}
            <span className="text-xs font-normal text-sky-400">(Tentative Suggestions — Tap to Confirm)</span>
          </h2>
        </div>

        <p className="text-xs text-slate-400">
          These feelings may fit what you described. Tap the labels that genuinely match your internal state:
        </p>

        {/* Emotion Chips */}
        <div className="flex flex-wrap gap-2">
          {activeShift.possible_emotions.map((emotion) => {
            const isConfirmed = activeShift.confirmed_emotions.includes(emotion);
            return (
              <button
                key={emotion}
                onClick={() => handleToggleEmotion(emotion)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isConfirmed
                    ? 'bg-sky-500/20 border border-sky-400 text-sky-200 shadow-sm shadow-sky-900/40'
                    : 'bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isConfirmed && <Check className="w-3 h-3 text-sky-400" />}
                <span>{emotion}</span>
              </button>
            );
          })}
        </div>

        {/* Add custom emotion */}
        <div className="flex items-center gap-2 max-w-sm pt-1">
          <input
            type="text"
            placeholder="Add your own feeling word..."
            value={customEmotionInput}
            onChange={(e) => setCustomEmotionInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomEmotion()}
            className="text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 grow"
          />
          <button
            onClick={handleAddCustomEmotion}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-medium cursor-pointer border border-slate-700"
          >
            Add
          </button>
        </div>

        {/* Intensity Slider */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-4">
          <span className="text-xs text-slate-400 shrink-0">Intensity (1-10):</span>
          <input
            type="range"
            min="1"
            max="10"
            value={activeShift.emotionIntensity || 5}
            onChange={(e) => {
              playSoftSound('tap');
              updateShiftBreakdown(activeShift.id, { emotionIntensity: Number(e.target.value) });
            }}
            className="w-48 accent-sky-400 cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-sky-400">
            {activeShift.emotionIntensity || 5} / 10
          </span>
        </div>
      </div>

      {/* I — WHAT YOUR MIND MAY BE ADDING (Interpretation / Story) */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold font-mono">
              I
            </span>
            <h2 className="text-base font-semibold text-slate-200">
              What Your Mind May Be Adding{' '}
              <span className="text-xs font-normal text-indigo-400">(Interpretation vs Fact)</span>
            </h2>
          </div>
          <button
            onClick={() => setEditingInterpretation(!editingInterpretation)}
            className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editingInterpretation ? 'Done' : 'Edit'}</span>
          </button>
        </div>

        {editingInterpretation ? (
          <textarea
            value={interpText}
            onChange={(e) => {
              setInterpText(e.target.value);
              updateShiftBreakdown(activeShift.id, { userEditedInterpretation: e.target.value });
            }}
            className="w-full h-24 bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 resize-none focus:outline-none focus:border-indigo-500"
          />
        ) : (
          <p className="text-sm text-slate-300 bg-slate-950/60 rounded-xl p-4 border border-slate-800/60 leading-relaxed">
            {interpText}
          </p>
        )}
        <span className="text-[11px] text-slate-500 block">
          This is the narrative, assumption, or mind-reading your brain layered onto the event.
        </span>
      </div>

      {/* WHAT MAY MATTER HERE (Core Needs) */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-3">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <Tag className="w-4 h-4 text-amber-400" />
          <span>What May Matter Here (Underlying Core Needs)</span>
        </h2>
        <p className="text-xs text-slate-400">
          Strong reactions usually emerge because an important human need felt threatened. Tap the needs at stake:
        </p>
        <div className="flex flex-wrap gap-2">
          {COMMON_NEEDS.map((need) => {
            const isSelected = activeShift.confirmed_needs.includes(need);
            return (
              <button
                key={need}
                onClick={() => handleToggleNeed(need)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer capitalize ${
                  isSelected
                    ? 'bg-amber-500/20 border border-amber-400 text-amber-200'
                    : 'bg-slate-800/70 border border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {need}
              </button>
            );
          })}
        </div>
      </div>

      {/* F — POSSIBLE OLD PROTECTIVE RULE (Hypothesis Only) */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold font-mono">
              F
            </span>
            <h2 className="text-base font-semibold text-slate-200">
              Possible Protective Rule{' '}
              <span className="text-xs font-mono font-normal uppercase px-2 py-0.5 rounded bg-purple-950 border border-purple-600/30 text-purple-300">
                Working Hypothesis
              </span>
            </h2>
          </div>
          <button
            onClick={() => setEditingHypothesis(!editingHypothesis)}
            className="text-xs text-slate-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editingHypothesis ? 'Done' : 'Edit'}</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-purple-500/20 space-y-2">
          {editingHypothesis ? (
            <textarea
              value={hypoText}
              onChange={(e) => {
                setHypoText(e.target.value);
                updateShiftBreakdown(activeShift.id, { userEditedHypothesis: e.target.value });
              }}
              className="w-full h-20 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 resize-none focus:outline-none focus:border-purple-500"
            />
          ) : (
            <p className="text-sm font-medium text-purple-200 leading-relaxed italic">
              "{hypoText}"
            </p>
          )}
          <span className="text-[11px] text-slate-400 block">
            This hypothesis is a suggestion, not a verdict. You control whether it becomes part of your working model.
          </span>
        </div>

        {/* User Hypothesis Decision Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => handleHypothesisDecision('accepted')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeShift.hypothesisUserStatus === 'accepted'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>Yes, that fits</span>
          </button>

          <button
            onClick={() => handleHypothesisDecision('rejected')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeShift.hypothesisUserStatus === 'rejected'
                ? 'bg-rose-500/30 border border-rose-400 text-rose-200'
                : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200'
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>No, that doesn't fit</span>
          </button>

          <button
            onClick={() => setEditingHypothesis(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
            <span>Edit wording</span>
          </button>
        </div>
      </div>

      {/* T — UPDATED PERSPECTIVE (Grounded, Quality-Gated Reappraisal) */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border border-teal-500/30 p-5 sm:p-6 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center text-xs font-bold font-mono">
              T
            </span>
            <h2 className="text-base font-semibold text-slate-100">
              Updated Perspective{' '}
              <span className="text-xs font-normal text-teal-300">(Accurate • Believable • No Toxic Positivity)</span>
            </h2>
          </div>
          <button
            onClick={() => setEditingPerspective(!editingPerspective)}
            className="text-xs text-slate-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editingPerspective ? 'Done' : 'Edit'}</span>
          </button>
        </div>

        {editingPerspective ? (
          <textarea
            value={perspText}
            onChange={(e) => {
              setPerspText(e.target.value);
              updateShiftBreakdown(activeShift.id, { userEditedPerspective: e.target.value });
            }}
            className="w-full h-24 bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 resize-none focus:outline-none focus:border-teal-500"
          />
        ) : (
          <p className="text-sm text-teal-100 bg-slate-950/70 rounded-xl p-4 border border-teal-500/20 leading-relaxed font-medium">
            {perspText}
          </p>
        )}

        {/* Present Day Choice / Behavioral Experiment */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            One Small Present-Day Move to Try Today:
          </span>
          <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
            {activeShift.choice}
          </p>
        </div>
      </div>

      {/* Action Suite: Flagship Personalized Game as Centerpiece */}
      <div className="space-y-4 pt-4">
        {/* Main Focus: Full Personalized Scenario Game */}
        <div className="rounded-3xl bg-gradient-to-r from-teal-950 via-slate-900 to-amber-950/80 border-2 border-teal-500/70 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-mono font-bold">
                <Gamepad2 className="w-4 h-4 text-teal-400" />
                <span>STEP 3 • 3D ACTIVE RECALL SIMULATOR</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-100">
                Play Through Your 3D Scenario Kart Game
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Active recall is the most effective psychological method to transform intellectual insight into automatic neural habits. Steer your 3D kart in real time across four psychological circuits:
              </p>
            </div>

            <button
              onClick={() => handleLaunchArcade()}
              className="w-full md:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-400 to-amber-400 hover:from-teal-300 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-3 cursor-pointer shadow-xl shadow-teal-950/60 hover:scale-105 active:scale-95 transition-all shrink-0"
            >
              <Gamepad2 className="w-5 h-5" />
              <span>Launch 3D Scenario Kart Game →</span>
            </button>
          </div>

          {/* 4 Interactive 3D Circuits Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
              <div className="text-teal-400 font-bold flex items-center gap-1.5">
                <span>1. Camera Fact vs Story</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Steer into Camera Fact lanes, dodging catastrophic mind interpretations.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
              <div className="text-amber-400 font-bold flex items-center gap-1.5">
                <span>2. The Pause Button</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Dodge urgent panic knee-jerk reflexes and steer into the regulated pause lane.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
              <div className="text-sky-400 font-bold flex items-center gap-1.5">
                <span>3. Both Can Be True</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Hold dual truths simultaneously without collapsing into blame or self-erasure.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span>4. Grounded Action</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Execute your grounded values-aligned choice under real-time simulation.
              </p>
            </div>
          </div>

          {/* Quick Scenario-Specific Targeted Drills */}
          <div className="border-t border-slate-800/80 pt-4 space-y-2">
            <span className="text-xs font-mono uppercase text-slate-400 font-semibold block">
              Or Jump Directly to a Targeted Scenario Drill:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleLaunchArcade('fact_or_story')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer border border-slate-700"
              >
                <Eye className="w-3.5 h-3.5 text-teal-400" />
                <span>Fact vs Story (Your Scenario)</span>
              </button>

              <button
                onClick={() => handleLaunchArcade('pause_button')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer border border-slate-700"
              >
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span>The Pause Button (Your Scenario)</span>
              </button>

              <button
                onClick={() => handleLaunchArcade('both_can_be_true')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer border border-slate-700"
              >
                <Scale className="w-3.5 h-3.5 text-sky-400" />
                <span>Both Can Be True (Your Scenario)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Actions: Prediction Lab & Profile Memory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Commit to Prediction Lab */}
          <div
            onClick={() => {
              playSoftSound('tap');
              setShowPredictionModal(true);
            }}
            className="group rounded-2xl bg-gradient-to-b from-amber-950/30 to-slate-900 border border-amber-500/40 p-5 hover:border-amber-400 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <FlaskConical className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-600/30 uppercase">
                Real-World Test
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
              Commit to Prediction Lab
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Lock in your prediction now; return later to record what actually happened in real life.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-400">
              <span>Set up experiment</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Save to Profile Options */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center mb-3">
                <Save className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Profile Memory Controls</h3>
              <p className="text-xs text-slate-400 mt-1">
                Decide how this reflection is preserved in your system model.
              </p>
            </div>

            <div className="space-y-1.5 pt-3">
              <button
                onClick={() => handleSaveToProfile('remember')}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer flex items-center justify-between"
              >
                <span>Remember This</span>
                {activeShift.savePreference === 'remember' && <Check className="w-3.5 h-3.5 text-teal-400" />}
              </button>
              <button
                onClick={() => handleSaveToProfile('session_only')}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer flex items-center justify-between"
              >
                <span>Use for This Session Only</span>
                {activeShift.savePreference === 'session_only' && <Check className="w-3.5 h-3.5 text-teal-400" />}
              </button>
              <button
                onClick={() => handleSaveToProfile('dont_save')}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-750 text-rose-300 cursor-pointer flex items-center justify-between"
              >
                <span>Don't Save This</span>
                {activeShift.savePreference === 'dont_save' && <Check className="w-3.5 h-3.5 text-rose-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Modal */}
      {showPredictionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-amber-400" />
                <span>Commit Behavioral Experiment</span>
              </h3>
              <button
                onClick={() => setShowPredictionModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">What action will you try?</label>
                <textarea
                  value={intendedExperiment}
                  onChange={(e) => setIntendedExperiment(e.target.value)}
                  className="w-full h-20 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 resize-none focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  What does your old system fear will happen? (Feared consequence)
                </label>
                <input
                  type="text"
                  placeholder="e.g. They will permanently reject me or think I'm combative"
                  value={fearedConsequence}
                  onChange={(e) => setFearedConsequence(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowPredictionModal(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCommitPrediction}
                className="px-4 py-2 rounded-lg text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
              >
                Lock Prediction & Go to Lab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
