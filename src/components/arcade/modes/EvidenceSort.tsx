import { usePracticeContent } from '../../../context/usePracticeContent';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Scale, CheckCircle2, RotateCcw, ArrowRight, HelpCircle } from 'lucide-react';

interface EvidenceItem {
  id: string;
  statement: string;
  sourceContext: string;
  defaultCol: 'supports' | 'challenges' | 'uncertain';
}

export const EvidenceSortMode: React.FC<{ onCompleteSession?: () => void }> = ({
  onCompleteSession,
}) => {
  const { playSoftSound, logPracticeSession } = useApp();
  const EVIDENCE_DECK = usePracticeContent().evidence;
  const [items, setItems] = useState<{ [key: string]: 'supports' | 'challenges' | 'uncertain' | 'unassigned' }>(
    () => {
      const initial: { [key: string]: 'supports' | 'challenges' | 'uncertain' | 'unassigned' } = {};
      EVIDENCE_DECK.forEach((item) => {
        initial[item.id] = 'unassigned';
      });
      return initial;
    }
  );

  const assignItem = (id: string, col: 'supports' | 'challenges' | 'uncertain') => {
    playSoftSound('tap');
    setItems((prev) => ({ ...prev, [id]: col }));
  };

  const unassignedList = EVIDENCE_DECK.filter((item) => items[item.id] === 'unassigned');
  const supportsList = EVIDENCE_DECK.filter((item) => items[item.id] === 'supports');
  const challengesList = EVIDENCE_DECK.filter((item) => items[item.id] === 'challenges');
  const uncertainList = EVIDENCE_DECK.filter((item) => items[item.id] === 'uncertain');

  const allAssigned = unassignedList.length === 0;

  const handleFinish = () => {
    playSoftSound('complete');
    logPracticeSession({
      mode: 'evidence_sort',
      durationSeconds: 120,
      itemsAttempted: EVIDENCE_DECK.length,
      userRating: 'easy',
    });
    if (onCompleteSession) onCompleteSession();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="text-teal-400 font-semibold uppercase tracking-wider">
          Mode 6: Evidence Sort (Balancing Real Reality)
        </span>
        <span>
          {EVIDENCE_DECK.length - unassignedList.length} of {EVIDENCE_DECK.length} sorted
        </span>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase font-bold">
          <Scale className="w-4 h-4 text-amber-400" />
          <span>Underlying Rule: "If I speak up or say no, I am in grave danger."</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Sort each piece of evidence into its honest category. Notice that a healthy perspective does NOT force 100% positive outcomes—it holds space for complexity, history, and genuine uncertainty.
        </p>
      </div>

      {/* Unassigned items to drag/click */}
      {unassignedList.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <span className="text-xs font-mono text-slate-400 font-semibold block">
            Items to Sort:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {unassignedList.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
              >
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  "{item.statement}"
                </p>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-500 font-mono text-[10px]">
                    {item.sourceContext}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => assignItem(item.id, 'supports')}
                      className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60"
                      title="Supports the old rule"
                    >
                      Supports Old
                    </button>
                    <button
                      onClick={() => assignItem(item.id, 'challenges')}
                      className="px-2 py-1 rounded bg-teal-950/60 hover:bg-teal-900/80 text-teal-300 border border-teal-800/60"
                      title="Challenges the old rule"
                    >
                      Challenges Old
                    </button>
                    <button
                      onClick={() => assignItem(item.id, 'uncertain')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      title="More information needed"
                    >
                      Uncertain
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3 Columns Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Supports */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
              Supports Old Rule ({supportsList.length})
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Validates why your survival strategy made sense in the past.
          </p>
          <div className="space-y-2 min-h-[140px]">
            {supportsList.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950/90 border border-amber-900/60 text-xs text-slate-200"
              >
                <p className="leading-relaxed">{item.statement}</p>
                <button
                  onClick={() =>
                    setItems((prev) => ({ ...prev, [item.id]: 'unassigned' }))
                  }
                  className="text-[10px] text-slate-500 hover:text-slate-300 underline mt-1 block"
                >
                  Move back
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Challenges */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-teal-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-bold">
              Challenges Old Rule ({challengesList.length})
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Present-day counterexamples that show alternative outcomes are possible.
          </p>
          <div className="space-y-2 min-h-[140px]">
            {challengesList.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950/90 border border-teal-800/60 text-xs text-slate-200"
              >
                <p className="leading-relaxed">{item.statement}</p>
                <button
                  onClick={() =>
                    setItems((prev) => ({ ...prev, [item.id]: 'unassigned' }))
                  }
                  className="text-[10px] text-slate-500 hover:text-slate-300 underline mt-1 block"
                >
                  Move back
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Uncertain */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              More Info Needed ({uncertainList.length})
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Accepting ambiguity without rushing to catastrophic conclusions.
          </p>
          <div className="space-y-2 min-h-[140px]">
            {uncertainList.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-200"
              >
                <p className="leading-relaxed">{item.statement}</p>
                <button
                  onClick={() =>
                    setItems((prev) => ({ ...prev, [item.id]: 'unassigned' }))
                  }
                  className="text-[10px] text-slate-500 hover:text-slate-300 underline mt-1 block"
                >
                  Move back
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {allAssigned && (
        <div className="p-5 rounded-2xl bg-teal-950/30 border border-teal-800/50 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-teal-200 mb-1">
              Evidence Balanced Without Forcing
            </div>
            <p className="text-xs text-slate-300">
              Notice how the present-day picture is richer and more flexible than the old binary rule suggested.
            </p>
          </div>
          <button
            onClick={handleFinish}
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shrink-0 transition-colors"
          >
            Complete Session
          </button>
        </div>
      )}
    </div>
  );
};
