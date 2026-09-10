import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EpistemicTag } from '../../types';
import { Brain, Plus, Search, Trash2 } from 'lucide-react';
import { AccountMemoryPanel } from './AccountMemoryPanel';
import { SourceImportCard } from './SourceImportCard';

type DisplayConfig = {
  label: string;
  bg: string;
  text: string;
  border: string;
  desc: string;
};

const TAG_CONFIG: Record<EpistemicTag, DisplayConfig> = {
  observed_fact: {
    label: 'Observed Fact',
    bg: 'bg-teal-950/40',
    text: 'text-teal-300',
    border: 'border-teal-500/30',
    desc: 'A verifiable observation kept on this device.',
  },
  first_person_experience: {
    label: 'First-Person Experience',
    bg: 'bg-sky-950/40',
    text: 'text-sky-300',
    border: 'border-sky-500/30',
    desc: 'A user-described internal experience.',
  },
  working_interpretation: {
    label: 'Working Interpretation',
    bg: 'bg-indigo-950/40',
    text: 'text-indigo-300',
    border: 'border-indigo-500/30',
    desc: 'An interpretation still under review.',
  },
  protective_rule: {
    label: 'Protective Rule',
    bg: 'bg-amber-950/40',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    desc: 'A protective rule or prediction being examined.',
  },
  tested_belief: {
    label: 'Tested Belief',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    desc: 'A belief compared with real-world evidence.',
  },
  known_boundary: {
    label: 'Known Boundary',
    bg: 'bg-purple-950/40',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
    desc: 'A personal limit or standard the user identified.',
  },
};

const LEARNING_CONFIG: Record<string, DisplayConfig> = {
  BOUNDARY: {
    label: 'Boundary',
    bg: 'bg-purple-950/40',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
    desc: 'A user-identified limit or standard.',
  },
  USER_PREFERENCE: {
    label: 'Preference',
    bg: 'bg-sky-950/40',
    text: 'text-sky-300',
    border: 'border-sky-500/30',
    desc: 'Something the user has said they prefer or want.',
  },
  CONFIRMED_PATTERN: {
    label: 'Confirmed Pattern',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    desc: 'A recurring pattern supported by the user or repeated evidence.',
  },
  WORKING_HYPOTHESIS: {
    label: 'Working Hypothesis',
    bg: 'bg-amber-950/40',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    desc: 'A possible explanation, not a verdict.',
  },
  REJECTED_HYPOTHESIS: {
    label: 'Rejected Hypothesis',
    bg: 'bg-rose-950/35',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
    desc: 'An explanation the user said did not fit. Keeping this prevents repetition.',
  },
  UPDATED_PERSPECTIVE: {
    label: 'Updated Perspective',
    bg: 'bg-teal-950/40',
    text: 'text-teal-300',
    border: 'border-teal-500/30',
    desc: 'A grounded perspective the user accepted or edited.',
  },
  CURRENT_EXPERIMENT: {
    label: 'Current Experiment',
    bg: 'bg-amber-950/30',
    text: 'text-amber-200',
    border: 'border-amber-500/25',
    desc: 'A response or choice the user plans to test.',
  },
  PREDICTION: {
    label: 'Prediction',
    bg: 'bg-orange-950/30',
    text: 'text-orange-300',
    border: 'border-orange-500/25',
    desc: 'A prediction logged before the outcome was known.',
  },
  OUTCOME: {
    label: 'Observed Outcome',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    desc: 'What happened after a prediction or experiment was tested.',
  },
  HELPFUL_STRATEGY: {
    label: 'Helpful Strategy',
    bg: 'bg-cyan-950/40',
    text: 'text-cyan-300',
    border: 'border-cyan-500/30',
    desc: 'A response the user reported was helpful in real life.',
  },
  THERAPY_NOTE: {
    label: 'Therapy Note',
    bg: 'bg-indigo-950/35',
    text: 'text-indigo-300',
    border: 'border-indigo-500/25',
    desc: 'A note the user chose to keep for treatment preparation.',
  },
  CONFIRMED_FACT: {
    label: 'Journal Fact',
    bg: 'bg-slate-900',
    text: 'text-slate-300',
    border: 'border-slate-700',
    desc: 'A device-local journal fact. Raw facts are not normally used as long-term account learning.',
  },
  USER_INTERPRETATION: {
    label: 'Journal Interpretation',
    bg: 'bg-slate-900',
    text: 'text-slate-300',
    border: 'border-slate-700',
    desc: 'A device-local interpretation. It is not treated as a verified fact.',
  },
};

