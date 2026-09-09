'use client';

import { useMemo, useState } from 'react';
import { FileCheck2, LockKeyhole, Printer } from 'lucide-react';

import { type PracticeRecord, frameworks } from '@/lib/shift';

type Period = 7 | 30 | 'all';

export function ReportView({ records }: { records: PracticeRecord[] }) {
  const [period, setPeriod] = useState<Period>(7);
  const [now] = useState(() => Date.now());
  const [clientName, setClientName] = useState('');
  const [sessionFocus, setSessionFocus] = useState('');
  const filtered = useMemo(() => period === 'all' ? records : records.filter((record) => now - new Date(record.completedAt).getTime() <= period * 86400000), [now, period, records]);
  const hardCount = filtered.filter((record) => record.difficulty === 'hard').length;
  const average = filtered.length ? (filtered.reduce((sum, record) => sum + record.confidence, 0) / filtered.length).toFixed(1) : '—';
  const takeaways = filtered.filter((record) => record.takeaway.trim()).slice(0, 5);

  return (
    <section className="view-shell report-page">
      <div className="view-hero report-hero">
        <div>
          <span className="eyebrow">Collaborative session review</span>
          <h1>Therapist practice report</h1>
          <p>A plain-language record of what was rehearsed between sessions.</p>
        </div>
        <button className="primary-action print-button" onClick={() => window.print()}><Printer /> Print or save as PDF</button>
      </div>

      <div className="report-controls no-print">
        <label><span>Client name (optional)</span><input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Name or initials" /></label>
        <label><span>Reporting window</span><select value={String(period)} onChange={(event) => setPeriod(event.target.value === 'all' ? 'all' : Number(event.target.value) as 7 | 30)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="all">All practice</option></select></label>
        <label className="focus-field"><span>What I want to discuss</span><input value={sessionFocus} onChange={(event) => setSessionFocus(event.target.value)} placeholder="A pattern, question, or difficult moment" /></label>
      </div>

      <article className="report-sheet">
        <header className="report-masthead">
          <div><span className="report-logo">S</span><p><b>SHIFT</b><small>Reflection Arcade</small></p></div>
          <div><span>Practice summary</span><b>{period === 'all' ? 'All saved practice' : `Past ${period} days`}</b><small>Generated {new Date().toLocaleDateString()}</small></div>
        </header>

        <div className="report-intro">
          <div><span>Client</span><b>{clientName || 'Not entered'}</b></div>
          <p>This report organizes self-reported skills practice for collaborative review. It is not a clinical assessment, diagnosis, treatment recommendation, or measure of therapeutic progress.</p>
        </div>

        <section className="report-section">
          <h2>Practice at a glance</h2>
          <div className="report-metrics">
            <div><b>{filtered.length}</b><span>completed rounds</span></div>
            <div><b>{new Set(filtered.map((record) => record.framework)).size}/4</b><span>frameworks practiced</span></div>
            <div><b>{average}</b><span>average confidence / 5</span></div>
            <div><b>{hardCount}</b><span>rounds marked hard</span></div>
          </div>
        </section>

        <section className="report-section">
          <h2>Framework distribution</h2>
          <div className="report-frameworks">
            {frameworks.map((framework) => {
              const count = filtered.filter((record) => record.framework === framework.id).length;
              return <div key={framework.id}><i style={{ background: framework.color }} /><b>{framework.shortName}</b><span>{framework.focus}</span><em>{count} round{count === 1 ? '' : 's'}</em></div>;
            })}
          </div>
        </section>

        <section className="report-section">
          <h2>Recent skill practice</h2>
          {filtered.length === 0 ? <p className="report-empty">No practice has been saved in this reporting window.</p> : (
            <div className="report-table-wrap"><table><thead><tr><th>Date</th><th>Framework & skill</th><th>Effort</th><th>Confidence</th></tr></thead><tbody>{filtered.slice(0, 10).map((record) => <tr key={record.id}><td>{new Date(record.completedAt).toLocaleDateString()}</td><td><b>{record.framework.toUpperCase()}</b> · {record.title}</td><td>{record.difficulty}</td><td>{record.confidence}/5</td></tr>)}</tbody></table></div>
          )}
        </section>

        <section className="report-section two-column-report">
          <div><h2>Takeaways captured</h2>{takeaways.length ? <ul>{takeaways.map((record) => <li key={record.id}><b>{record.title}:</b> {record.takeaway}</li>)}</ul> : <p className="report-empty">No written takeaways were saved yet.</p>}</div>
          <div><h2>Suggested review prompts</h2><ul><li>Which skill was easiest to retrieve without a cue?</li><li>Where did the skill feel hard to use in real life?</li><li>Which response should be rehearsed or adjusted next?</li></ul></div>
        </section>

        {sessionFocus && <section className="report-section focus-print"><h2>Client’s discussion focus</h2><p>{sessionFocus}</p></section>}

        <footer className="report-footer"><FileCheck2 /><p><b>For collaborative review with a licensed therapist</b><span>Entries reflect the user’s own practice and ratings. Clinical meaning should be determined together with the treating professional.</span></p><small><LockKeyhole /> Data stayed on this device until this report was printed or saved.</small></footer>
      </article>
    </section>
  );
}
