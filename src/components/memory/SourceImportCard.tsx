'use client';

import React, { useRef, useState } from 'react';
import { CheckCircle2, FileLock2, Loader2, Upload, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

type ImportMemory = {
  type: string;
  label: string;
  summary: string;
  tags?: string[];
};

export const SourceImportCard: React.FC = () => {
  const { addMemoryItem, playSoftSound } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'account'>('idle');
  const [message, setMessage] = useState('');
  const [memories, setMemories] = useState<ImportMemory[]>([]);

  const importSource = async () => {
    if (!file || loading) return;
    setLoading(true);
    setStatus('idle');
    setMessage('');
    setMemories([]);
    playSoftSound('tap');

    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/shift/source/upload', { method: 'POST', body: form });
      const data = await response.json() as {
        error?: string;
        accountRequired?: boolean;
        extractionStatus?: string;
        memoriesExtracted?: number;
        sourceTruncatedForExtraction?: boolean;
        memories?: ImportMemory[];
      };

      if (response.status === 401 || data.accountRequired) {
        setStatus('account');
        setMessage('Sign in with ChatGPT to attach private sources to your SHIFT account.');
        return;
      }
      if (!response.ok && response.status !== 202) throw new Error(data.error || 'Import failed');

      if (data.extractionStatus === 'completed') {
        const extracted = Array.isArray(data.memories) ? data.memories : [];
        // Keep a compact device copy so the current session can use the new learning
        // immediately. The authoritative account copy is already stored in D1.
        extracted.forEach((memory) => {
          const tags = memory.tags?.length ? ` | tags: ${memory.tags.join(', ')}` : '';
          addMemoryItem(memory.type as any, `${memory.label}: ${memory.summary}${tags}`, 'active');
        });
        setMemories(extracted);
        setStatus('success');
        setMessage(
          `Imported once and reduced to ${data.memoriesExtracted || extracted.length} reusable learning ${
            (data.memoriesExtracted || extracted.length) === 1 ? 'memory' : 'memories'
          }.${data.sourceTruncatedForExtraction ? ' The source exceeded the first-pass extraction limit, so only its initial portion was analyzed.' : ''}`,
        );
        setFile(null);
        if (fileRef.current) fileRef.current.value = '';
        playSoftSound('complete');
      } else {
        setStatus('error');
        setMessage(data.error || 'The private file was stored, but learning extraction did not finish.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to import this source right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-sky-500/25 bg-gradient-to-br from-sky-950/25 via-slate-900 to-slate-950 p-5 sm:p-6 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/25 text-sky-300 flex items-center justify-center shrink-0">
          <FileLock2 className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-sky-300">Teach SHIFT once</p>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 mt-1">Import previous context without replaying the whole story</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed max-w-3xl">
            Import a text export, notes file, or prior conversation. SHIFT processes the source once, stores the private file separately, and reuses only compact learning themes, boundaries, tested outcomes, and perspectives in future reflections.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.markdown,.json,.csv,text/plain,text/markdown,text/csv,application/json"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setStatus('idle');
              setMessage('');
            }}
            className="block flex-1 min-w-0 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-200 hover:file:bg-slate-700"
          />
          <button
            type="button"
            onClick={() => void importSource()}
            disabled={!file || loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 text-xs font-bold shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {loading ? 'Extracting learning…' : 'Import privately'}
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">First import version: TXT, Markdown, JSON, or CSV up to 4 MB. PDF/DOCX parsing is intentionally not enabled until it has a reliable extraction path.</p>
      </div>

      {status !== 'idle' && (
        <div className={`mt-4 rounded-xl border p-3.5 ${status === 'success' ? 'border-emerald-500/30 bg-emerald-950/20' : status === 'account' ? 'border-sky-500/30 bg-sky-950/25' : 'border-rose-500/30 bg-rose-950/20'}`}>
          <div className="flex items-start gap-2.5">
            {status === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> : <XCircle className={`w-4 h-4 mt-0.5 shrink-0 ${status === 'account' ? 'text-sky-400' : 'text-rose-400'}`} />}
            <div className="min-w-0">
              <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
              {status === 'account' && (
                <a href="/signin-with-chatgpt?return_to=/" className="inline-block mt-2 text-xs font-semibold text-sky-300 hover:text-sky-200 underline underline-offset-4">
                  Sign in with ChatGPT
                </a>
              )}
              {memories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {memories.slice(0, 8).map((memory) => (
                    <span key={`${memory.type}-${memory.label}`} className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-900 text-[10px] text-slate-300">
                      {memory.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-600 mt-4">
        The source file itself is not inserted into normal reflection prompts. Future analysis receives only a small set of relevant compact learning records.
      </p>
    </section>
  );
};
