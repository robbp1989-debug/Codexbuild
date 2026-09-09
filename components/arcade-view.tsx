'use client';

import { useState, type CSSProperties } from 'react';
import { BrainCircuit, Check, ChevronRight, Layers3, RotateCcw, Target, TimerReset } from 'lucide-react';

import { type FrameworkId, type PracticeRecord, drills, frameworks, getFramework, savePracticeRecords } from '@/lib/shift';

type ArcadeMode = 'rapid' | 'match' | 'sequence';

interface ArcadeViewProps {
  records: PracticeRecord[];
  onRecordsChange: (records: PracticeRecord[]) => void;
}

const modes = [
  { id: 'rapid' as const, title: 'Rapid Recall', detail: 'Retrieve the move before the cue appears.', icon: TimerReset },
  { id: 'match' as const, title: 'Skill Match', detail: 'Identify which framework fits the moment.', icon: Target },
  { id: 'sequence' as const, title: 'Sequence Builder', detail: 'Rebuild the skill steps from memory.', icon: Layers3 },
];

export function ArcadeView({ records, onRecordsChange }: ArcadeViewProps) {
  const [mode, setMode] = useState<ArcadeMode>('rapid');
  const [round, setRound] = useState(0);
  const [response, setResponse] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<FrameworkId | null>(null);
  const [pickedSteps, setPickedSteps] = useState<string[]>([]);
  const drill = drills[(round * 5 + 2) % drills.length];
  const framework = getFramework(drill.framework);
  const mixedSteps = [...drill.steps].sort((a, b) => (a.length + round) % 3 - (b.length + round) % 3);
  const sequenceComplete = pickedSteps.length === drill.steps.length;
  const sequenceCorrect = sequenceComplete && pickedSteps.every((step, index) => step === drill.steps[index]);

  function nextRound() {
    setRound((value) => value + 1);
    setResponse('');
    setRevealed(false);
    setSelectedFramework(null);
    setPickedSteps([]);
  }

  function addRecord(input: Pick<PracticeRecord, 'response' | 'mode' | 'correct'>) {
    const record: PracticeRecord = {
      id: crypto.randomUUID(),
      drillId: drill.id,
      framework: drill.framework,
      title: drill.title,
      scenario: drill.scenario,
      response: input.response,
      takeaway: '',
      confidence: input.correct === false ? 2 : 4,
      difficulty: input.correct === false ? 'hard' : 'stretch',
      recalledBeforeReveal: true,
      completedAt: new Date().toISOString(),
      mode: input.mode,
      correct: input.correct,
    };
    const next = [record, ...records];
    onRecordsChange(next);
    savePracticeRecords(next);
    nextRound();
  }

  return (
    <section className="view-shell">
      <div className="view-hero compact">
        <div>
          <span className="eyebrow">Active retrieval arcade</span>
          <h1>Make the skill easier to find.</h1>
          <p>Short rounds repeat the mental moves—not trivia about therapy.</p>
        </div>
        <div className="round-counter"><BrainCircuit /><span>Round</span><b>{round + 1}</b></div>
      </div>

      <div className="mode-grid">
        {modes.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={mode === item.id ? 'mode-card active' : 'mode-card'} onClick={() => { setMode(item.id); nextRound(); }}>
              <Icon />
              <span><b>{item.title}</b><small>{item.detail}</small></span>
            </button>
          );
        })}
      </div>

      <article className="game-stage" style={{ '--skill': framework.color, '--skill-soft': framework.softColor } as CSSProperties}>
        <div className="game-stage-top">
          <span>Scenario {String(round + 1).padStart(2, '0')}</span>
          <i>{mode === 'match' && selectedFramework ? (selectedFramework === drill.framework ? 'Matched' : 'Keep learning') : 'Recall in progress'}</i>
        </div>
        <p className="game-scenario">{drill.scenario}</p>

        {mode === 'rapid' && (
          <div className="game-body">
            <h2>What skillful move would you make next?</h2>
            <textarea value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Retrieve first. The coaching cue stays hidden until you answer." rows={4} />
            {!revealed ? (
              <button className="primary-action" disabled={!response.trim()} onClick={() => setRevealed(true)}>Lock recall & reveal <ChevronRight /></button>
            ) : (
              <div className="game-feedback">
                <span style={{ color: framework.color }}>{framework.shortName} · {drill.title}</span>
                <p>{drill.modelResponse}</p>
                <button className="primary-action" onClick={() => addRecord({ response: response.trim(), mode: 'rapid-recall', correct: true })}>Save round & continue <ChevronRight /></button>
              </div>
            )}
          </div>
        )}

        {mode === 'match' && (
          <div className="game-body">
            <h2>Which lens best fits this prompt?</h2>
            <p className="game-prompt">{drill.prompt}</p>
            <div className="match-grid">
              {frameworks.map((item) => (
                <button key={item.id} className={selectedFramework === item.id ? 'match-choice selected' : 'match-choice'} style={{ '--choice': item.color } as CSSProperties} onClick={() => setSelectedFramework(item.id)}>
                  <b>{item.shortName}</b><span>{item.focus}</span>
                </button>
              ))}
            </div>
            {selectedFramework && (
              <div className={selectedFramework === drill.framework ? 'match-result correct' : 'match-result'}>
                {selectedFramework === drill.framework ? <Check /> : <RotateCcw />}
                <p><b>{selectedFramework === drill.framework ? 'Strong match.' : `This one trains ${framework.shortName}.`}</b> {framework.question}</p>
                <button className="primary-action" onClick={() => addRecord({ response: `Selected ${getFramework(selectedFramework).shortName}`, mode: 'skill-match', correct: selectedFramework === drill.framework })}>Record & next <ChevronRight /></button>
              </div>
            )}
          </div>
        )}

        {mode === 'sequence' && (
          <div className="game-body">
            <h2>Rebuild “{drill.title}” in the right order.</h2>
            <p className="game-prompt">Choose each step from first to last.</p>
            <div className="sequence-picked">
              {[0, 1, 2].map((index) => <span key={index} className={pickedSteps[index] ? 'filled' : ''}><b>{index + 1}</b>{pickedSteps[index] ?? 'Choose a step'}</span>)}
            </div>
            <div className="sequence-bank">
              {mixedSteps.filter((step) => !pickedSteps.includes(step)).map((step) => <button key={step} onClick={() => setPickedSteps((value) => [...value, step])}>{step}</button>)}
            </div>
            {pickedSteps.length > 0 && !sequenceComplete && <button className="ghost-action" onClick={() => setPickedSteps((value) => value.slice(0, -1))}>Undo last</button>}
            {sequenceComplete && (
              <div className={sequenceCorrect ? 'match-result correct' : 'match-result'}>
                {sequenceCorrect ? <Check /> : <RotateCcw />}
                <p><b>{sequenceCorrect ? 'Sequence retrieved.' : 'Good attempt—compare the order.'}</b> {drill.steps.join(' → ')}</p>
                {sequenceCorrect ? <button className="primary-action" onClick={() => addRecord({ response: pickedSteps.join(' → '), mode: 'rapid-recall', correct: true })}>Record & next <ChevronRight /></button> : <button className="ghost-action" onClick={() => setPickedSteps([])}>Try sequence again</button>}
              </div>
            )}
          </div>
        )}
      </article>

      <p className="support-note">These exercises support practice between sessions. They do not diagnose, treat, or replace care from a licensed professional.</p>
    </section>
  );
}
