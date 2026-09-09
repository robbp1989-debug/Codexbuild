import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EpistemicMemoryItem, EpistemicTag } from '../../types';
import {
  Brain,
  Search,
  CheckCircle2,
  Trash2,
  Plus,
  Shield,
  Layers,
  Sparkles,
  HelpCircle,
  Eye,
  Heart,
  Tag,
} from 'lucide-react';

const TAG_CONFIG: Record<
  EpistemicTag,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  observed_fact: {
    label: 'Observed Fact',
    bg: 'bg-teal-950/40',
    text: 'text-teal-300',
    border: 'border-teal-500/30',
    desc: 'Verifiable camera observation.',
  },
  first_person_experience: {
    label: 'First-Person Experience',
    bg: 'bg-sky-950/40',
    text: 'text-sky-300',
    border: 'border-sky-500/30',
    desc: 'Immediate internal emotion or body signal.',
  },
  working_interpretation: {
    label: 'Working Interpretation',
    bg: 'bg-indigo-950/40',
    text: 'text-indigo-300',
    border: 'border-indigo-500/30',
    desc: 'Plausible explanation under active review.',
  },
  protective_rule: {
    label: 'Protective Rule',
    bg: 'bg-amber-950/40',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    desc: 'Historical defense strategy.',
  },
  tested_belief: {
    label: 'Tested Belief',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    desc: 'Supported by real-world behavioral experiments.',
  },
  known_boundary: {
    label: 'Known Boundary',
    bg: 'bg-purple-950/40',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
    desc: 'Personal standard of acceptable conduct.',
  },
};

export const EpistemicMemoryScreen: React.FC = () => {
  const { memoryItems, addMemoryItem, removeMemoryItem, playSoftSound } = useApp();
  const [filterTag, setFilterTag] = useState<EpistemicTag | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState<EpistemicTag>('working_interpretation');

  const filtered = memoryItems.filter((item) => {
    const matchesTag = filterTag === 'all' || item.type === filterTag;
    const matchesQuery = item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesQuery;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    playSoftSound('complete');
    addMemoryItem({
      id: `mem-${Date.now()}`,
      type: newTag,
      content: newContent.trim(),
      createdAt: new Date().toISOString(),
    });
    setNewContent('');
    setIsAdding(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950 border border-teal-500/30 text-teal-400 text-xs font-mono mb-2">
            <Brain className="w-3.5 h-3.5" />
            <span>EPISTEMIC WORKING MEMORY</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Epistemic Profile
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Separating facts, internal feelings, working hypotheses, protective rules, and tested beliefs.
          </p>
        </div>

        <button
          onClick={() => {
            playSoftSound('tap');
            setIsAdding(!isAdding);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs cursor-pointer transition-all shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? 'Cancel' : 'Add Memory Node'}</span>
        </button>
      </div>

      {/* Add Drawer */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-6 rounded-2xl bg-slate-900 border border-teal-500/40 space-y-4 shadow-xl animate-in fade-in"
        >
          <h3 className="text-sm font-bold text-slate-100">Record an Epistemic Data Point</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Epistemic Status (What kind of knowledge is this?):</label>
              <select
                value={newTag}
                onChange={(e) => setNewTag(e.target.value as EpistemicTag)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
              >
                {Object.entries(TAG_CONFIG).map(([key, conf]) => (
                  <option key={key} value={key}>
                    {conf.label} — {conf.desc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Content / Statement:</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="e.g. When someone is silent, it usually means their bandwidth is full, not that they are upset with me."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold cursor-pointer"
            >
              Save to Memory
            </button>
          </div>
        </form>
      )}

      {/* Search & Tag Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memory..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterTag('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              filterTag === 'all'
                ? 'bg-slate-100 text-slate-950 shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-400'
            }`}
          >
            All ({memoryItems.length})
          </button>
          {Object.entries(TAG_CONFIG).map(([tagKey, conf]) => (
            <button
              key={tagKey}
              onClick={() => setFilterTag(tagKey as EpistemicTag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                filterTag === tagKey
                  ? `${conf.bg} ${conf.text} border ${conf.border} font-bold`
                  : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}
            >
              {conf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const conf = TAG_CONFIG[item.type as EpistemicTag] || TAG_CONFIG.working_interpretation;
          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border ${conf.border} ${conf.bg} space-y-3 shadow-md flex flex-col justify-between`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${conf.text} bg-slate-950/60`}
                  >
                    {conf.label}
                  </span>
                  <button
                    onClick={() => {
                      playSoftSound('tap');
                      removeMemoryItem(item.id);
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                    title="Remove from working memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  "{item.content}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span className="italic">{conf.desc}</span>
                <span className="font-mono text-[10px] text-slate-500">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
