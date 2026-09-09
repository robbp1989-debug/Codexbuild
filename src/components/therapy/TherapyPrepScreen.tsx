import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  CheckSquare,
  Square,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const TherapyPrepScreen: React.FC = () => {
  const { shifts, predictions, playSoftSound } = useApp();
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>(
    shifts.slice(0, 3).map((s) => s.id)
  );
  const [copied, setCopied] = useState(false);

  const toggleSelect = (id: string) => {
    playSoftSound('tap');
    if (selectedShiftIds.includes(id)) {
      setSelectedShiftIds((prev) => prev.filter((s) => s !== id));
    } else {
      setSelectedShiftIds((prev) => [...prev, id]);
    }
  };

  const selectedShifts = shifts.filter((s) => selectedShiftIds.includes(s.id));

  // Generate the formatted therapy notes
  const generatePrepText = () => {
    const lines: string[] = [];
    lines.push('=== SHIFT: THERAPY & COUNSELING PREP NOTE ===');
    lines.push(`Generated: ${new Date().toLocaleDateString()}`);
    lines.push('\n[1. RECENT EVENTS & OBSERVED TRIGGERS]');
    selectedShifts.forEach((s, idx) => {
      lines.push(`${idx + 1}. Observed: "${s.observation}"`);
      lines.push(`   First-Person Reaction: ${s.felt_emotion} (Urge: ${s.first_person_reaction})`);
    });

    lines.push('\n[2. PREDOMINANT PROTECTIVE RULES & HYPOTHESES]');
    selectedShifts.forEach((s) => {
      lines.push(`- Protective Rule: "${s.protective_rule_hypothesis}"`);
    });

    lines.push('\n[3. UPDATED PERSPECTIVES & WORKING INSIGHTS]');
    selectedShifts.forEach((s) => {
      lines.push(`- Updated Model: "${s.updated_perspective}"`);
    });

    lines.push('\n[4. RECENT BEHAVIORAL EXPERIMENTS (PREDICTIONS VS OUTCOMES)]');
    predictions.slice(0, 3).forEach((p) => {
      lines.push(`- Context: ${p.cueContext}`);
      lines.push(`  Feared Prediction: "${p.predictedOutcome}"`);
      lines.push(`  Real Outcome: ${p.whatActuallyHappened || 'Pending experiment'}`);
      lines.push(`  Learning: ${p.learningNote || 'In progress'}`);
    });

    lines.push('\n[5. OPEN QUESTIONS TO EXPLORE WITH MY THERAPIST]');
    lines.push('- Where in my developmental history did this protective rule keep me safe?');
    lines.push('- What small boundary can I practice setting this week without over-explaining?');
    lines.push('- How can I tolerate the discomfort of another person’s temporary disappointment?');

    return lines.join('\n');
  };

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-500/30 text-indigo-400 text-xs font-mono mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>CLINICAL PARTNERSHIP</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Therapy & Counseling Prep
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Synthesize your reflections into an organized first-person briefing for your therapist, psychiatrist, or counselor.
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

      {/* Privacy Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-0.5">
          <span className="font-semibold text-slate-200 block">Strict Privacy Model</span>
          <p>
            Your reflections are stored client-side in your browser's local sandbox. No health summaries are sold or shared. This tool empowers you to lead your own clinical sessions with grounded data.
          </p>
        </div>
      </div>

      {/* Session Selection Checkboxes */}
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
                    <span className="text-teal-400 font-mono text-[11px]">{s.felt_emotion}</span>
                  </div>
                  <p className="text-slate-400 line-clamp-1">"{s.observation}"</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rendered Preview of Therapy Note */}
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
