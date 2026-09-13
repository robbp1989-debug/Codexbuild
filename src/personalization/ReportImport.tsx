import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { readReport } from './readReport';
import { MAX_ITEM, type ContextItem } from './model';
export function ReportImport() {
  const { personalContext, savePersonalContext, contextNotice } = useApp();
  const [report, setReport] = useState('');
  const [sourceLabel, setSourceLabel] = useState('My report');
  const [excerpt, setExcerpt] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const sequence = useRef(0);
  async function load(file?: File) {
    if (!file) return;
    const request = ++sequence.current;
    setBusy(true);
    setNotice('');
    try {
      const text = await readReport(file);
      if (request === sequence.current) {
        setReport(text);
        setSourceLabel(file.name.slice(0, 100));
        setExcerpt('');
      }
    } catch (e) {
      if (request === sequence.current) {
        setReport('');
        setNotice(
          e instanceof Error ? e.message : 'Unable to read this report.',
        );
      }
    } finally {
      if (request === sequence.current) setBusy(false);
    }
  }
  function approve() {
    if (!excerpt.trim() || excerpt.length > MAX_ITEM) return;
    const item: ContextItem = {
      id: crypto.randomUUID(),
      question_id: 'report',
      label: 'Report excerpt',
      raw_user_text: excerpt.trim(),
      text: excerpt.trim(),
      source: 'document_report',
      sourceLabel,
      confidence: null,
      status: 'confirmed',
      timestamp: new Date().toISOString(),
    };
    if (savePersonalContext([...personalContext, item])) {
      setExcerpt('');
      setNotice('Excerpt approved. Add another or discard the report text.');
    }
  }
  return (
    <section className="personalize-card" aria-labelledby="report-title">
      <p className="personalize-eyebrow">Your context · Your choice</p>
      <h2 id="report-title">Bring a report</h2>
      <p>
        Read a report here, then copy only the excerpts you want SHIFT to use.
        Nothing from the report is sent for AI processing until you approve an
        excerpt and send a reflection or message.
      </p>
      <label>
        Choose a report
        <input
          aria-label="Choose a report"
          type="file"
          accept=".txt,.md,.markdown,.csv,.json,.pdf,.docx"
          disabled={busy}
          onChange={(e) => {
            void load(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>
      <p className="personalize-small">
        Up to 4 MB; text PDFs up to 80 pages. Scanned PDFs need text pasted
        below. Files are read in this browser; SHIFT does not upload or retain
        the raw file.
      </p>
      {busy && <output aria-live="polite">Reading report…</output>}
      <label>
        Report text — you may also paste it here
        <textarea
          rows={7}
          maxLength={80000}
          value={report}
          onChange={(e) => setReport(e.target.value)}
          placeholder="Paste a report or notes…"
        />
      </label>
      <label>
        Source name (for your review)
        <input
          maxLength={100}
          value={sourceLabel}
          onChange={(e) => setSourceLabel(e.target.value)}
        />
      </label>
      <label>
        Excerpt to approve
        <textarea
          rows={3}
          maxLength={MAX_ITEM}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Copy a relevant passage here. Keep who said it and any uncertainty clear."
        />
      </label>
      <p className="personalize-small">
        {excerpt.length}/{MAX_ITEM}. A report statement stays attributed to a
        report; approval does not make it an independently verified diagnosis.
        You may edit it before approving.
      </p>
      <div className="personalize-actions">
        <button disabled={!excerpt.trim() || busy} onClick={approve}>
          Approve this excerpt
        </button>
        <button
          className="secondary"
          onClick={() => {
            sequence.current++;
            setReport('');
            setExcerpt('');
            setSourceLabel('My report');
            setBusy(false);
            setNotice('Unapproved report text discarded.');
          }}
        >
          Discard report text
        </button>
      </div>
      <output aria-live="polite">{notice || contextNotice}</output>
    </section>
  );
}
