import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Lock, HeartHandshake, RefreshCw, Download } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab, playSoftSound, exportDataJSON } = useApp();

  const handleExport = () => {
    playSoftSound('tap');
    const json = exportDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shift-reflections-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 text-slate-400 text-xs py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sequence Banner */}
        <div className="mb-8 p-4 rounded-xl bg-slate-900/60 border border-slate-800/70">
          <div className="text-[11px] font-mono uppercase tracking-wider text-teal-400 mb-2 font-semibold">
            Core Sequence Order (Non-Negotiable Grounding)
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300 font-mono">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">1. Observe</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">2. Name</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">3. Need / Boundary</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-teal-500/20">4. Interpret</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">5. Rule</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">6. Predict</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">7. Outcome</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/20">8. Update</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Interpretations about other people are intentionally held until personal observations, emotions, and boundaries are grounded.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 text-slate-200 font-semibold mb-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Non-Clinical Educational Scope</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              SHIFT is an educational self-reflection console and behavioral skills-practice arcade. It is not a diagnostic, crisis, or medical-treatment product, and is never a substitute for a licensed psychotherapist, psychiatrist, or emergency services.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-200 font-semibold mb-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>Data Sovereignty & Privacy</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Your reflections, predictions, rules, and outcomes are saved directly on your local device. We do not sell your personal reflections or train advertising models on your data. You maintain complete control to export or erase records anytime.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-200 font-semibold mb-2">
              <HeartHandshake className="w-4 h-4 text-amber-400" />
              <span>Immediate Support & Tools</span>
            </div>
            <div className="flex flex-col gap-2 text-[11px]">
              <button
                onClick={() => {
                  playSoftSound('tap');
                  setActiveTab('safety');
                }}
                className="text-left text-slate-300 hover:text-teal-300 underline"
              >
                View 24/7 Crisis Helplines & Grounding Mode
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 text-slate-300 hover:text-indigo-300 text-left"
              >
                <Download className="w-3.5 h-3.5" /> Export My Reflection Records (.JSON)
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
          <div>
            SHIFT: Reflection Arcade — Notice the pattern. Test the prediction. Choose the next move.
          </div>
          <div className="font-mono text-slate-400">
            Psychologically Informed Architecture
          </div>
        </div>
      </div>
    </footer>
  );
};
