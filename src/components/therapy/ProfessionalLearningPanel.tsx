'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, BookOpenCheck, Check, History, Loader2, Pencil, Save, X } from 'lucide-react';

type LessonSource =
  | 'therapist'
  | 'counselor'
  | 'recovery_support'
  | 'medical_professional'
  | 'user_insight'
  | 'shift_working_hypothesis';

interface ReviewLesson {
  id: string;
  title: string;
  sourceType: LessonSource;
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
  newSkill: string;
  replacementRule: string;
  desiredExperiment: string;
}

function sourceLabel(source: LessonSource): string {
  switch (source) {
    case 'therapist': return 'Therapist';
    case 'counselor': return 'Counselor';
    case 'recovery_support': return 'Recovery support';
    case 'medical_professional': return 'Medical professional';
    case 'user_insight': return 'Your insight';
    default: return 'SHIFT working hypothesis';
  }
}

function toDraft(lesson: ReviewLesson): EditDraft {
  return {
    title: lesson.title,
    lessonSummary: lesson.lessonSummary,
    newSkill: lesson.newSkill,
    replacementRule: lesson.replacementRule,
    desiredExperiment: lesson.desiredExperiment,
  };
}

export const ProfessionalLearningPanel: React.FC = () => {
  const [lessons, setLessons] = useState<ReviewLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountRequired, setAccountRequired] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [archiveCandidateId, setArchiveCandidateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const loadLessons = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/shift/therapy-lessons?includeHistory=1', {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Professional learning could not be loaded.');
      const data = await response.json() as {
        lessons?: ReviewLesson[];
        accountRequired?: boolean;
      };
      setAccountRequired(data.accountRequired === true);
      setLessons(Array.isArray(data.lessons) ? data.lessons : []);
    } catch {
      setNotice('Professional learning is temporarily unavailable. Your therapy prep note still works.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLessons();
  }, [loadLessons]);

  const activeLessons = useMemo(() => lessons.filter((lesson) => lesson.active && !lesson.supersededAt), [lessons]);
  const historyLessons = useMemo(() => lessons.filter((lesson) => !lesson.active || Boolean(lesson.supersededAt)), [lessons]);

  const startEditing = (lesson: ReviewLesson) => {
    setEditingId(lesson.id);
    setDraft(toDraft(lesson));
    setArchiveCandidateId(null);
    setNotice('');
  };

  const saveRevision = async (lesson: ReviewLesson) => {
    if (!draft || saving) return;
    const title = draft.title.trim();
    const lessonSummary = draft.lessonSummary.trim();
    if (!title || !lessonSummary) {
      setNotice('A title and lesson summary are required.');
      return;
    }
    setSaving(true);
    setNotice('');
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
            newSkill: draft.newSkill,
            replacementRule: draft.replacementRule,
            desiredExperiment: draft.desiredExperiment,
          },
        }),
      });
      const data = await response.json() as { persisted?: boolean; accountRequired?: boolean; error?: string };
      if (data.accountRequired) {
        setAccountRequired(true);
        setNotice('Sign-in account storage is required to revise professional learning across devices.');
        return;
      }
      if (!response.ok || !data.persisted) throw new Error(data.error || 'Revision could not be saved.');
      setEditingId(null);
      setDraft(null);
      setNotice('Revision saved. The previous version was retained as superseded history.');
      await loadLessons();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Revision could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const archiveLesson = async (lessonId: string) => {
    if (saving) return;
    setSaving(true);
    setNotice('');
    try {
      const response = await fetch('/api/shift/therapy-lessons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', lessonId }),
      });
      const data = await response.json() as { persisted?: boolean; accountRequired?: boolean; error?: string };
      if (data.accountRequired) {
        setAccountRequired(true);
        setNotice('Sign-in account storage is required to archive professional learning across devices.');
        return;
      }
      if (!response.ok || !data.persisted) throw new Error(data.error || 'Lesson could not be archived.');
      setArchiveCandidateId(null);
      setEditingId(null);
      setDraft(null);
      setNotice('Lesson archived. SHIFT will no longer use it as active professional learning.');
      await loadLessons();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Lesson could not be archived.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-indigo-500/20 bg-indigo-950/10 p-4 sm:p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl border border-indigo-400/25 bg-indigo-500/10 text-indigo-300 flex items-center justify-center shrink-0">
          <BookOpenCheck className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-indigo-300">Professional learning</p>
          <h2 className="text-sm sm:text-base font-bold text-slate-100 mt-1">Review what SHIFT carries forward from professional support</h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            These are lessons you explicitly chose to remember. You can revise or archive them. A revision creates a new current version while retaining the prior wording as history; the original source attribution is preserved.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading professional learning…
        </div>
      )}

      {!loading && accountRequired && (
        <p className="rounded-xl border border-amber-500/20 bg-amber-950/15 px-3 py-2 text-xs text-amber-200">
          Sign in with ChatGPT to review and manage professional learning saved to your account.
        </p>
      )}

      {notice && (
        <output className="block rounded-xl border border-sky-500/20 bg-sky-950/15 px-3 py-2 text-xs text-sky-100">
          {notice}
        </output>
      )}

      {!loading && !accountRequired && activeLessons.length === 0 && (
        <p className="text-xs text-slate-500">No active professional lessons are saved yet. Lessons appear here only after you explicitly choose “Remember lesson.”</p>
      )}

      <div className="space-y-3">
        {activeLessons.map((lesson) => {
          const editing = editingId === lesson.id && draft;
          const confirmingArchive = archiveCandidateId === lesson.id;
          return (
            <article key={lesson.id} className="rounded-xl border border-slate-800 bg-slate-950/55 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-indigo-300">{sourceLabel(lesson.sourceType)}</span>
                    <span className="text-[9px] text-slate-600">user-confirmed</span>
                  </div>
                  {!editing && <h3 className="text-sm font-semibold text-slate-100 mt-1">{lesson.title}</h3>}
                </div>
                {!editing && !confirmingArchive && (
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => startEditing(lesson)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px] text-slate-300 hover:border-indigo-500/40">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button type="button" onClick={() => { setArchiveCandidateId(lesson.id); setNotice(''); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px] text-slate-400 hover:border-amber-500/40 hover:text-amber-300">
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                  </div>
                )}
              </div>

              {editing ? (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-500">Editing creates a new version. Source remains <strong className="text-slate-300">{sourceLabel(lesson.sourceType)}</strong>.</p>
                  <label className="block">
                    <span className="text-slate-400 block mb-1">Lesson title</span>
                    <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500" />
                  </label>
                  <label className="block">
                    <span className="text-slate-400 block mb-1">What I learned</span>
                    <textarea rows={3} value={draft.lessonSummary} onChange={(event) => setDraft({ ...draft, lessonSummary: event.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 resize-none focus:outline-none focus:border-indigo-500" />
                  </label>
                  <label className="block">
                    <span className="text-slate-400 block mb-1">Skill / practice</span>
                    <textarea rows={2} value={draft.newSkill} onChange={(event) => setDraft({ ...draft, newSkill: event.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 resize-none focus:outline-none focus:border-indigo-500" />
                  </label>
                  <label className="block">
                    <span className="text-slate-400 block mb-1">Updated rule</span>
                    <textarea rows={2} value={draft.replacementRule} onChange={(event) => setDraft({ ...draft, replacementRule: event.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 resize-none focus:outline-none focus:border-indigo-500" />
                  </label>
                  <label className="block">
                    <span className="text-slate-400 block mb-1">Experiment to try</span>
                    <textarea rows={2} value={draft.desiredExperiment} onChange={(event) => setDraft({ ...draft, desiredExperiment: event.target.value })} className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 resize-none focus:outline-none focus:border-indigo-500" />
                  </label>
                  <div className="flex justify-end gap-2">
                    <button type="button" disabled={saving} onClick={() => { setEditingId(null); setDraft(null); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button type="button" disabled={saving || !draft.title.trim() || !draft.lessonSummary.trim()} onClick={() => void saveRevision(lesson)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save revision
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <p className="text-slate-300 leading-relaxed">{lesson.lessonSummary}</p>
                  {lesson.newSkill && <p className="text-slate-500"><strong className="text-slate-400">Practice:</strong> {lesson.newSkill}</p>}
                  {lesson.replacementRule && <p className="text-slate-500"><strong className="text-slate-400">Updated rule:</strong> {lesson.replacementRule}</p>}
                  {lesson.desiredExperiment && <p className="text-slate-500"><strong className="text-slate-400">Experiment:</strong> {lesson.desiredExperiment}</p>}
                </div>
              )}

              {confirmingArchive && !editing && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-950/15 p-3 text-xs">
                  <p className="text-amber-100 font-semibold">Archive this lesson?</p>
                  <p className="text-slate-500 mt-1">SHIFT will stop retrieving it for future reflections. The record remains in history rather than being rewritten.</p>
                  <div className="flex justify-end gap-2 mt-3">
                    <button type="button" disabled={saving} onClick={() => setArchiveCandidateId(null)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">Cancel</button>
                    <button type="button" disabled={saving} onClick={() => void archiveLesson(lesson.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />} Archive lesson
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {!loading && historyLessons.length > 0 && (
        <details className="rounded-xl border border-slate-800 bg-slate-950/35 p-3">
          <summary className="cursor-pointer text-xs font-semibold text-slate-400 flex items-center gap-2">
            <History className="w-3.5 h-3.5" /> Previous versions and archived lessons ({historyLessons.length})
          </summary>
          <div className="mt-3 space-y-2">
            {historyLessons.slice(0, 20).map((lesson) => (
              <div key={lesson.id} className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-600" />
                  <span className="font-semibold text-slate-400">{lesson.title}</span>
                  <span className="text-[9px] font-mono uppercase text-slate-600">{lesson.supersededAt ? 'superseded' : 'archived'}</span>
                  <span className="text-[9px] text-slate-600">{sourceLabel(lesson.sourceType)}</span>
                </div>
                <p className="text-slate-600 mt-1.5 leading-relaxed">{lesson.lessonSummary}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
};
