'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Brain,
  ChevronRight,
  ClipboardList,
  Gamepad2,
  LockKeyhole,
  Printer,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

import {
  Difficulty,
  FrameworkId,
  PracticeRecord,
  ViewId,
  frameworks,
  getDrillsForFramework,
  getFramework,
  loadPracticeRecords,
  savePracticeRecords,
} from '@/lib/shift';

const navItems: { id: ViewId; label: string; icon: typeof Brain }[] = [
  { id: 'practice', label: 'Practice', icon: Brain },
  { id: 'arcade', label: 'Arcade', icon: Gamepad2 },
  { id: 'progress', label: 'Progress', icon: Activity },
  { id: 'report', label: 'Therapist report', icon: ClipboardList },
  { id: 'science', label: 'Why it works', icon: Sparkles },
];

export function ShiftApp() {
  const [view, setView] = useState<ViewId>('practice');
  const [frameworkId, setFrameworkId] = useState<FrameworkId>('cbt');
  const [drillIndex, setDrillIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [takeaway, setTakeaway] = useState('');
  const [confidence, setConfidence] = useState(3);
  const [difficulty, setDifficulty] = useState<Difficulty>('stretch');
  const [revealed, setRevealed] = useState(false);
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRecords(loadPracticeRecords());
    setReady(true);
  }, []);

  const frameworkDrills = useMemo(() => getDrillsForFramework(frameworkId), [frameworkId]);
  const drill = frameworkDrills[drillIndex % frameworkDrills.length];
  const framework = getFramework(frameworkId);
  const todayCount = records.filter((record) => {
    const today = new Date().toDateString();
    return new Date(record.completedAt).toDateString() === today;
  }).length;

  function resetAttempt(nextIndex = drillIndex) {
    setDrillIndex(nextIndex);
    setResponse('');
    setTakeaway('');
    setConfidence(3);
    setDifficulty('stretch');
    setRevealed(false);
  }

  function chooseFramework(id: FrameworkId) {
    setFrameworkId(id);
    resetAttempt(0);
  }

  function saveAttempt() {
    if (!response.trim()) return;
    const record: PracticeRecord = {
      id: crypto.randomUUID(),
      drillId: drill.id,
      framework: framework.id,
      title: drill.title,
      scenario: drill.scenario,
      response: response.trim(),
      takeaway: takeaway.trim(),
      confidence,
      difficulty,
      recalledBeforeReveal: revealed,
      completedAt: new Date().toISOString(),
    };
    const next = [record, ...records];
    setRecords(next);
    savePracticeRecords(next);
    resetAttempt((drillIndex + 1) % frameworkDrills.length);
  }

  return (
    <div className="shift-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView('practice')} aria-label="Open practice studio">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>
            <strong>SHIFT</strong>
            <small>Reflection Arcade</small>
          </span>
        </button>
        <div className="topbar-status">
          <span className="privacy-chip"><LockKeyhole /> Saved only on this device</span>
          <span className="session-chip"><i /> {todayCount} practices today</span>
        </div>
      </header>

      <aside className="sidebar" aria-label="Primary navigation">
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={view === item.id ? 'nav-item active' : 'nav-item'}
                onClick={() => setView(item.id)}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span>Recall before reveal</span>
          <p>Practice the move you want available under stress.</p>
        </div>
      </aside>

      <main className="workspace">
        {view === 'practice' ? (
          <div className="practice-layout">
            <section className="practice-main">
              <div className="eyebrow-row">
                <span className="eyebrow">Today’s practice studio</span>
                <span>Round {drillIndex + 1} of {frameworkDrills.length}</span>
              </div>
              <div className="practice-title-row">
                <div>
                  <h1>Retrieve the skill. Then compare.</h1>
                  <p>Write your response before opening the coaching example.</p>
                </div>
                <div className="signal-orbit" aria-hidden="true"><span /><span /><i /></div>
              </div>

              <div className="framework-switcher" aria-label="Choose a therapy framework">
                {frameworks.map((item) => (
                  <button
                    key={item.id}
                    className={frameworkId === item.id ? 'framework-pill selected' : 'framework-pill'}
                    style={{ '--skill': item.color, '--skill-soft': item.softColor } as React.CSSProperties}
                    onClick={() => chooseFramework(item.id)}
                  >
                    <b>{item.shortName}</b>
                    <span>{item.focus}</span>
                  </button>
                ))}
              </div>

              <article className="recall-card" style={{ '--skill': framework.color } as React.CSSProperties}>
                <div className="recall-card-header">
                  <div>
                    <span className="skill-label" style={{ color: framework.color }}>{framework.shortName} · {framework.focus}</span>
                    <h2>{drill.title}</h2>
                  </div>
                  <span className="recall-badge"><Brain /> Active recall</span>
                </div>

                <div className="scenario-block">
                  <span>Scenario</span>
                  <p>{drill.scenario}</p>
                </div>

                <div className="prompt-block">
                  <span>Your move</span>
                  <h3>{drill.prompt}</h3>
                  <p className="cue">Cue: {drill.cue}</p>
                </div>

                <label className="response-field">
                  <span>Recall the skill in your own words</span>
                  <textarea
                    value={response}
                    onChange={(event) => setResponse(event.target.value)}
                    placeholder="What would you notice, say, or do next?"
                    rows={5}
                  />
                </label>

                {!revealed ? (
                  <div className="recall-action-row">
                    <p>Your attempt stays visible when the example opens.</p>
                    <button
                      className="primary-action"
                      disabled={!response.trim()}
                      onClick={() => setRevealed(true)}
                    >
                      Lock answer & reveal <ChevronRight />
                    </button>
                  </div>
                ) : (
                  <div className="reveal-panel">
                    <div className="reveal-heading">
                      <span>Coaching example</span>
                      <em>Compare—do not grade yourself</em>
                    </div>
                    <p>{drill.modelResponse}</p>
                    <div className="steps-row">
                      {drill.steps.map((step, index) => (
                        <span key={step}><b>{index + 1}</b>{step}</span>
                      ))}
                    </div>
                    <label className="takeaway-field">
                      <span>What do you want to remember next time?</span>
                      <textarea
                        value={takeaway}
                        onChange={(event) => setTakeaway(event.target.value)}
                        placeholder="One sentence is enough."
                        rows={2}
                      />
                    </label>
                    <div className="rating-grid">
                      <fieldset>
                        <legend>How effortful was recall?</legend>
                        <div className="choice-row">
                          {(['easy', 'stretch', 'hard'] as Difficulty[]).map((value) => (
                            <button key={value} className={difficulty === value ? 'choice active' : 'choice'} onClick={() => setDifficulty(value)}>
                              {value === 'easy' ? 'Easy' : value === 'stretch' ? 'Useful stretch' : 'Hard'}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                      <fieldset>
                        <legend>Confidence using this skill</legend>
                        <div className="confidence-row">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button key={value} className={confidence === value ? 'confidence active' : 'confidence'} onClick={() => setConfidence(value)}>{value}</button>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                    <div className="save-row">
                      <button className="ghost-action" onClick={() => resetAttempt()}><RotateCcw /> Try again</button>
                      <button className="primary-action" onClick={saveAttempt}>Save practice & continue <ChevronRight /></button>
                    </div>
                  </div>
                )}
              </article>
            </section>

            <aside className="practice-aside">
              <div className="session-card">
                <div className="section-heading">
                  <span>Session pulse</span>
                  <b>{todayCount}/4</b>
                </div>
                <div className="session-progress" role="progressbar" aria-label="Daily practice progress" aria-valuenow={Math.min(todayCount * 25, 100)} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${Math.min(todayCount * 25, 100)}%` }} />
                </div>
                <p>Four thoughtful recalls make a complete practice set. There is no streak to protect.</p>
              </div>
              <div className="framework-card" style={{ '--skill': framework.color, '--skill-soft': framework.softColor } as React.CSSProperties}>
                <span className="framework-monogram">{framework.shortName}</span>
                <h3>{framework.name}</h3>
                <p>{framework.question}</p>
              </div>
              <div className="therapist-card">
                <ClipboardList />
                <div>
                  <span>Captured for review</span>
                  <p>{drill.therapistFocus}</p>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <section className="placeholder-view">
            <span className="eyebrow">Next workspace</span>
            <h1>{navItems.find((item) => item.id === view)?.label}</h1>
            <p>The practice data is saved. This section is being assembled around the same learning loop.</p>
            {view === 'report' && <button className="primary-action" onClick={() => window.print()}><Printer /> Print report</button>}
          </section>
        )}
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}><Icon /><span>{item.label.replace('Therapist ', '')}</span></button>;
        })}
      </nav>

      {!ready && <div className="loading-screen">Loading your practice studio…</div>}
    </div>
  );
}
