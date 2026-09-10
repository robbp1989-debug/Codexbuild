'use client';

import React, { useEffect, useState } from 'react';
import { Brain, FileLock2, Loader2, RefreshCw, Trash2 } from 'lucide-react';

interface AccountMemory {
  id: string;
  type: string;
  label: string;
  summary: string;
  tags: string[];
  confidence: string;
  sourceKind: string;
  evidenceCount: number;
  updatedAt: string;
}

interface AccountSource {
  id: string;
  originalName: string;
  contentType: string;
  byteSize: number;
  extractionStatus: string;
  createdAt: string;
}

export const AccountMemoryPanel: React.FC = () => {
  const [memories, setMemories] = useState<AccountMemory[]>([]);
  const [sources, setSources] = useState<AccountSource[]>([]);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [memoryResponse, sourceResponse] = await Promise.all([
        fetch('/api/shift/memory/account', { cache: 'no-store' }),
        fetch('/api/shift/source/manage', { cache: 'no-store' }),
      ]);
      if (!memoryResponse.ok || !sourceResponse.ok) throw new Error('Account memory is not available on this deployment yet.');
      const memoryData = await memoryResponse.json() as { signedIn?: boolean; memories?: AccountMemory[] };
      const sourceData = await sourceResponse.json() as { signedIn?: boolean; sources?: AccountSource[] };
      const accountSignedIn = Boolean(memoryData.signedIn || sourceData.signedIn);
      setSignedIn(accountSignedIn);
      setMemories(Array.isArray(memoryData.memories) ? memoryData.memories : []);
      setSources(Array.isArray(sourceData.sources) ? sourceData.sources : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load account memory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const archiveMemory = async (memory: AccountMemory) => {
    if (!window.confirm(`Remove “${memory.label}” from future SHIFT memory?`)) return;
    setBusyId(memory.id);
    try {
      const response = await fetch('/api/shift/memory/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId: memory.id }),
      });
      if (!response.ok) throw new Error('Could not remove this memory.');
      setMemories((current) => current.filter((item) => item.id !== memory.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not remove this memory.');
    } finally {
      setBusyId(null);
    }
  };

  const deleteSource = async (source: AccountSource, deleteLearning: boolean) => {
    const warning = deleteLearning
      ? `Delete “${source.originalName}” and the compact learning extracted from it?`
      : `Delete the private source file “${source.originalName}”? Its already-extracted compact learning will remain.`;
    if (!window.confirm(warning)) return;
    setBusyId(source.id);
    try {
      const response = await fetch('/api/shift/source/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: source.id, deleteLearning }),
      });
      if (!response.ok) throw new Error('Could not delete this private source.');
      setSources((current) => current.filter((item) => item.id !== source.id));
      if (deleteLearning) await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete this private source.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/75 p-5 sm:p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-sky-300">What SHIFT can carry forward</p>
          <h2 className="text-xl font-bold text-slate-100 mt-1">Account learning memory</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-3xl leading-relaxed">
            These are compact learning records used to personalize future reflections. You can remove any record without deleting your entire account or journal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Refresh account memory"
          className="w-9 h-9 rounded-xl border border-slate-700 text-slate-400 hover:text-sky-300 hover:border-sky-500/40 flex items-center justify-center shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      {error && <p className="mt-4 text-xs text-rose-300 rounded-xl border border-rose-500/20 bg-rose-950/20 p-3">{error}</p>}

      {!loading && signedIn === false && (
        <div className="mt-5 rounded-2xl border border-sky-500/25 bg-sky-950/20 p-4">
          <p className="text-sm text-slate-200 font-semibold">Sign in to carry learning across devices.</p>
          <p className="text-xs text-slate-400 mt-1">SHIFT can still use device-local memory without an account.</p>
          <a href="/signin-with-chatgpt?return_to=/" className="inline-block mt-3 text-xs font-semibold text-sky-300 hover:text-sky-200 underline underline-offset-4">
            Sign in with ChatGPT
          </a>
        </div>
      )}

      {!loading && signedIn && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-sky-300" />
              <h3 className="text-sm font-bold text-slate-200">Reusable learning</h3>
              <span className="text-[10px] text-slate-500">{memories.length}</span>
            </div>
            <div className="space-y-2.5 max-h-[30rem] overflow-y-auto pr-1">
              {memories.length === 0 && <p className="text-xs text-slate-500 py-4">No account-backed learning yet. Save a reflection or import previous context.</p>}
              {memories.map((memory) => (
                <article key={memory.id} className="rounded-2xl border border-slate-800 bg-slate-950/55 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-sky-300">{memory.type.replaceAll('_', ' ')}</span>
                        <span className="text-[9px] text-slate-600">• {memory.confidence.replaceAll('_', ' ')}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200 mt-1">{memory.label}</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{memory.summary}</p>
                      {memory.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {memory.tags.slice(0, 5).map((tag) => <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-900 text-[9px] text-slate-500">{tag}</span>)}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void archiveMemory(memory)}
                      disabled={busyId === memory.id}
                      aria-label={`Remove ${memory.label} from memory`}
                      className="w-8 h-8 rounded-lg border border-slate-800 text-slate-600 hover:text-rose-300 hover:border-rose-500/30 flex items-center justify-center shrink-0"
                    >
                      {busyId === memory.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileLock2 className="w-4 h-4 text-sky-300" />
              <h3 className="text-sm font-bold text-slate-200">Private imported sources</h3>
              <span className="text-[10px] text-slate-500">{sources.length}</span>
            </div>
            <div className="space-y-2.5">
              {sources.length === 0 && <p className="text-xs text-slate-500 py-4">No private source files are attached to this account.</p>}
              {sources.map((source) => (
                <article key={source.id} className="rounded-2xl border border-slate-800 bg-slate-950/55 p-3.5">
                  <p className="text-sm font-semibold text-slate-200 break-all">{source.originalName}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-500">
                    <span>{Math.max(1, Math.round(source.byteSize / 1024))} KB</span>
                    <span>{source.extractionStatus}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      disabled={busyId === source.id}
                      onClick={() => void deleteSource(source, false)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-700 text-[10px] text-slate-400 hover:border-rose-500/30 hover:text-rose-300"
                    >
                      Delete source only
                    </button>
                    <button
                      type="button"
                      disabled={busyId === source.id}
                      onClick={() => void deleteSource(source, true)}
                      className="px-2.5 py-1.5 rounded-lg border border-rose-500/20 text-[10px] text-rose-300 hover:bg-rose-950/30"
                    >
                      Delete source + learning
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
