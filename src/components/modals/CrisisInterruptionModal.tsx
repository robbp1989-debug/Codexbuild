import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, Phone, LifeBuoy, ExternalLink, ShieldAlert } from 'lucide-react';

export const CrisisInterruptionModal: React.FC = () => {
  const { distressInterrupted, setDistressInterrupted, setActiveTab, playSoftSound } = useApp();
  const [region, setRegion] = useState<'US' | 'CA' | 'UK' | 'AU' | 'INTL'>('US');

  if (!distressInterrupted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-lg p-4 transition-all">
      <div
        id="crisis-interruption-panel"
        className="w-full max-w-2xl bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-amber-400 font-bold">
              Emergency Support Notice
            </span>
            <h2 className="text-xl font-bold text-white">
              We care about your safety right now
            </h2>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/60 mb-6 text-sm text-amber-200/90 leading-relaxed">
          <p className="mb-2">
            <strong>SHIFT is an educational self-reflection tool, not a crisis service or medical substitute.</strong>
          </p>
          <p>
            When distress is overwhelming or thoughts of self-harm or immediate crisis arise, reflective exercises should pause. You deserve live, compassionate, confidential support from trained individuals who can stay with you right now.
          </p>
        </div>

        {/* Region Selector */}
        <div className="mb-4">
          <label className="text-xs font-mono text-slate-400 block mb-2">
            Select your region for immediate helpline access:
          </label>
          <div className="flex flex-wrap gap-2">
            {(['US', 'CA', 'UK', 'AU', 'INTL'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  playSoftSound('tap');
                  setRegion(r);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  region === r
                    ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === 'US' && 'United States'}
                {r === 'CA' && 'Canada'}
                {r === 'UK' && 'United Kingdom'}
                {r === 'AU' && 'Australia'}
                {r === 'INTL' && 'International / Other'}
              </button>
            ))}
          </div>
        </div>

        {/* Region Helpline Details */}
        <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 mb-6 space-y-4">
          {region === 'US' && (
            <>
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="font-semibold text-white text-base">988 Suicide & Crisis Lifeline</div>
                  <div className="text-xs text-slate-400">Free, confidential 24/7 support via call or text.</div>
                </div>
                <a
                  href="tel:988"
                  className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> Call or Text 988
                </a>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white text-base">Crisis Text Line</div>
                  <div className="text-xs text-slate-400">Text HOME to 741741 for 24/7 free text support.</div>
                </div>
                <a
                  href="sms:741741?&body=HOME"
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  Text 741741
                </a>
              </div>
            </>
          )}

          {region === 'CA' && (
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-white text-base">Canada Suicide Prevention Service</div>
                <div className="text-xs text-slate-400">Call or text 988 anywhere in Canada (24/7, toll-free, bilingual).</div>
              </div>
              <a
                href="tel:988"
                className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Call / Text 988
              </a>
            </div>
          )}

          {region === 'UK' && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="font-semibold text-white text-base">Samaritans UK</div>
                  <div className="text-xs text-slate-400">Call 116 123 free, any time, from any phone.</div>
                </div>
                <a
                  href="tel:116123"
                  className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> Call 116 123
                </a>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white text-base">NHS Mental Health Services</div>
                  <div className="text-xs text-slate-400">Call 111 for non-emergency clinical guidance.</div>
                </div>
                <a
                  href="tel:111"
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
                >
                  Call 111
                </a>
              </div>
            </div>
          )}

          {region === 'AU' && (
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-white text-base">Lifeline Australia</div>
                <div className="text-xs text-slate-400">Call 13 11 14 (24/7 crisis support and suicide prevention).</div>
              </div>
              <a
                href="tel:131114"
                className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Call 13 11 14
              </a>
            </div>
          )}

          {region === 'INTL' && (
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-white text-base">Befrienders Worldwide / Find A Helpline</div>
                <div className="text-xs text-slate-400">Free, confidential support across 130+ countries worldwide.</div>
              </div>
              <a
                href="https://findahelpline.com"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> findahelpline.com
              </a>
            </div>
          )}
        </div>

        {/* Action Options */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => {
              playSoftSound('tap');
              setDistressInterrupted(false);
              setActiveTab('safety');
            }}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Review all Safety & Grounding resources
          </button>
          <button
            onClick={() => {
              playSoftSound('tap');
              setDistressInterrupted(false);
              setActiveTab('home');
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            I Am Safe / Return to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