const FALLBACK_CONFIG: DisplayConfig = {
  label: 'Memory',
  bg: 'bg-slate-900',
  text: 'text-slate-300',
  border: 'border-slate-700',
  desc: 'A user-controlled device memory item.',
};

function displayFor(type: string): DisplayConfig {
  return LEARNING_CONFIG[type] || TAG_CONFIG[type as EpistemicTag] || {
    ...FALLBACK_CONFIG,
    label: type.replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (character) => character.toUpperCase()),
  };
}

export const EpistemicMemoryScreen: React.FC = () => {
  const { memoryItems, addMemoryItem, removeMemoryItem, playSoftSound } = useApp();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState<EpistemicTag>('working_interpretation');

  const filterOptions = useMemo(() => {
    const types = [...new Set(memoryItems.map((item) => String(item.type)))];
    return types.sort((a, b) => displayFor(a).label.localeCompare(displayFor(b).label));
  }, [memoryItems]);

  const filtered = memoryItems.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesQuery = item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesQuery;
  });

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
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
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950 border border-sky-500/30 text-sky-300 text-xs font-mono mb-2">
            <Brain className="w-3.5 h-3.5" />
            <span>USER-CONTROLLED LEARNING MEMORY</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100">What SHIFT remembers</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-3xl leading-relaxed">
            SHIFT keeps durable learning separate from raw stories. You can inspect what may influence future reflections, remove it, import prior context once, and keep rejected explanations from being recycled as facts.
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
          <span>{isAdding ? 'Cancel' : 'Add Device Memory'}</span>
        </button>
      </div>

      <SourceImportCard />
      <AccountMemoryPanel />

      <section className="space-y-5 pt-2">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-slate-500">This browser</p>
          <h2 className="text-xl font-bold text-slate-100 mt-1">Device working memory</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            These local records support the current browser and offline/fallback behavior. Account memory above is the cross-device source when signed in.
          </p>
        </div>

        {isAdding && (
          <form onSubmit={handleCreate} className="p-6 rounded-2xl bg-slate-900 border border-teal-500/40 space-y-4 shadow-xl animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-100">Add a device-local memory</h3>
            <p className="text-[11px] text-slate-500">Manual entries stay on this device unless another account action explicitly saves them.</p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">What kind of knowledge is this?</label>
                <select
                  value={newTag}
                  onChange={(event) => setNewTag(event.target.value as EpistemicTag)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                >
                  {Object.entries(TAG_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label} — {config.desc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Memory</label>
                <textarea
                  value={newContent}
                  onChange={(event) => setNewContent(event.target.value)}
                  placeholder="Write the learning in your own words."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold">Save on this device</button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search device memory..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${filterType === 'all' ? 'bg-slate-100 text-slate-950 shadow' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}
            >
              All ({memoryItems.length})
            </button>
            {filterOptions.map((type) => {
              const config = displayFor(type);
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    filterType === type
                      ? `${config.bg} ${config.text} border ${config.border}`
                      : 'bg-slate-900 border border-slate-800 text-slate-400'
                  }`}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.length === 0 && (
            <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center text-xs text-slate-500">No device memories match this view.</div>
          )}

          {filtered.map((item) => {
            const config = displayFor(String(item.type));
            return (
              <div key={item.id} className={`p-5 rounded-2xl border ${config.border} ${config.bg} space-y-3 shadow-md flex flex-col justify-between`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${config.text} bg-slate-950/60`}>{config.label}</span>
                    <button
                      onClick={() => {
                        playSoftSound('tap');
                        removeMemoryItem(item.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                      title="Remove from this device"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">“{item.content}”</p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-end justify-between gap-3 text-[11px] text-slate-400">
                  <span className="italic">{config.desc}</span>
                  <span className="font-mono text-[10px] text-slate-500 shrink-0">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
