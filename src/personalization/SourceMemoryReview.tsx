import React, { useEffect, useState } from 'react';

const TYPES = [
  'BOUNDARY',
  'USER_PREFERENCE',
  'CONFIRMED_PATTERN',
  'WORKING_HYPOTHESIS',
  'REJECTED_HYPOTHESIS',
  'UPDATED_PERSPECTIVE',
  'CURRENT_EXPERIMENT',
  'OUTCOME',
  'HELPFUL_STRATEGY',
];
interface Candidate {
  type: string;
  label: string;
  summary: string;
  tags: string[];
  confidence: string;
}
interface Draft extends Candidate {
  key: string;
  saved?: boolean;
  livedEvidence?: boolean;
}
const signature = (m: Candidate) =>
  `${m.type}|${m.label}|${m.summary}`.replace(/\s+/g, ' ').trim().toLowerCase();

export function SourceMemoryReview({
  documentId,
  onSaved,
}: {
  documentId: string;
  onSaved?: () => void;
}) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [truncated, setTruncated] = useState(false);
  const [reviewLoaded, setReviewLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotice('');
    setDrafts([]);
    setReviewLoaded(false);
    void (async () => {
      try {
        const [response, account] = await Promise.all([
          fetch(
            `/api/shift/source/review?documentId=${encodeURIComponent(documentId)}`,
            { cache: 'no-store' },
          ),
          fetch('/api/shift/memory/account', { cache: 'no-store' }),
        ]);
        const data = (await response.json()) as {
          error?: string;
          memories?: Candidate[];
          sourceTruncatedForExtraction?: boolean;
        };
        if (!response.ok)
          throw new Error(data.error || 'Unable to load memory review.');
        if (!account.ok)
          throw new Error(
            'Unable to verify previously saved account memory. Try reopening this review.',
          );
        const saved = (await account.json()) as {
          signedIn?: boolean;
          memories?: Candidate[];
        };
        if (!saved.signedIn)
          throw new Error('Sign in to review account memory.');
        const existing = new Set((saved.memories || []).map(signature));
        if (!cancelled) {
          setDrafts(
            (data.memories || []).map((m: Candidate) => ({
              ...m,
              key: crypto.randomUUID(),
              saved: existing.has(signature(m)),
            })),
          );
          setTruncated(Boolean(data.sourceTruncatedForExtraction));
          setReviewLoaded(true);
        }
      } catch (error) {
        if (!cancelled)
          setNotice(
            error instanceof Error
              ? error.message
              : 'Unable to load memory review.',
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [documentId]);
  function update(key: string, changes: Partial<Draft>) {
    setDrafts((current) =>
      current.map((m) => (m.key === key ? { ...m, ...changes } : m)),
    );
  }
  async function remember(draft: Draft) {
    if (busy || draft.saved) return;
    setBusy(draft.key);
    setNotice('');
    try {
      const memory = {
        type: draft.type,
        label: draft.label.trim(),
        summary: draft.summary.trim(),
        tags: draft.tags,
        confidence:
          draft.type === 'WORKING_HYPOTHESIS' ? 'working' : draft.confidence,
      };
      const response = await fetch('/api/shift/memory/remember', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: documentId,
          sourceKind: 'document',
          userConfirmed: true,
          livedEvidence: Boolean(draft.livedEvidence),
          memory,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        persisted?: boolean;
        id?: string;
      };
      if (!response.ok || !data.persisted || !data.id)
        throw new Error(
          data.error ||
            'This memory was not saved to your account. Your draft remains here.',
        );
      update(draft.key, { saved: true });
      setNotice(
        'Saved to your account. Find it in Memory → Account learning memory after reloading.',
      );
      onSaved?.();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Unable to save this memory.',
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <section
      className="personalize-review"
      aria-labelledby="source-memory-review-title"
    >
      <h3 id="source-memory-review-title">Review account learning</h3>
      <p>
        The private report is separate from these compact memories. Drafts do
        not influence conversations. Edit each one, keep reports and uncertainty
        clear, then choose Remember this.
      </p>
      <p className="personalize-small">
        Approval confirms your wording; it does not establish a diagnosis,
        another person’s motive, or a clinical cause. Professional and therapy
        lessons belong in the separate professional-learning controls under
        Memory.
      </p>
      {loading && <p role="status">Loading private review…</p>}
      {!loading && truncated && (
        <p role="alert">
          Only part of this source could be processed. Do not treat these
          candidates as a complete review.
        </p>
      )}
      {!loading && reviewLoaded && !truncated && (
        <p>
          All source text was processed. These are selected learning themes, not
          a complete biography.
        </p>
      )}
      {drafts.map((draft) => {
        const requiresResult =
          draft.type === 'HELPFUL_STRATEGY' || draft.type === 'OUTCOME';
        return (
          <article key={draft.key} className="personalize-review">
            <label>
              Memory label
              <input
                maxLength={100}
                value={draft.label}
                disabled={draft.saved || Boolean(busy)}
                onChange={(e) => update(draft.key, { label: e.target.value })}
              />
            </label>
            <label>
              Compact learning
              <textarea
                rows={4}
                maxLength={500}
                value={draft.summary}
                disabled={draft.saved || Boolean(busy)}
                onChange={(e) => update(draft.key, { summary: e.target.value })}
              />
            </label>
            <label>
              Learning type
              <select
                value={draft.type}
                disabled={draft.saved || Boolean(busy)}
                onChange={(e) =>
                  update(draft.key, {
                    type: e.target.value,
                    confidence:
                      e.target.value === 'WORKING_HYPOTHESIS'
                        ? 'working'
                        : 'user_confirmed',
                    livedEvidence: false,
                  })
                }
              >
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              How certain is this?
              <select
                value={
                  draft.type === 'WORKING_HYPOTHESIS'
                    ? 'working'
                    : draft.confidence
                }
                disabled={
                  draft.saved ||
                  Boolean(busy) ||
                  draft.type === 'WORKING_HYPOTHESIS'
                }
                onChange={(e) =>
                  update(draft.key, { confidence: e.target.value })
                }
              >
                <option value="user_confirmed">
                  My confirmed account or preference
                </option>
                <option value="observed">Reported observation</option>
                <option value="working">Possible explanation; uncertain</option>
              </select>
            </label>
            <label>
              Relevant words (comma separated)
              <input
                value={draft.tags.join(', ')}
                maxLength={480}
                disabled={draft.saved || Boolean(busy)}
                onChange={(e) =>
                  update(draft.key, {
                    tags: e.target.value
                      .split(',')
                      .map((t) => t.trim().slice(0, 60))
                      .slice(0, 8),
                  })
                }
              />
            </label>
            {requiresResult && !draft.saved && (
              <label className="personalize-check">
                <input
                  type="checkbox"
                  checked={Boolean(draft.livedEvidence)}
                  onChange={(e) =>
                    update(draft.key, { livedEvidence: e.target.checked })
                  }
                />
                {draft.type === 'HELPFUL_STRATEGY'
                  ? 'I actually tried this strategy and it helped.'
                  : 'This result actually happened; it is not a hypothetical test.'}
              </label>
            )}
            <div className="personalize-actions">
              <button
                disabled={
                  loading ||
                  Boolean(busy) ||
                  draft.saved ||
                  !draft.label.trim() ||
                  !draft.summary.trim() ||
                  (requiresResult && !draft.livedEvidence)
                }
                onClick={() => void remember(draft)}
              >
                {draft.saved
                  ? 'Saved to account'
                  : busy === draft.key
                    ? 'Saving…'
                    : 'Remember this'}
              </button>
              {!draft.saved && (
                <button
                  className="secondary"
                  disabled={Boolean(busy)}
                  onClick={() =>
                    setDrafts((current) =>
                      current.filter((m) => m.key !== draft.key),
                    )
                  }
                >
                  Skip for now
                </button>
              )}
            </div>
          </article>
        );
      })}
      {!loading && reviewLoaded && (
        <button
          className="secondary"
          disabled={Boolean(busy)}
          onClick={() =>
            setDrafts((current) => [
              ...current,
              {
                key: crypto.randomUUID(),
                type: 'BOUNDARY',
                label: '',
                summary: '',
                tags: [],
                confidence: 'user_confirmed',
              },
            ])
          }
        >
          Add my own compact memory
        </button>
      )}
      <output aria-live="polite">{notice}</output>
    </section>
  );
}
