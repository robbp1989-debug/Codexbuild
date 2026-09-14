import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  CONTINUITY_STORAGE_KEY,
  type StoredContinuityArtifact,
} from '../../../lib/continuity-artifact';

export const TherapyPrepScreen: React.FC = () => {
  const { shifts, predictions, playSoftSound } = useApp();
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>(
    shifts.slice(0, 3).map((s) => s.id)
  );
  const [copied, setCopied] = useState(false);
  const [continuity, setContinuity] = useState<StoredContinuityArtifact | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(CONTINUITY_STORAGE_KEY) || '[]') as StoredContinuityArtifact[];
      setContinuity(Array.isArray(stored) && stored.length ? stored[0] : null);
    } catch {
      setContinuity(null);
    }
  }, []);

  const toggleSelect = (id: string) => {
    playSoftSound('tap');
    if (selectedShiftIds.includes(id)) {
      setSelectedShiftIds((prev) => prev.filter((s) => s !== id));
    } else {
      setSelectedShiftIds((prev) => [...prev, id]);
    }
  };

  const selectedShifts = shifts.filter((s) => selectedShiftIds.includes(s.id));

  const generateContinuityText = (saved: StoredContinuityArtifact) => {
    const artifact = saved.artifact;
    return [
      '=== SHIFT: NEXT-SESSION CONTINUITY NOTE ===',
      `Generated: ${new Date(saved.createdAt).toLocaleDateString()}`,
      '',
      'WHAT HAPPENED',
      artifact.whatHappened,
      '',
      'WHAT I NOTICED',
      artifact.whatINoticed,
      '',
      'WHAT SHIFT HELPED ME SEE',
      artifact.whatShiftHelpedMeSee,
      '',
      'POSSIBLE PATTERN',
      artifact.possiblePattern,
      '',
      'PAST LESSON THIS CONNECTS TO',
      artifact.pastLessonThisConnectsTo,
      '',
      'WHAT I TRIED',
      artifact.whatITried,
      '',
      'WHAT HAPPENED (RESULT)',
      artifact.whatHappenedResult,
      '',
      "WHAT I STILL DON'T KNOW",
      artifact.whatIStillDontKnow,
      '',
      'WHAT I WANT TO WORK ON NEXT',
      ...artifact.whatIWantToWorkOnNext.slice(0, 3).map((question, index) => `${index + 1}. ${question}`),
    ].join('\n');
  };

  const generateFallbackPrepText = () => {
    const lines: string[] = [];
    lines.push('=== SHIFT: THERAPY & COUNSELING PREP NOTE ===');
    lines.push(`Generated: ${new Date().toLocaleDateString()}`);
    lines.push('\nWHAT HAPPENED');
    selectedShifts.forEach((s, idx) => {
      lines.push(`${idx + 1}. ${s.observation}`);
    });

    lines.push('\nWHAT I NOTICED');
    selectedShifts.forEach((s) => {
      lines.push(`- Emotions: ${s.confirmed_emotions.join(', ') || 'not confirmed yet'}`);
      if ((s.urgesOrReactions || []).length) lines.push(`  Urges/reactions: ${(s.urgesOrReactions || []).join(', ')}`);
    });

    lines.push('\nWHAT SHIFT HELPED ME SEE');
    selectedShifts.forEach((s) => {
      lines.push(`- Interpretation: ${s.interpretation}`);
      lines.push(`- Updated view: ${s.updated_perspective}`);
    });

    lines.push('\nPOSSIBLE PATTERN');
    selectedShifts.forEach((s) => {
      const prefix = s.hypothesisUserStatus === 'accepted'
        ? 'User-confirmed working pattern'
        : s.hypothesisUserStatus === 'rejected'
          ? 'Rejected explanation'
          : 'Working hypothesis only';
      lines.push(`- ${prefix}: ${s.protective_rule_hypothesis}`);
    });

    lines.push('\nPAST LESSON THIS CONNECTS TO');
    lines.push('- No prior lesson was explicitly selected for this fallback note.');

    lines.push('\nWHAT I TRIED');
    selectedShifts.forEach((s) => lines.push(`- ${s.real_world_experiment || s.choice || 'No experiment recorded yet.'}`));

    lines.push('\nWHAT HAPPENED (RESULT)');
    predictions.slice(0, 3).forEach((p) => {
      lines.push(`- Prediction: ${p.predictedOutcome}`);
      lines.push(`  Result: ${p.whatActuallyHappened || 'Pending'}`);
      if (p.learningNote) lines.push(`  Learning: ${p.learningNote}`);
    });
    if (!predictions.length) lines.push('- No experiment outcome recorded yet.');

    lines.push("\nWHAT I STILL DON'T KNOW");
    lines.push('- Which working explanations will hold up across repeated real-life evidence.');

    lines.push('\nWHAT I WANT TO WORK ON NEXT');
    lines.push('1. What fits or does not fit about the working hypothesis?');
    lines.push('2. What emotion, need, preference, or boundary should I notice earlier next time?');
    lines.push('3. What small experiment would give us useful evidence before the next session?');

    return lines.join('\n');
  };

  const generatePrepText = () => continuity
    ? generateContinuityText(continuity)
    : generateFallbackPrepText();

  const handleCopy = () => {
    playSoftSound('complete');
    navigator.clipboard.writeText(generatePrepText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    playSoftSound('tap');
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-500/30 text-indigo-400 text-xs font-mono mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>PROFESSIONAL CONTINUITY</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Therapy & Counseling Prep
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Turn between-session observations into a concise first-person briefing you can bring to a therapist, counselor, psychiatrist, sponsor, or other professional support.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs cursor-pointer transition-all shadow-md"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Prep Note'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-0.5">
          <span className="font-semibold text-slate-200 block">User-controlled continuity note</span>
          <p>
            SHIFT keeps working hypotheses labeled as hypotheses and does not treat this note as a diagnosis or medical record. A Keep Talking note is created only when you choose Save for therapy.
          </p>
        </div>
      </div>

      {continuity ? (
        <div className="p-4 rounded-2xl border border-teal-500/30 bg-teal-950/20 text-sm text-slate-300">
          <strong className="text-teal-300">Using your latest saved Keep Talking handoff.</strong>{' '}
          It preserves the event, your internal experience, fact-versus-interpretation distinction, working pattern, prior lesson, experiment, outcome, uncertainty, and next-session questions.
        </div>
      ) : (
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase text-slate-400 tracking-wider block">
            Select Reflections to Include ({selectedShiftIds.length} of {shifts.length} selected):
          </span>

          <div className="space-y-2">
            {shifts.map((s) => {
              const isSelected = selectedShiftIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleSelect(s.id)}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-teal-500/40 text-slate-200'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-teal-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-300">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-teal-400 font-mono text-[11px]">{s.confirmed_emotions.join(', ')}</span>
                    </div>
                    <p className="text-slate-400 line-clamp-1">"{s.observation}"</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <span className="text-xs font-mono uppercase text-slate-400 tracking-wider block">
          Generated Session Briefing:
        </span>
        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-6 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed space-y-4 select-all shadow-inner">
          {generatePrepText()}
        </div>
      </div>
    </div>
  );
};
