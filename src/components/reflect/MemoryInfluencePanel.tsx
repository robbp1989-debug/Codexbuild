'use client';

import React from 'react';
import { BookOpenCheck, Brain, History, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

function readableMemory(memory: string): { kind: string; body: string; meta: string } {
  const match = memory.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (!match) return { kind: 'Earlier learning', body: memory, meta: '' };
  const [kindRaw, ...metaParts] = match[1].split(';').map((part) => part.trim());
  return {
    kind: kindRaw.replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (character) => character.toUpperCase()),
    body: match[2],
    meta: metaParts.join(' • ').replaceAll('=', ': '),
  };
}

function sourceLabel(source: string): string {
  switch (source) {
    case 'therapist': return 'Therapist';
    case 'counselor': return 'Counselor';
    case 'recovery_support': return 'Recovery support';
    case 'medical_professional': return 'Medical professional';
    case 'user_insight': return 'Personal insight';
    case 'shift_working_hypothesis': return 'SHIFT working hypothesis';
    default: return 'Professional learning';
  }
}

export const MemoryInfluencePanel: React.FC = () => {
  const { activeShift, setActiveTab, playSoftSound } = useApp();
  const memoryUsed = activeShift?.memoryUsed || [];
  const professionalLearningUsed = activeShift?.professionalLearningUsed || [];

  if (!activeShift || (memoryUsed.length === 0 && professionalLearningUsed.length === 0)) return null;

  return (
    <section className="max-w-4xl mx-auto mt-6 mb-2 px-4">
      <div className="rounded-2xl border border-sky-500/25 bg-sky-950/15 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/25 text-sky-300 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-sky-300">Response provenance</p>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 mt-1">What prior learning was considered</h2>
              <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                This shows compact provenance, not hidden reasoning or chain-of-thought. Earlier learning is comparison context only; your current report still comes first.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playSoftSound('tap');
              setActiveTab('memory');
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-[11px] font-semibold text-slate-300 hover:text-sky-300 hover:border-sky-500/40 shrink-0"
          >
            <History className="w-3.5 h-3.5" /> Review memory
          </button>
        </div>

        {professionalLearningUsed.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpenCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300">Professional learning considered</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {professionalLearningUsed.slice(0, 4).map((lesson) => (
                <article key={lesson.id} className="rounded-xl border border-indigo-500/20 bg-indigo-950/15 p-3">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-indigo-300">{sourceLabel(lesson.sourceType)}</span>
                  <p className="text-[11px] sm:text-xs text-slate-300 mt-1.5 leading-relaxed">{lesson.title}</p>
                </article>
              ))}
            </div>
          </div>
        )}

        {memoryUsed.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-3.5 h-3.5 text-sky-300" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-300">Historical learning considered</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {memoryUsed.slice(0, 6).map((memory, index) => {
                const item = readableMemory(memory);
                return (
                  <article key={`${memory}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-sky-300">{item.kind}</span>
                      {item.meta && <span className="text-[9px] text-slate-600">{item.meta}</span>}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-300 mt-1.5 leading-relaxed">{item.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-3 flex items-start gap-2 text-[10px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
          <span>
            Historical source: {activeShift.memorySource === 'account' ? 'signed-in account learning plus relevant device learning' : 'device learning or no durable account match'}.
            {activeShift.memoryRetrieval === 'semantic_and_lexical' ? ' Retrieval used semantic and lexical relevance.' : ' Retrieval used lexical relevance.'}
            {' '}Raw imported documents are not inserted into this reflection.
          </span>
        </div>
      </div>
    </section>
  );
};
