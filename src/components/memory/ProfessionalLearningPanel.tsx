'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  BookOpenCheck,
  Check,
  ChevronDown,
  ChevronUp,
  History,
  Loader2,
  Pencil,
  RefreshCw,
  X,
} from 'lucide-react';

interface ProfessionalLesson {
  id: string;
  title: string;
  sourceType: 'therapist' | 'counselor' | 'recovery_support' | 'medical_professional' | 'user_insight' | 'shift_working_hypothesis';
  lessonSummary: string;
  triggerConditions: string[];
  oldPattern: string;
  newSkill: string;
  replacementRule: string;
  example: string;
  prediction: string;
  desiredExperiment: string;
  evidenceObserved: string[];
  confidence: number;
  userConfirmed: boolean;
  active: boolean;
  sensitivityLevel: 'low' | 'medium' | 'high';
  supersedesId?: string;
  supersededAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface EditDraft {
  title: string;
  lessonSummary: string;
  triggerConditions: string;
  newSkill: string;
  replacementRule: string;
}

function sourceLabel(source: ProfessionalLesson['sourceType']): string {
  switch (source) {
    case 'therapist': return 'Therapist';
    case 'counselor': return 'Counselor';
    case 'recovery_support': return 'Recovery support';
    case 'medical_professional': return 'Medical professional';
    case 'user_insight': return 'Personal insight';
    case 'shift_working_hypothesis': return 'SHIFT working hypothesis';
    default: return 'Professional learning';
  }
}

function lifecycleLabel(lesson: ProfessionalLesson): string {
  if (lesson.supersededAt) return 'Superseded version';
  if (!lesson.active) return 'Archived';
  return 'Current';
}

function lessonDraft(lesson: ProfessionalLesson): EditDraft {
  return {
    title: lesson.title,
    lessonSummary: lesson.lessonSummary,
    triggerConditions: lesson.triggerConditions.join('\n'),
    newSkill: lesson.newSkill,
    replacementRule: lesson.replacementRule,
  };
}

function triggerList(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 8);
}

