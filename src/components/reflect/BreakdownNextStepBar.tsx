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
    <section className="max-w-4xl mx-auto px-4 pb-8" aria-label="Choose what would help next">
      <div className="rounded-3xl border border-sky-500/25 bg-gradient-to-br from-sky-950/35 via-slate-900 to-slate-950 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-sky-300">You choose the next move</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">What would help right now?</h2>
            <p className="text-xs text-slate-400 mt-1">A breakdown does not have to turn into a game. Stay with it, practice it, test it, or save it for therapy.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => go('conversation')}
            className="group text-left rounded-2xl border border-sky-400/40 bg-sky-500/10 hover:bg-sky-500/18 p-4 transition-all"
          >
            <MessageCircle className="w-5 h-5 text-sky-300 mb-3" />
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-100">Keep talking</span>
              <ArrowRight className="w-4 h-4 text-sky-300 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Stay with the feeling or meaning before solving it.</p>
          </button>

          <button type="button" onClick={() => go('scenario-game')} className="text-left rounded-2xl border border-slate-700 bg-slate-900 hover:border-sky-500/45 p-4 transition-all">
            <Gamepad2 className="w-5 h-5 text-sky-300 mb-3" />
            <span className="text-sm font-bold text-slate-100 block">Practice this</span>
            <p className="text-[11px] text-slate-400 mt-1">Turn the confirmed breakdown into a skill exercise.</p>
          </button>

          <button type="button" onClick={() => go('prediction-lab')} className="text-left rounded-2xl border border-slate-700 bg-slate-900 hover:border-sky-500/45 p-4 transition-all">
            <FlaskConical className="w-5 h-5 text-sky-300 mb-3" />
            <span className="text-sm font-bold text-slate-100 block">Test a prediction</span>
            <p className="text-[11px] text-slate-400 mt-1">Compare what the old system predicts with what happens.</p>
          </button>

          <button type="button" onClick={() => go('therapy-prep')} className="text-left rounded-2xl border border-slate-700 bg-slate-900 hover:border-sky-500/45 p-4 transition-all">
            <NotebookPen className="w-5 h-5 text-sky-300 mb-3" />
            <span className="text-sm font-bold text-slate-100 block">Save for therapy</span>
            <p className="text-[11px] text-slate-400 mt-1">Carry the useful observations and questions forward.</p>
          </button>
        </div>
      </div>
    </section>
  );
};
