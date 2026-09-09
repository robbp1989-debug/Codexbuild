import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProtectiveRule } from '../../types';
import {
  Brain,
  Plus,
  ArrowRight,
  Sparkles,
  History,
  Archive,
  Play,
  Layers,
  Clock,
  Shield,
  Search,
  CheckCircle2,
  X,
} from 'lucide-react';

export const PatternsPage: React.FC = () => {
  const { rules, addRule, updatePresentDayRule, archiveRule, setActiveTab, playSoftSound } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [selectedRuleForDetails, setSelectedRuleForDetails] = useState<ProtectiveRule | null>(null);

  // New rule form state
  const [newTitle, setNewTitle] = useState('');
  const [newCue, setNewCue] = useState('');
  const [newPrediction, setNewPrediction] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [newPresentDay, setNewPresentDay] = useState('');
  const [newTag, setNewTag] = useState('Work');

  const allTags = ['All', 'Work', 'Relationships', 'Rest', 'Self-Worth', 'Conflict'];

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cueContext.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.currentPresentDayWording.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag =
      selectedTag === 'All' ||
      r.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
    return matchesSearch && matchesTag;
  });

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCue.trim() || !newPrediction.trim() || !newResponse.trim()) return;

    playSoftSound('complete');
    addRule({
      title: newTitle || 'New Protective Pattern',
      cueContext: newCue,
      predictedConsequence: newPrediction,
      protectiveResponse: newResponse,
      originalWording: `When ${newCue}, I predict ${newPrediction}, so I tend to ${newResponse}.`,
      currentPresentDayWording:
        newPresentDay ||
        `When ${newCue}, I can pause, assess the real facts, and communicate clearly.`,
      tags: [newTag.toLowerCase()],
    });

    setIsAddingRule(false);
    setNewTitle('');
    setNewCue('');
    setNewPrediction('');
    setNewResponse('');
    setNewPresentDay('');
  };

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400 font-semibold mb-1">
            <Brain className="w-4 h-4" />
            <span>Private Pattern Lab</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            My Pattern Map & Rule Versions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track learned survival heuristics, their origin cues, and their evolving present-day upgrades.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playSoftSound('tap');
              setIsAddingRule(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Rule</span>
          </button>
        </div>
      </div>

      {/* Sequence Diagram Visualizer */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block">
          The Living Heuristic Loop
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono text-center">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-500 text-[10px]">STAGE 1</div>
            <div className="font-bold text-amber-400">Trigger Cue</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-500 text-[10px]">STAGE 2</div>
            <div className="font-bold text-slate-300">Old Heuristic</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-500 text-[10px]">STAGE 3</div>
            <div className="font-bold text-sky-400">Pre-Action Prediction</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-500 text-[10px]">STAGE 4</div>
            <div className="font-bold text-indigo-400">Real Outcome</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-teal-800/60 col-span-2 sm:col-span-1">
            <div className="text-teal-500 text-[10px]">STAGE 5</div>
            <div className="font-bold text-teal-300">Present-Day Update</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules, cues, or updates..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                playSoftSound('tap');
                setSelectedTag(tag);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                selectedTag === tag
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Rule Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-xl"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                  <h3 className="text-base font-bold text-white">{rule.title}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    v{rule.versionHistory.length}
                  </span>
                </div>
              </div>

              {/* Environmental Cue */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block mb-1">
                  Trigger Cue
                </span>
                <p className="text-slate-300 leading-relaxed">
                  "{rule.cueContext}"
                </p>
              </div>

              {/* Version Evolution: Original vs Present-Day */}
              <div className="space-y-2">
                <div className="text-xs">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block mb-0.5">
                    Original Learned Survival Rule
                  </span>
                  <p className="text-slate-400 italic text-xs leading-relaxed line-through decoration-slate-600">
                    "{rule.originalWording}"
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-800/60 text-xs">
                  <span className="text-[10px] font-mono uppercase text-teal-400 font-bold block mb-1">
                    Current Present-Day Rule (v{rule.versionHistory.length})
                  </span>
                  <p className="text-teal-100 font-medium leading-relaxed">
                    "{rule.currentPresentDayWording}"
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
              <div className="text-[11px] font-mono text-slate-500">
                Created: {new Date(rule.createdAt).toLocaleDateString()}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playSoftSound('tap');
                    setSelectedRuleForDetails(rule);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Versions</span>
                </button>

                <button
                  onClick={() => {
                    playSoftSound('tap');
                    setActiveTab('arcade');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-semibold flex items-center gap-1"
                >
                  <Play className="w-3 h-3 text-teal-400" />
                  <span>Practice</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Version History Modal */}
      {selectedRuleForDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-teal-400" />
                <h3 className="text-lg font-bold text-white">
                  Version History: {selectedRuleForDetails.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRuleForDetails(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {selectedRuleForDetails.versionHistory.map((ver) => (
                <div
                  key={ver.versionNumber}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                    <span className="font-bold text-teal-300">
                      Version {ver.versionNumber}
                    </span>
                    <span>{new Date(ver.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-200 font-medium pt-1">
                    "{ver.wording}"
                  </p>
                  {ver.changeReason && (
                    <p className="text-[11px] text-slate-500 pt-1">
                      <strong>Context of update:</strong> {ver.changeReason}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRuleForDetails(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-medium"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Rule Modal */}
      {isAddingRule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRule}
            className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Add Custom Pattern Rule</h3>
              <button
                type="button"
                onClick={() => setIsAddingRule(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Rule Label / Pattern Name
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Speaking Up in High Stakes"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                When [cue / context] happens:
              </label>
              <input
                type="text"
                required
                value={newCue}
                onChange={(e) => setNewCue(e.target.value)}
                placeholder="e.g. Someone is quiet after my suggestion"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                I predict [catastrophic consequence]:
              </label>
              <input
                type="text"
                required
                value={newPrediction}
                onChange={(e) => setNewPrediction(e.target.value)}
                placeholder="e.g. They think I am incompetent"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                So I tend to [protective response]:
              </label>
              <input
                type="text"
                required
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                placeholder="e.g. Over-explain or apologize"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-teal-400 block mb-1">
                Present-Day Resilient Alternative:
              </label>
              <textarea
                rows={2}
                value={newPresentDay}
                onChange={(e) => setNewPresentDay(e.target.value)}
                placeholder="e.g. Silence often just means people are processing. I can breathe and wait comfortably."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddingRule(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
              >
                Save to Pattern Lab
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
