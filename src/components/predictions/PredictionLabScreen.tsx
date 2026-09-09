import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PredictionRecord } from '../../types';
import {
  FlaskConical,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Plus,
  Scale,
  Percent,
} from 'lucide-react';

export const PredictionLabScreen: React.FC = () => {
  const { predictions, updatePrediction, addPrediction, playSoftSound, setActiveTab } = useApp();
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'pending' | 'tested'>('all');
  const [editingPredId, setEditingPredId] = useState<string | null>(null);
  const [outcomeText, setOutcomeText] = useState('');
  const [learningText, setLearningText] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // New prediction form states
  const [newContext, setNewContext] = useState('');
  const [newPredicted, setNewPredicted] = useState('');
  const [newConfidence, setNewConfidence] = useState(80);
  const [newExperiment, setNewExperiment] = useState('');

  const filtered =
    activeTabFilter === 'all'
      ? predictions
      : predictions.filter((p) => p.status === activeTabFilter);

  const handleSaveOutcome = (id: string) => {
    if (!outcomeText.trim()) return;
    playSoftSound('complete');
    updatePrediction(id, {
      status: 'tested',
      whatActuallyHappened: outcomeText.trim(),
      learningNote: learningText.trim(),
    });
    setEditingPredId(null);
    setOutcomeText('');
    setLearningText('');
  };

  const handleCreatePrediction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContext.trim() || !newPredicted.trim()) return;
    playSoftSound('complete');
    addPrediction({
      cueContext: newContext.trim(),
      intendedAction: newExperiment.trim(),
      fearedConsequence: newPredicted.trim(),
      predictedOutcome: newPredicted.trim(),
      confidencePercent: newConfidence,
    });
    setIsCreating(false);
    setNewContext('');
    setNewPredicted('');
    setNewExperiment('');
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950 border border-amber-500/30 text-amber-400 text-xs font-mono mb-2">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>BELIEF UPDATING ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Prediction Lab
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Test automatic catastrophic predictions against verified real-world outcomes to systematically update your working model.
          </p>
        </div>

        <button
          onClick={() => {
            playSoftSound('tap');
            setIsCreating(!isCreating);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs cursor-pointer transition-all shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Cancel' : 'Log New Prediction'}</span>
        </button>
      </div>

      {/* New Prediction Form Drawer */}
      {isCreating && (
        <form
          onSubmit={handleCreatePrediction}
          className="p-6 rounded-2xl bg-slate-900 border border-teal-500/40 space-y-4 shadow-xl animate-in fade-in"
        >
          <h3 className="text-sm font-bold text-slate-100">Log a Feared Prediction Before It Happens</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Triggering Situation / Context:</label>
              <input
                type="text"
                value={newContext}
                onChange={(e) => setNewContext(e.target.value)}
                placeholder="e.g. Speaking up in Monday sprint review"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Feared Automatic Prediction (What your old protective rule warns will happen):</label>
              <input
                type="text"
                value={newPredicted}
                onChange={(e) => setNewPredicted(e.target.value)}
                placeholder="e.g. Everyone will cringe, think I am incompetent, and speak over me."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Subjective Confidence Rating:</span>
                <span className="font-mono text-teal-300 font-bold">{newConfidence}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={newConfidence}
                onChange={(e) => setNewConfidence(Number(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold cursor-pointer"
            >
              Save Prediction
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {(['all', 'pending', 'tested'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              playSoftSound('tap');
              setActiveTabFilter(tab);
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold uppercase font-mono cursor-pointer transition-all ${
              activeTabFilter === tab
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab} ({predictions.filter((p) => tab === 'all' || p.status === tab).length})
          </button>
        ))}
      </div>

      {/* Prediction Cards */}
      <div className="space-y-4">
        {filtered.map((pred) => {
          const isPending = pred.status === 'pending';
          const isEditing = editingPredId === pred.id;

          return (
            <div
              key={pred.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  Context: {pred.cueContext}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                    pred.status === 'tested'
                      ? 'bg-teal-950 text-teal-300 border border-teal-700/50'
                      : 'bg-amber-950 text-amber-300 border border-amber-700/50'
                  }`}
                >
                  {pred.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">
                      Feared Prediction
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {pred.confidencePercent}% confidence
                    </span>
                  </div>
                  <p className="text-slate-200 italic">"{pred.predictedOutcome}"</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-teal-500/20 space-y-1">
                  <span className="text-[10px] font-bold text-teal-400 uppercase">
                    Real-World Outcome
                  </span>
                  <p className="text-slate-200">
                    {pred.whatActuallyHappened
                      ? `"${pred.whatActuallyHappened}"`
                      : 'Pending behavioral experiment.'}
                  </p>
                  {pred.learningNote && (
                    <span className="text-[11px] text-teal-300 block pt-1 border-t border-slate-800">
                      <strong>Model Update:</strong> {pred.learningNote}
                    </span>
                  )}
                </div>
              </div>

              {/* Complete Experiment Form */}
              {isEditing ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs animate-in fade-in">
                  <span className="font-bold text-slate-200 block">Record Experiment Result</span>
                  <div>
                    <label className="text-slate-400 block mb-1">What actually happened?</label>
                    <input
                      type="text"
                      value={outcomeText}
                      onChange={(e) => setOutcomeText(e.target.value)}
                      placeholder="e.g. They thanked me for pointing it out and made the change."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">What does this teach your working model?</label>
                    <input
                      type="text"
                      value={learningText}
                      onChange={(e) => setLearningText(e.target.value)}
                      placeholder="e.g. People value input when presented calmly."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setEditingPredId(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveOutcome(pred.id)}
                      className="px-4 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold"
                    >
                      Update Model
                    </button>
                  </div>
                </div>
              ) : isPending ? (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      playSoftSound('tap');
                      setEditingPredId(pred.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold cursor-pointer"
                  >
                    <span>Record Outcome</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
