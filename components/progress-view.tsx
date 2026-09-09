'use client';

import { useState } from 'react';
import { CalendarDays, Gauge, Layers3, TrendingUp } from 'lucide-react';

import { type PracticeRecord, frameworks } from '@/lib/shift';

export function ProgressView({ records }: { records: PracticeRecord[] }) {
  const [now] = useState(() => Date.now());
  const lastSeven = records.filter((record) => now - new Date(record.completedAt).getTime() <= 7 * 86400000);
  const averageConfidence = records.length ? (records.reduce((sum, record) => sum + record.confidence, 0) / records.length).toFixed(1) : '—';
  const practicedFrameworks = new Set(records.map((record) => record.framework)).size;
  const retrievalRate = records.length ? Math.round((records.filter((record) => record.recalledBeforeReveal).length / records.length) * 100) : 0;
  const maxFrameworkCount = Math.max(1, ...frameworks.map((framework) => records.filter((record) => record.framework === framework.id).length));

  return (
    <section className="view-shell">
      <div className="view-hero compact">
        <div>
          <span className="eyebrow">Practice signals</span>
          <h1>Progress is repetition with reflection.</h1>
          <p>See what you have rehearsed and what may deserve attention with your therapist.</p>
        </div>
      </div>

      <div className="stat-grid">
        <Metric icon={TrendingUp} label="Total practices" value={String(records.length)} note="Guided + arcade rounds" />
        <Metric icon={CalendarDays} label="Last 7 days" value={String(lastSeven.length)} note="No streaks or penalties" />
        <Metric icon={Gauge} label="Avg. confidence" value={averageConfidence} note="Self-rated out of 5" />
        <Metric icon={Layers3} label="Skills explored" value={`${practicedFrameworks}/4`} note={`${retrievalRate}% before reveal`} />
      </div>

      <div className="progress-columns">
        <article className="data-panel">
          <div className="panel-heading"><div><span className="eyebrow">Repetition map</span><h2>Practice by framework</h2></div><small>All time</small></div>
          <div className="framework-bars">
            {frameworks.map((framework) => {
              const count = records.filter((record) => record.framework === framework.id).length;
              return (
                <div className="framework-bar" key={framework.id}>
                  <div><b style={{ color: framework.color }}>{framework.shortName}</b><span>{framework.focus}</span><em>{count}</em></div>
                  <i><span style={{ width: `${(count / maxFrameworkCount) * 100}%`, background: framework.color }} /></i>
                </div>
              );
            })}
          </div>
        </article>

        <article className="data-panel">
          <div className="panel-heading"><div><span className="eyebrow">Recent retrievals</span><h2>Your latest rounds</h2></div></div>
          {records.length === 0 ? (
            <div className="empty-state"><BrainDot /><p>Your saved practice rounds will appear here.</p></div>
          ) : (
            <div className="recent-list">
              {records.slice(0, 6).map((record) => {
                const framework = frameworks.find((item) => item.id === record.framework)!;
                return <div key={record.id}><i style={{ background: framework.color }} /><span><b>{record.title}</b><small>{framework.shortName} · {new Date(record.completedAt).toLocaleDateString()}</small></span><em>{record.confidence}/5</em></div>;
              })}
            </div>
          )}
        </article>
      </div>
      <p className="support-note">These are practice signals—not symptom scores, diagnoses, or measures of clinical outcome.</p>
    </section>
  );
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof TrendingUp; label: string; value: string; note: string }) {
  return <article className="metric-card"><Icon /><span>{label}</span><b>{value}</b><small>{note}</small></article>;
}

function BrainDot() {
  return <span className="empty-dot" aria-hidden="true" />;
}
