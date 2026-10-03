import React, { useEffect, useRef, useState } from 'react';

export function PersonalHistoryControls({
  documentId,
}: {
  documentId: string;
}) {
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState('');
  const [updates, setUpdates] = useState<
    Array<{ id: string; text: string; recordedAt?: string }>
  >([]);
  const sequence = useRef(0);
  async function load() {
    const requestId = ++sequence.current;
    const response = await fetch(
      `/api/shift/source/history?documentId=${encodeURIComponent(documentId)}`,
      { cache: 'no-store' },
    );
    const data = (await response.json()) as {
      enabled?: boolean;
      error?: string;
      updates?: typeof updates;
    };
    if (!response.ok)
      throw new Error(data.error || 'Unable to load private history.');
    if (requestId === sequence.current) {
      setEnabled(Boolean(data.enabled));
      setUpdates(data.updates || []);
      setLoaded(true);
    }
  }
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setNotice('');
    void load().catch((error) => {
      if (!cancelled)
        setNotice(
          error instanceof Error ? error.message : 'History unavailable.',
        );
    });
    return () => {
      cancelled = true;
      sequence.current++;
    };
  }, [documentId]);
  async function save(
    nextEnabled: boolean,
    removeUpdateId?: string,
    saveNote = false,
  ) {
    if (busy) return;
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/shift/source/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          enabled: nextEnabled,
          ...(saveNote && note.trim() ? { additionalContext: note } : {}),
          ...(removeUpdateId ? { removeUpdateId } : {}),
        }),
      });
      const data = (await response.json()) as {
        saved?: boolean;
        enabled?: boolean;
        error?: string;
      };
      if (!response.ok || !data.saved)
        throw new Error(data.error || 'History was not saved.');
      setEnabled(Boolean(data.enabled));
      if (saveNote) setNote('');
      setNotice(
        removeUpdateId
          ? 'This update was removed from future history recall.'
          : saveNote
            ? 'Your personal update is saved to your account for relevant future chats.'
            : nextEnabled
              ? 'Full personal history is enabled for relevant future chats.'
              : 'This report and its personal updates will no longer be retrieved in new chats. Separately saved learning remains under Account learning memory.',
      );
      await load();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Unable to save history.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="personalize-review">
      <h3>Your full personal history</h3>
      <p>
        SHIFT can automatically find relevant passages in this report, keeping
        names, relationships, events and your own explanations. One approval
        covers the full report. Unrelated details stay out of a new
        conversation.
      </p>
      <p role="status">
        {loaded
          ? enabled
            ? 'Enabled for automatic account history recall'
            : 'Not enabled for automatic history recall'
          : 'Loading history setting…'}
      </p>
      {loaded && (
        <>
          <button disabled={busy} onClick={() => void save(!enabled)}>
            {enabled
              ? 'Stop using this report in chats'
              : 'Approve and remember full history'}
          </button>
          <label>
            Personal update or correction
            <textarea
              rows={4}
              maxLength={6000}
              value={note}
              disabled={busy}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add details missing from the report, in your own words. Keep reported events and interpretations clear."
            />
          </label>
          <button
            disabled={busy || !note.trim()}
            onClick={() => void save(true, undefined, true)}
          >
            Save this personal update
          </button>
          {updates.map((update) => (
            <article className="personalize-review" key={update.id}>
              <p>{update.text}</p>
              <p className="personalize-small">
                Your direct update ·{' '}
                {update.recordedAt
                  ? new Date(update.recordedAt).toLocaleDateString()
                  : ''}
              </p>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => void save(enabled, update.id)}
              >
                Remove this update
              </button>
            </article>
          ))}
        </>
      )}
      <output aria-live="polite">{notice}</output>
    </section>
  );
}
