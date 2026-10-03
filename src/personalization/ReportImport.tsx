import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { readReport } from './readReport';
import { MAX_REPORT_TEXT } from './reportLimits';
import { MAX_ITEM, type ContextItem } from './model';
import { SourceMemoryReview } from './SourceMemoryReview';
import { PersonalHistoryControls } from './PersonalHistoryControls';
export function ReportImport() {
  const { personalContext, savePersonalContext, contextNotice } = useApp();
  const [report, setReport] = useState('');
  const [sourceLabel, setSourceLabel] = useState('My report');
  const [excerpt, setExcerpt] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [importMode, setImportMode] = useState<'history' | 'learning'>('history');
  const [documentId, setDocumentId] = useState('');
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
        setDocumentId('');
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
  async function uploadForReview() {
    if (!report.trim() || busy || documentId) return;
    setBusy(true);
    setNotice('');
    try {
      const form = new FormData();
      const name = sourceLabel.replace(/[\\/\r\n]/g, '_').trim() || 'My report';
      form.set('file', new File([report], name.endsWith('.txt') ? name : `${name}.txt`, { type: 'text/plain' }));
      form.set('approveSourceUpload', 'true');
      form.set('useDetailedHistory', importMode === 'history' ? 'true' : 'false');
      const response = await fetch('/api/shift/source/upload', { method: 'POST', body: form });
      const data = await response.json() as { stored?: boolean; documentId?: string; extractionStatus?: string; historyEnabled?: boolean; error?: string };
      if (!response.ok || !data.stored || !data.documentId) throw new Error(data.error || 'The private source was not saved. Your report remains here.');
      setDocumentId(data.documentId);
      setNotice(data.historyEnabled ? 'Your complete report is saved to your account for automatic, relevant personal-history recall. No section-by-section approval is needed.' : data.extractionStatus === 'completed'
        ? 'Private report text saved. No account memories have been saved yet. Review the drafts below.'
        : data.error || 'Private report text saved, but memory review could not finish.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to import this source.');
    } finally { setBusy(false); }
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
        Remember your full personal history with one approval, review smaller
        learning entries, or choose visit-only excerpts. Reading or pasting alone does
        not upload the report.
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
        Up to 4 MB and 120,000 text characters; text PDFs up to 80 pages. Scanned PDFs need text pasted
        below. Files are read in this browser. Private account import saves the
        extracted plain text only when you choose it below.
      </p>
      {busy && <output aria-live="polite">Reading report…</output>}
      <label>
        Report text — you may also paste it here
        <textarea
          rows={7}
          maxLength={MAX_REPORT_TEXT}
          disabled={busy || Boolean(documentId)}
          value={report}
          onChange={(e) => setReport(e.target.value)}
          placeholder="Paste a report or notes…"
        />
      </label>
      <p className="personalize-small">{report.length.toLocaleString()} / {MAX_REPORT_TEXT.toLocaleString()} text characters. Full-history approval saves all of this text.</p>
      <label>
        Source name (for your review)
        <input
          maxLength={100}
          disabled={busy || Boolean(documentId)}
          value={sourceLabel}
          onChange={(e) => setSourceLabel(e.target.value)}
        />
      </label>
      <div className="personalize-review">
        <h3>Remember your history</h3>
        <label>How should SHIFT use this report?<select disabled={busy || Boolean(documentId)} value={importMode} onChange={e => setImportMode(e.target.value as 'history' | 'learning')}><option value="history">Full personal history — one approval</option><option value="learning">Smaller learning entries — review each one</option></select></label>
        <p>{importMode === 'history' ? 'Approving saves all report text privately to your account. SHIFT keeps the names, relationships and events, searches the full report automatically, and sends only relevant passages to its AI provider in future reflections and chats. One approval covers the complete report; it does not verify its claims or turn historical labels into current diagnoses.' : 'Approving stores the private source and sends it for one-time AI extraction of compact learning drafts. Choose Remember this for each smaller entry you want saved.'}</p>
        <button disabled={busy || !report.trim() || Boolean(documentId)} onClick={() => void uploadForReview()}>{documentId ? 'Saved to account' : busy ? 'Saving report…' : importMode === 'history' ? 'Approve and remember full history' : 'Save private source and review memories'}</button>
        <p className="personalize-small">You can stop history recall, add corrections or delete the report under Memory. Separately saved learning has its own controls.</p>
      </div>
      {documentId && (importMode === 'history' ? <PersonalHistoryControls documentId={documentId} /> : <SourceMemoryReview documentId={documentId} />)}
      <h3>Visit-only excerpt</h3>
      <p>This excerpt uses your approved-context setting below. It does not create account memory.</p>
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
          disabled={busy}
          onClick={() => {
            sequence.current++;
            setReport('');
            setExcerpt('');
            setSourceLabel('My report');
            setBusy(false);
            setDocumentId('');
            setNotice('Report text cleared from this screen. Any saved private source or account learning remains under Memory.');
          }}
        >
          Clear report from this screen
        </button>
      </div>
      <output aria-live="polite">{notice || contextNotice}</output>
    </section>
  );
}