export const ProfessionalLearningPanel: React.FC = () => {
  const [lessons, setLessons] = useState<ProfessionalLesson[]>([]);
  const [accountRequired, setAccountRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/shift/therapy-lessons?includeHistory=1', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Professional learning is not available on this deployment yet.');
      const data = await response.json() as {
        lessons?: ProfessionalLesson[];
        accountRequired?: boolean;
      };
      setAccountRequired(data.accountRequired === true);
      setLessons(Array.isArray(data.lessons) ? data.lessons : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load professional learning.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const currentCount = useMemo(
    () => lessons.filter((lesson) => lesson.active && !lesson.supersededAt).length,
    [lessons],
  );
  const historicalCount = lessons.length - currentCount;
  const visibleLessons = showHistory
    ? lessons
    : lessons.filter((lesson) => lesson.active && !lesson.supersededAt);

  const beginEdit = (lesson: ProfessionalLesson) => {
    setEditingId(lesson.id);
    setDraft(lessonDraft(lesson));
    setExpandedId(lesson.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveRevision = async (lesson: ProfessionalLesson) => {
    if (!draft || busyId) return;
    const title = draft.title.replace(/\s+/g, ' ').trim();
    const lessonSummary = draft.lessonSummary.replace(/\s+/g, ' ').trim();
    if (!title || !lessonSummary) {
      setError('A professional lesson needs both a title and a summary.');
      return;
    }

    setBusyId(lesson.id);
    setError('');
    try {
      const response = await fetch('/api/shift/therapy-lessons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revise',
          lessonId: lesson.id,
          lesson: {
            title,
            lessonSummary,
            triggerConditions: triggerList(draft.triggerConditions),
            newSkill: draft.newSkill,
            replacementRule: draft.replacementRule,
          },
        }),
      });
      const data = await response.json() as { persisted?: boolean; accountRequired?: boolean; error?: string };
      if (data.accountRequired) {
        setAccountRequired(true);
        throw new Error('Sign-in account storage is required to revise professional learning.');
      }
      if (!response.ok || !data.persisted) throw new Error(data.error || 'Unable to save this revision.');
      cancelEdit();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this revision.');
    } finally {
      setBusyId(null);
    }
  };

  const archiveLesson = async (lesson: ProfessionalLesson) => {
    if (!window.confirm(`Archive “${lesson.title}” so SHIFT stops using it in future reflections?`)) return;
    setBusyId(lesson.id);
    setError('');
    try {
      const response = await fetch('/api/shift/therapy-lessons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', lessonId: lesson.id }),
      });
      const data = await response.json() as { persisted?: boolean; archived?: boolean; accountRequired?: boolean; error?: string };
      if (data.accountRequired) {
        setAccountRequired(true);
        throw new Error('Sign-in account storage is required to archive professional learning.');
      }
      if (!response.ok || !data.persisted || !data.archived) throw new Error(data.error || 'Unable to archive this lesson.');
      if (editingId === lesson.id) cancelEdit();
      await load();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive this lesson.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-indigo-500/20 bg-slate-900/75 p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300">
            <BookOpenCheck className="w-4 h-4" />
            <p className="text-[11px] font-mono uppercase tracking-[0.15em]">Professional learning</p>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">What I learned with professional support</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-3xl leading-relaxed">
            These are lessons you explicitly chose to remember from therapy, counseling, recovery support, or medical care. Editing creates a new version instead of silently rewriting the old one, and archiving stops a lesson from influencing future responses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Refresh professional learning"
          className="w-9 h-9 rounded-xl border border-slate-700 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 flex items-center justify-center shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      {error && <p className="mt-4 text-xs text-rose-300 rounded-xl border border-rose-500/20 bg-rose-950/20 p-3">{error}</p>}

      {!loading && accountRequired && (
        <div className="mt-5 rounded-2xl border border-indigo-500/25 bg-indigo-950/20 p-4">
          <p className="text-sm text-slate-200 font-semibold">Sign in to review professional learning across devices.</p>
          <p className="text-xs text-slate-400 mt-1">SHIFT does not silently create these records. A lesson appears here only after an explicit remember action.</p>
          <a href="/signin-with-chatgpt?return_to=/" className="inline-block mt-3 text-xs font-semibold text-indigo-300 hover:text-indigo-200 underline underline-offset-4">
            Sign in with ChatGPT
          </a>
        </div>
      )}

      {!loading && !accountRequired && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-950/35 border border-indigo-500/20 text-[10px] text-indigo-300">
              {currentCount} current
            </span>
            <button
              type="button"
              onClick={() => setShowHistory((value) => !value)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] text-slate-400 hover:text-slate-200"
            >
              <History className="w-3 h-3" />
              {showHistory ? 'Hide history' : `Show history (${historicalCount})`}
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {visibleLessons.length === 0 && (
              <p className="text-xs text-slate-500 py-4">No professional learning is saved in this view yet.</p>
            )}

            {visibleLessons.map((lesson) => {
              const expanded = expandedId === lesson.id;
              const editing = editingId === lesson.id && draft;
              const current = lesson.active && !lesson.supersededAt;
              return (
                <article key={lesson.id} className={`rounded-2xl border p-4 ${current ? 'border-indigo-500/20 bg-slate-950/55' : 'border-slate-800 bg-slate-950/30 opacity-80'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : lesson.id)}
                      className="min-w-0 text-left flex-1"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-indigo-300">{sourceLabel(lesson.sourceType)}</span>
                        <span className={`text-[9px] ${current ? 'text-emerald-400' : 'text-slate-500'}`}>• {lifecycleLabel(lesson)}</span>
                        {lesson.evidenceObserved.length > 0 && <span className="text-[9px] text-slate-500">• {lesson.evidenceObserved.length} evidence note{lesson.evidenceObserved.length === 1 ? '' : 's'}</span>}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-200 mt-1">{lesson.title}</h3>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{lesson.lessonSummary}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : lesson.id)}
                      aria-label={expanded ? 'Collapse lesson details' : 'Expand lesson details'}
                      className="w-8 h-8 rounded-lg border border-slate-800 text-slate-500 flex items-center justify-center shrink-0"
                    >
                      {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {expanded && !editing && (
                    <div className="mt-4 border-t border-slate-800 pt-3 space-y-2.5 text-xs">
                      {lesson.triggerConditions.length > 0 && (
                        <div><span className="text-slate-500">When it may apply:</span> <span className="text-slate-300">{lesson.triggerConditions.join('; ')}</span></div>
                      )}
                      {lesson.newSkill && <div><span className="text-slate-500">Practice:</span> <span className="text-slate-300">{lesson.newSkill}</span></div>}
                      {lesson.replacementRule && <div><span className="text-slate-500">Updated rule:</span> <span className="text-slate-300">{lesson.replacementRule}</span></div>}
                      <div className="text-[10px] text-slate-600">Updated {new Date(lesson.updatedAt).toLocaleDateString()} · Source attribution stays fixed across revisions.</div>

                      {current && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => beginEdit(lesson)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-500/25 text-[10px] text-indigo-300 hover:bg-indigo-950/25"
                          >
                            <Pencil className="w-3 h-3" /> Revise wording
                          </button>
                          <button
                            type="button"
                            onClick={() => void archiveLesson(lesson)}
                            disabled={busyId === lesson.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 text-[10px] text-slate-400 hover:text-rose-300 hover:border-rose-500/30"
                          >
                            {busyId === lesson.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3" />}
                            Archive
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {expanded && editing && draft && (
                    <div className="mt-4 border-t border-slate-800 pt-4 space-y-3">
                      <p className="text-[10px] text-slate-500">This saves a new user-confirmed version and preserves the old version in history.</p>
                      <label className="block text-[10px] text-slate-500">
                        Title
                        <input
                          value={draft.title}
                          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                          maxLength={120}
                          className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </label>
                      <label className="block text-[10px] text-slate-500">
                        Lesson summary
                        <textarea
                          value={draft.lessonSummary}
                          onChange={(event) => setDraft({ ...draft, lessonSummary: event.target.value })}
                          maxLength={700}
                          rows={3}
                          className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </label>
                      <label className="block text-[10px] text-slate-500">
                        When it applies · one trigger per line
                        <textarea
                          value={draft.triggerConditions}
                          onChange={(event) => setDraft({ ...draft, triggerConditions: event.target.value })}
                          rows={3}
                          className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </label>
                      <label className="block text-[10px] text-slate-500">
                        Practice
                        <textarea
                          value={draft.newSkill}
                          onChange={(event) => setDraft({ ...draft, newSkill: event.target.value })}
                          maxLength={600}
                          rows={2}
                          className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </label>
                      <label className="block text-[10px] text-slate-500">
                        Updated rule
                        <textarea
                          value={draft.replacementRule}
                          onChange={(event) => setDraft({ ...draft, replacementRule: event.target.value })}
                          maxLength={600}
                          rows={2}
                          className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => void saveRevision(lesson)}
                          disabled={busyId === lesson.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-[10px] font-semibold"
                        >
                          {busyId === lesson.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Save new version
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={busyId === lesson.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-[10px]"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};
