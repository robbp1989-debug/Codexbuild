'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';

type StorageStatus = {
  authenticatedUser: boolean;
  d1Binding: boolean;
  d1SchemaReady: boolean;
  d1RoundTrip: boolean;
  r2Binding: boolean;
  r2RoundTrip: boolean;
  cleanupSucceeded: boolean;
  ready: boolean;
  checkedAt: string;
};

const Row = ({ label, ok, note }: { label: string; ok: boolean; note?: string }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-800 last:border-b-0">
    <div>
      <p className="text-sm font-semibold text-slate-200">{label}</p>
      {note && <p className="text-xs text-slate-500 mt-0.5">{note}</p>}
    </div>
    {ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
  </div>
);

export default function StorageCheckPage() {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const inspect = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/shift/system/self-test', { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not inspect this deployment.');
      setStatus(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not inspect this deployment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void inspect();
  }, []);

  const runSelfTest = async () => {
    setRunning(true);
    setError('');
    try {
      const response = await fetch('/api/shift/system/self-test', { method: 'POST' });
      const data = await response.json() as StorageStatus & { error?: string };
      if (!response.ok && !('ready' in data)) throw new Error(data.error || 'Storage self-test failed.');
      setStatus(data);
      if (!data.ready) setError('One or more storage checks still need deployment setup. No personal reflection data was used in this test.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Storage self-test failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-sky-300" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-sky-300">SHIFT deployment check</p>
            <h1 className="text-2xl font-bold mt-1">Private memory storage readiness</h1>
            <p className="text-sm text-slate-400 mt-2">This page uses synthetic test records only. It does not send or modify a real reflection.</p>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl">
          {loading && !status ? (
            <div className="py-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Inspecting bindings…
            </div>
          ) : status ? (
            <div>
              <Row label="Signed-in account" ok={status.authenticatedUser} note="Required for cross-device personal memory." />
              <Row label="D1 database binding" ok={status.d1Binding} note="Stores compact reusable learning records." />
              <Row label="D1 learning schema" ok={status.d1SchemaReady} note="Confirms the required memory tables exist." />
              <Row label="D1 write/read round trip" ok={status.d1RoundTrip} note="Verified only after running the reversible self-test." />
              <Row label="R2 private-source binding" ok={status.r2Binding} note="Stores imported source files separately from reusable learning." />
              <Row label="R2 write/read round trip" ok={status.r2RoundTrip} note="Verified only after running the reversible self-test." />
              <Row label="Diagnostic cleanup" ok={status.cleanupSucceeded} note="Synthetic test records are removed after the check." />
            </div>
          ) : null}

          {error && <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-200">{error}</p>}

          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => void runSelfTest()}
              disabled={running || !status?.authenticatedUser}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 text-xs font-bold"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {running ? 'Testing private storage…' : 'Run reversible storage test'}
            </button>
            <button
              type="button"
              onClick={() => void inspect()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:border-sky-500/50 hover:text-sky-300"
            >
              <RefreshCw className="w-4 h-4" /> Refresh status
            </button>
          </div>

          {status && !status.authenticatedUser && (
            <p className="mt-4 text-xs text-slate-400">Open this page from the hosted SHIFT experience while signed in with ChatGPT to test account persistence.</p>
          )}
          {status?.ready && (
            <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm text-emerald-200">
              Account learning memory and private-source storage passed the live round-trip check.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
