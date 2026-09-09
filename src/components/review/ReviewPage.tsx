import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ReflectionRecord } from '../../types';
import {
  History,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  BookmarkCheck,
  Scale,
  Sparkles,
  Download,
  Share2,
  Trash2,
} from 'lucide-react';

export const ReviewPage: React.FC = () => {
  const { reflections, setCurrentReflectionId, setActiveTab, playSoftSound, clearAllData } =
    useApp();
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('All');
  const [selectedReflection, setSelectedReflection] = useState<ReflectionRecord | null>(null);

  const filteredReflections = reflections.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.observedEvent.toLowerCase().includes(search.toLowerCase()) ||
      (r.mindStory && r.mindStory.toLowerCase().includes(search.toLowerCase()));

    const matchesOutcome =
      outcomeFilter === 'All' ||
      (outcomeFilter === 'completed' && r.isCompleted) ||
      (outcomeFilter === 'in_progress' && !r.isCompleted) ||
      (r.outcome && r.outcome.outcomeRating === outcomeFilter);

    return matchesSearch && matchesOutcome;
  });

  const handleOpenReflection = (ref: ReflectionRecord) => {
    playSoftSound('tap');
    setCurrentReflectionId(ref.id);
    setActiveTab('reflect');
  };

  const handleExportJSON = () => {
    playSoftSound('complete');
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(reflections, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `shift_reflections_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400 font-semibold mb-1">
            <History className="w-4 h-4" />
            <span>Chronological Evidence Journal</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Review Reflections & Outcome Tests
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Revisit your reflections, check predictions against real outcomes, and observe shifts over time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, emotions, or notes..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { id: 'All', label: 'All Entries' },
            { id: 'completed', label: 'Completed' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'better_than_expected', label: 'Better Than Feared' },
            { id: 'about_as_expected', label: 'As Expected' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                playSoftSound('tap');
                setOutcomeFilter(item.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                outcomeFilter === item.id
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reflections Chronological List */}
      <div className="space-y-4">
        {filteredReflections.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900/40 border border-slate-800 rounded-2xl">
            No reflections matching filter. Start a new reflection or clear your search query.
          </div>
        ) : (
          filteredReflections.map((ref) => {
            const hasPrediction = Boolean(ref.prediction);
            const hasOutcome = Boolean(ref.outcome);

            return (
              <div
                key={ref.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-750 transition-all space-y-4 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        ref.isCompleted ? 'bg-teal-400' : 'bg-amber-400'
                      }`}
                    />
                    <h3 className="text-base font-bold text-white">{ref.title}</h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(ref.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasPrediction && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/70 border border-sky-800/60 text-sky-300">
                        Prediction Locked
                      </span>
                    )}
                    {hasOutcome && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950/70 border border-teal-800/60 text-teal-300">
                        Outcome Recorded
                      </span>
                    )}
                  </div>
                </div>

                {/* Event Excerpt */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                    Observed Event (Camera Test)
                  </span>
                  "{ref.observedEvent || 'No event recorded yet'}"
                </div>

                {/* Emotional Tags & Needs */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {ref.emotions.map((e) => (
                    <span
                      key={e.tag}
                      className="px-2.5 py-0.5 rounded-md bg-indigo-950/50 border border-indigo-900/60 text-indigo-300 text-[11px]"
                    >
                      {e.tag} ({e.intensity}/10)
                    </span>
                  ))}
                  {(ref.needsOrValues || []).map((n) => (
                    <span
                      key={n}
                      className="px-2.5 py-0.5 rounded-md bg-teal-950/50 border border-teal-900/60 text-teal-300 text-[11px]"
                    >
                      Need: {n}
                    </span>
                  ))}
                </div>

                {/* Prediction vs Outcome Preview if exists */}
                {hasPrediction && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 rounded-lg bg-slate-950 border border-amber-900/40">
                      <span className="text-[10px] font-mono uppercase text-amber-400 block mb-0.5">
                        Prediction
                      </span>
                      <p className="text-slate-300">
                        {ref.prediction!.predictedOutcome || ref.prediction!.fearedConsequence}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-teal-900/40">
                      <span className="text-[10px] font-mono uppercase text-teal-400 block mb-0.5">
                        Reality / Outcome
                      </span>
                      <p className="text-slate-300">
                        {ref.outcome ? (
                          ref.outcome.whatActuallyHappened
                        ) : (
                          <span className="text-slate-500 italic">
                            Outcome pending (you can record it anytime)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-xs text-slate-500 font-mono">
                    Last stage: {ref.lastStepCompleted}
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleOpenReflection(ref)}
                      className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <span>
                        {ref.isCompleted ? 'Review Full Sequence' : 'Resume Reflection'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
