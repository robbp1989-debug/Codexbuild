'use client';

import React from 'react';
import { ArrowRight, FlaskConical, Gamepad2, MessageCircle, NotebookPen } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BreakdownNextStepBar: React.FC = () => {
  const { activeShift, setActiveTab, playSoftSound } = useApp();
  if (!activeShift) return null;

  const go = (tab: string) => {
    playSoftSound('tap');
    setActiveTab(tab);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  return (
    <section className="mx-auto max-w-5xl px-4 pb-9" aria-label="Choose what would help next">
      <div className="rounded-[26px] border border-sky-200/80 bg-white/78 p-4 shadow-[0_18px_52px_rgba(35,67,91,0.10)] backdrop-blur-xl sm:p-5">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600">You choose the next move</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">What would help right now?</h2>
          <p className="mt-1 text-xs text-slate-600">Stay with it, practice it, test it in real life, or carry it into therapy.</p>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => go('conversation')}
            className="group rounded-2xl border border-sky-300 bg-sky-100/90 p-4 text-left transition hover:bg-sky-100"
          >
            <MessageCircle className="mb-3 h-5 w-5 text-sky-700" aria-hidden="true" />
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-900">Keep talking</span>
              <ArrowRight className="h-4 w-4 text-sky-700 transition group-hover:translate-x-0.5" aria-hidden="true" />
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">Stay with the feeling or meaning before solving it.</p>
          </button>

          <button
            type="button"
            onClick={() => go('scenario-game')}
            className="rounded-2xl border border-slate-200 bg-white/85 p-4 text-left transition hover:border-sky-200 hover:bg-sky-50/70"
          >
            <Gamepad2 className="mb-3 h-5 w-5 text-sky-600" aria-hidden="true" />
            <span className="block text-sm font-bold text-slate-900">Practice this</span>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">Turn what fits into a short skill exercise.</p>
          </button>

          <button
            type="button"
            onClick={() => go('prediction-lab')}
            className="rounded-2xl border border-slate-200 bg-white/85 p-4 text-left transition hover:border-sky-200 hover:bg-sky-50/70"
          >
            <FlaskConical className="mb-3 h-5 w-5 text-sky-600" aria-hidden="true" />
            <span className="block text-sm font-bold text-slate-900">Test a prediction</span>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">Compare what your mind predicts with what actually happens.</p>
          </button>

          <button
            type="button"
            onClick={() => go('therapy-prep')}
            className="rounded-2xl border border-slate-200 bg-white/85 p-4 text-left transition hover:border-sky-200 hover:bg-sky-50/70"
          >
            <NotebookPen className="mb-3 h-5 w-5 text-sky-600" aria-hidden="true" />
            <span className="block text-sm font-bold text-slate-900">Save for therapy</span>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">Carry the useful observations and questions forward.</p>
          </button>
        </div>
      </div>
    </section>
  );
};
