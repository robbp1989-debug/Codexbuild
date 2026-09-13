import React, { useState } from 'react';
import { HollyIntake } from '../holly/HollyIntake';
import { ReportImport } from './ReportImport';
import { useApp } from '../context/AppContext';
import { PersonalSummary } from '../components/home/PersonalSummary';
import type { ContextItem } from './model';
import './personalization.css';
function ContextReview({ item }: { item: ContextItem }) {
  const { personalContext, savePersonalContext } = useApp();
  const [text, setText] = useState(item.text);
  function update(status: ContextItem['status']) {
    savePersonalContext(
      personalContext.map((x) =>
        x.id === item.id ? { ...x, text: text.trim(), status } : x,
      ),
    );
  }
  return (
    <div className="personalize-review">
      <label>
        {item.label}
        <textarea
          rows={2}
          maxLength={600}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <p className="personalize-small">
        {item.source === 'document_report'
          ? `Report: ${item.sourceLabel || 'Imported excerpt'}`
          : item.source === 'user_direct_voice'
            ? 'Your spoken answer'
            : 'Your typed answer'}{' '}
        · {item.status} · {new Date(item.timestamp).toLocaleDateString()}
      </p>
      <div className="personalize-actions">
        <button disabled={!text.trim()} onClick={() => update('confirmed')}>
          Approve changes
        </button>
        <button className="secondary" onClick={() => update('historical')}>
          Not true anymore
        </button>
        <button className="secondary" onClick={() => update('uncertain')}>
          I’m not sure
        </button>
        <button
          className="secondary"
          onClick={() =>
            savePersonalContext(personalContext.filter((x) => x.id !== item.id))
          }
        >
          Remove
        </button>
      </div>
    </div>
  );
}
export function PersonalizationScreen() {
  const {
    personalContext,
    personalizationRevision,
    contextRemembered,
    savePersonalContext,
    clearPersonalization,
    contextNotice,
    setActiveTab,
  } = useApp();
  const [section, setSection] = useState<'holly' | 'report'>('holly');
  return (
    <div className="personalize-screen">
      <header>
        <p className="personalize-eyebrow">SHIFT · Personal context</p>
        <h1>Start with what matters to you.</h1>
        <p>
          Your answers and selected report excerpts can shape future
          reflections. You decide what is used.
        </p>
        <div className="personalize-actions">
          <button
            aria-pressed={section === 'holly'}
            onClick={() => setSection('holly')}
          >
            Intake with Holly
          </button>
          <button
            aria-pressed={section === 'report'}
            onClick={() => setSection('report')}
          >
            Import a report
          </button>
          <button className="secondary" onClick={() => setActiveTab('home')}>
            Return to Arrival
          </button>
        </div>
      </header>
      {section === 'holly' ? <HollyIntake key={personalizationRevision} /> : <ReportImport key={personalizationRevision} />}
      <section className="personalize-card">
        <h2>Your approved context</h2>
        <p>
          Only confirmed entries are sent with future reflections and Keep
          Talking messages to SHIFT’s server and its AI provider. Unapproved
          intake answers and report text are not sent. Removing context does not
          rewrite earlier conversations.
        </p>
        <label className="personalize-check">
          <input
            type="checkbox"
            checked={contextRemembered}
            onChange={(e) =>
              savePersonalContext(personalContext, e.target.checked)
            }
          />
          Remember approved context on this device. This is unencrypted browser
          storage, not account storage. Leave off for this visit only.
        </label>
        {personalContext.length === 0 ? (
          <p>No approved context yet.</p>
        ) : (
          personalContext.map((item) => (
            <ContextReview item={item} key={item.id} />
          ))
        )}
        <button className="secondary" onClick={clearPersonalization}>
          Delete all intake and report context
        </button>
        <output aria-live="polite">{contextNotice}</output>
      </section>
      <PersonalSummary />
    </div>
  );
}
