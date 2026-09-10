import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export function PersonalSummary() {
  const { approvedSummary, summaryRemembered, approveSummary } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [remember, setRemember] = useState(false);
  const [notice, setNotice] = useState('');
  const save = (text: string, persist: boolean) => {
    if (!approveSummary(text, persist)) { setNotice('Your browser could not update storage. Please check its storage settings and try again.'); return; }
    setNotice(text.trim() ? 'Summary approved. Future reflections can use it.' : 'Summary removed. Earlier reflections are unchanged.');
    setEditing(false);
    setDraft('');
  };
  return <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 space-y-3" aria-labelledby="personal-summary-title">
    <div className="flex flex-wrap justify-between items-center gap-3">
      <div><h2 id="personal-summary-title" className="font-semibold text-lg text-slate-900">Your story, in your words</h2>
        <p className="text-sm text-slate-600">Optional context for more relevant reflections—not a diagnosis or a clinical record.</p></div>
      {!editing && <button className="rounded-xl bg-blue-600 text-white px-4 py-2" onClick={() => { setDraft(approvedSummary); setRemember(summaryRemembered); setEditing(true); setNotice(''); }}>{approvedSummary ? 'Review or edit summary' : 'Add my summary'}</button>}
    </div>
    {approvedSummary && !editing && <p className="text-sm text-blue-800">Approved summary active · {summaryRemembered ? 'Remembered on this device' : 'This visit only'}</p>}
    {editing && <div className="space-y-3">
      <label className="block text-sm text-slate-700" htmlFor="personal-summary">What would you like SHIFT to keep in mind? Include goals, important boundaries, helpful skills, and anything you want it to avoid assuming. Share only what feels necessary.</label>
      <textarea id="personal-summary" value={draft} maxLength={4000} rows={6} onChange={e => setDraft(e.target.value)} className="w-full rounded-xl border border-blue-200 bg-white p-3 text-slate-900" />
      <p className="text-sm text-slate-600">{draft.length}/4,000 characters. No document uploads or raw document storage. The approved summary is sent with reflections to our server and, when available, OpenAI for processing. Unsaved edits are not sent.</p>
      <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="mt-1" />Remember on this device. This is unencrypted browser storage, not a private account; avoid this option on a shared device.</label>
      <div className="flex flex-wrap gap-3">
        <button disabled={!draft.trim()} onClick={() => save(draft, remember)} className="rounded-xl bg-blue-600 text-white px-4 py-2 disabled:opacity-50">Approve and use summary</button>
        <button onClick={() => { setEditing(false); setDraft(''); }} className="px-4 py-2 rounded-xl border border-blue-200">Cancel edits</button>
        {approvedSummary && <button onClick={() => save('', false)} className="px-4 py-2 underline">Remove approved summary</button>}
      </div>
    </div>}
    <p role="status" className="text-sm text-slate-700">{notice}</p>
  </section>;
}
