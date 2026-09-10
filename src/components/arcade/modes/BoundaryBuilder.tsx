import { usePracticeContent } from '../../../context/usePracticeContent';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { BookmarkPlus, Check, Sparkles, ArrowRight, Shield } from 'lucide-react';

interface BoundaryPreset {
  title: string;
  situation: string;
  situationOptions: string[];
  boundaryOptions: string[];
  requestOptions: string[];
  nextActionOptions: string[];
}

export const BoundaryBuilderMode: React.FC<{ onCompleteSession?: () => void }> = ({
  onCompleteSession,
}) => {
  const { addBoundary, playSoftSound, logPracticeSession } = useApp();
  const PRESETS = usePracticeContent().boundaries;
  const [presetIndex, setPresetIndex] = useState(0);

  const preset = PRESETS[presetIndex];

  const [selectedSituation, setSelectedSituation] = useState(preset.situationOptions[0]);
  const [selectedBoundary, setSelectedBoundary] = useState(preset.boundaryOptions[0]);
  const [selectedRequest, setSelectedRequest] = useState(preset.requestOptions[0]);
  const [selectedNextAction, setSelectedNextAction] = useState(preset.nextActionOptions[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Switch presets
  const handlePresetChange = (idx: number) => {
    playSoftSound('tap');
    setPresetIndex(idx);
    const p = PRESETS[idx];
    setSelectedSituation(p.situationOptions[0]);
    setSelectedBoundary(p.boundaryOptions[0]);
    setSelectedRequest(p.requestOptions[0]);
    setSelectedNextAction(p.nextActionOptions[0]);
    setSavedSuccess(false);
  };

  const fullStatement = `${selectedSituation} ${selectedBoundary} ${selectedRequest} ${selectedNextAction}`;

  const handleSaveToCards = () => {
    playSoftSound('complete');
    addBoundary({
      title: preset.title,
      situation: selectedSituation,
      boundary: selectedBoundary,
      request: selectedRequest,
      nextAction: selectedNextAction,
      fullStatement,
      tags: ['boundary', preset.title.toLowerCase().split(' ')[0]],
    });
    setSavedSuccess(true);
    logPracticeSession({
      mode: 'boundary_builder',
      durationSeconds: 150,
      itemsAttempted: 1,
      userRating: 'easy',
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="text-teal-400 font-semibold uppercase tracking-wider">
          Mode 5: Boundary Builder (The 4-Part Formula)
        </span>
        <span>Scenario Template {presetIndex + 1} of {PRESETS.length}</span>
      </div>

      {/* Preset selector pills */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => handlePresetChange(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              presetIndex === i
                ? 'bg-teal-500/20 border-teal-400 text-teal-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Component Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Situation */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Observable Situation</span>
          </span>
          <div className="space-y-1.5">
            {preset.situationOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  playSoftSound('tap');
                  setSelectedSituation(opt);
                }}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors border ${
                  selectedSituation === opt
                    ? 'bg-slate-800 border-teal-500/50 text-teal-200 font-medium'
                    : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Boundary */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <span className="text-xs font-mono text-indigo-400 uppercase font-bold flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-indigo-950 text-indigo-300 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Internal Boundary / Need</span>
          </span>
          <div className="space-y-1.5">
            {preset.boundaryOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  playSoftSound('tap');
                  setSelectedBoundary(opt);
                }}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors border ${
                  selectedBoundary === opt
                    ? 'bg-slate-800 border-indigo-500/50 text-indigo-200 font-medium'
                    : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Request */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <span className="text-xs font-mono text-sky-400 uppercase font-bold flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-sky-950 text-sky-300 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Clear Request</span>
          </span>
          <div className="space-y-1.5">
            {preset.requestOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  playSoftSound('tap');
                  setSelectedRequest(opt);
                }}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors border ${
                  selectedRequest === opt
                    ? 'bg-slate-800 border-sky-500/50 text-sky-200 font-medium'
                    : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Next Action */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <span className="text-xs font-mono text-amber-400 uppercase font-bold flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-amber-950 text-amber-300 flex items-center justify-center text-[10px]">
              4
            </span>
            <span>Self-Governed Next Action</span>
          </span>
          <div className="space-y-1.5">
            {preset.nextActionOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  playSoftSound('tap');
                  setSelectedNextAction(opt);
                }}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors border ${
                  selectedNextAction === opt
                    ? 'bg-slate-800 border-amber-500/50 text-amber-200 font-medium'
                    : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assembled Boundary Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-teal-500/40 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-bold flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-teal-400" />
            <span>Assembled Script (Ready for Real-Life Retrieval)</span>
          </span>
          {savedSuccess && (
            <span className="text-xs text-teal-300 font-mono flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved to My Practice Cards
            </span>
          )}
        </div>

        <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed bg-slate-950/80 p-4 rounded-xl border border-slate-800 font-serif">
          "{fullStatement}"
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-400">
            Concise, grounded in personal agency, and free from blame or demands.
          </span>
          <button
            onClick={handleSaveToCards}
            disabled={savedSuccess}
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-teal-500/20"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>{savedSuccess ? 'Saved' : 'Save as Practice Card'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
