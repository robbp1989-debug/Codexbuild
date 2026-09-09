import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  Phone,
  MessageSquare,
  Globe,
  Lock,
  Trash2,
  CheckCircle2,
  HeartHandshake,
  Wind,
  Info,
} from 'lucide-react';

export const SafetyPage: React.FC = () => {
  const { setGroundingModalOpen, clearAllData, playSoftSound } = useApp();
  const [dataWiped, setDataWiped] = useState(false);

  const handleWipe = () => {
    if (
      window.confirm(
        'Are you sure you want to delete all local reflections, rules, and arcade logs? This cannot be undone.'
      )
    ) {
      clearAllData();
      setDataWiped(true);
      playSoftSound('tap');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 space-y-10">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400 font-semibold">
          <ShieldAlert className="w-4 h-4" />
          <span>Safety, Disclaimers & Crisis Support</span>
        </div>
        <h1 className="text-3xl font-bold text-white">
          Educational Purpose & Immediate Resources
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          SHIFT is designed as an educational self-reflection and cognitive skills practice tool. It is not a diagnostic instrument, medical treatment, or emergency service.
        </p>
      </div>

      {/* Immediate Crisis Contacts */}
      <div className="p-6 sm:p-8 rounded-3xl bg-amber-950/20 border border-amber-900/40 space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block">
            Emergency & Crisis Hotlines (Confidential, 24/7, Free)
          </span>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            If you or someone you know is in immediate crisis, experiencing thoughts of self-harm, or in acute danger, please connect directly with trained human professionals right now:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-900/50 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Phone className="w-4 h-4 text-amber-400" />
              <span>988 Suicide & Crisis Lifeline</span>
            </div>
            <p className="text-xs text-slate-300">
              Free, confidential crisis counseling via call or text in the US and Canada.
            </p>
            <div className="text-xs font-mono text-teal-400 font-bold">
              Call or Text: 988
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-900/50 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Crisis Text Line</span>
            </div>
            <p className="text-xs text-slate-300">
              24/7 free text support across the US, UK, and Canada.
            </p>
            <div className="text-xs font-mono text-teal-400 font-bold">
              Text HOME to 741741
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-900/50 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <HeartHandshake className="w-4 h-4 text-amber-400" />
              <span>The Trevor Project</span>
            </div>
            <p className="text-xs text-slate-300">
              24/7 crisis intervention and suicide prevention for LGBTQ young people.
            </p>
            <div className="text-xs font-mono text-teal-400 font-bold">
              Call 1-866-488-7386 or Text START to 678-678
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-900/50 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Globe className="w-4 h-4 text-amber-400" />
              <span>International Resources</span>
            </div>
            <p className="text-xs text-slate-300">
              Find free, confidential helplines worldwide by country.
            </p>
            <a
              href="https://findahelpline.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-teal-400 font-bold underline block"
            >
              Visit FindAHelpline.com →
            </a>
          </div>
        </div>
      </div>

      {/* Immediate Sensory Grounding Button */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Wind className="w-4 h-4 text-teal-400" />
            <span>Need Immediate Sensory Grounding?</span>
          </h3>
          <p className="text-xs text-slate-400 max-w-md">
            If reflection begins to trigger emotional flooding, step away from cognitive work and use the sensory 5-4-3-2-1 technique or diaphragmatic box breathing.
          </p>
        </div>
        <button
          onClick={() => {
            playSoftSound('ground');
            setGroundingModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shrink-0 transition-colors shadow-lg shadow-teal-500/20"
        >
          Open Grounding Exercise
        </button>
      </div>

      {/* Data Privacy & Local Storage */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-teal-400 font-semibold">
          <Lock className="w-4 h-4" />
          <span>Local Data Privacy Guarantee</span>
        </div>
        <h3 className="text-lg font-bold text-white">
          Your reflections belong entirely to you.
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          SHIFT operates client-side inside your browser sandbox. All recorded reflections, emotional logs, custom rules, and practice drill histories are stored strictly in your browser’s <code className="text-teal-300 font-mono">localStorage</code>. We do not transmit your deeply personal writings to external cloud databases, advertisement networks, or diagnostic LLMs.
        </p>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={handleWipe}
            className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Wipe All Local Reflection Data</span>
          </button>
          {dataWiped && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              All local storage cleared
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
