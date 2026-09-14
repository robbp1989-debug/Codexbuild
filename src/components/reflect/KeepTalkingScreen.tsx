'use client';

import { activeContext } from '../../personalization/model';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Brain,
  Check,
  Leaf,
  LineChart,
  Loader2,
  MessageCircle,
  Save,
  Send,
  Sparkles,
} from 'lucide-react';
import { evaluateSafety } from '../../../server/safetyCheck';
import { useApp } from '../../context/AppContext';
import {
  buildContinuityArtifact,
  CONTINUITY_STORAGE_KEY,
  type StoredContinuityArtifact,
} from '../../../lib/continuity-artifact';

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  evidence?: {
    version: string;
    sources: Array<{ title: string; url: string; sourceType?: string }>;
  };
  responseMode?: 'model' | 'unavailable';
}

interface MemorySuggestion {
  type: string;
  label: string;
  summary: string;
  tags?: string[];
  confidence?: string;
}

interface TherapyLessonSuggestion {
  sourceType: 'therapist' | 'counselor' | 'recovery_support' | 'medical_professional';
  title: string;
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
  sensitivityLevel: 'low' | 'medium' | 'high';
}

interface TherapyLessonUsed {
  id: string;
  title: string;
  sourceType: string;
}

type TherapySaveState = 'idle' | 'saving' | 'saved' | 'account_required' | 'error';

function safeResearchUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function sourceLabel(source: string): string {
  switch (source) {
    case 'therapist': return 'therapist';
    case 'counselor': return 'counselor';
    case 'recovery_support': return 'recovery support';
    case 'medical_professional': return 'medical professional';
    default: return 'professional support';
  }
}

export const KeepTalkingScreen: React.FC = () => {
  const {
    activeShift,
    memoryItems,
    addMemoryItem,
    setActiveTab,
    setCrisisInterruption,
    playSoftSound,
    personalContext,
    approvedSummary,
  } = useApp();

  const initialMessage = useMemo(() => {
    if (!activeShift) return '';
    return activeShift.follow_up_question || 'What part of this feels most important to stay with right now?';
  }, [activeShift]);

  const [turns, setTurns] = useState<ConversationTurn[]>(() =>
    initialMessage ? [{ role: 'assistant', content: initialMessage }] : [],
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [memorySuggestion, setMemorySuggestion] = useState<MemorySuggestion | null>(null);
  const [memorySaved, setMemorySaved] = useState(false);
  const [memoryUsed, setMemoryUsed] = useState<string[]>([]);
  const [therapyLessonsUsed, setTherapyLessonsUsed] = useState<TherapyLessonUsed[]>([]);
  const [therapyLessonSuggestion, setTherapyLessonSuggestion] = useState<TherapyLessonSuggestion | null>(null);
  const [therapyLessonSaveState, setTherapyLessonSaveState] = useState<TherapySaveState>('idle');
  const [offerContinuity, setOfferContinuity] = useState(false);
  const [continuitySaved, setContinuitySaved] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [turns.length, loading]);

  if (!activeShift) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <MessageCircle className="w-10 h-10 mx-auto text-sky-400 mb-4" />
        <h1 className="text-2xl font-semibold text-slate-100">Start with a reflection first</h1>
        <p className="text-sm text-slate-400 mt-2 mb-6">Keep Talking stays connected to one specific Shift breakdown.</p>
        <button onClick={() => setActiveTab('home')} className="px-5 py-2.5 rounded-xl bg-sky-500 text-slate-950 font-semibold">
          Start a reflection
        </button>
      </div>
    );
  }

  const perspectiveText = (
    activeShift.userEditedPerspective ||
    activeShift.updated_perspective ||
    activeShift.userEditedInterpretation ||
    activeShift.interpretation ||
    'We can separate what is known in the present from what your mind is predicting.'
  ).trim();
  const perspectiveSentences = perspectiveText.split(/(?<=[.!?])\s+/).filter(Boolean);
  const perspectiveHeadline = perspectiveSentences[0] || 'A more current perspective.';
  const perspectiveBody = perspectiveSentences.slice(1).join(' ');

  const saveContinuityArtifact = async () => {
    const professionalLesson = therapyLessonsUsed[0]
      ? `${therapyLessonsUsed[0].title} (${sourceLabel(therapyLessonsUsed[0].sourceType)})`
      : undefined;
    const artifact = buildContinuityArtifact({
      currentShift: activeShift as unknown as Record<string, unknown>,
      history: turns.map((turn) => ({ role: turn.role, content: turn.content })),
      relevantMemory: memoryUsed,
      professionalLesson,
    });
    const record: StoredContinuityArtifact = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      shiftId: activeShift.id,
      artifact,
    };

    try {
      const existing = JSON.parse(localStorage.getItem(CONTINUITY_STORAGE_KEY) || '[]') as StoredContinuityArtifact[];
      const next = [record, ...(Array.isArray(existing) ? existing : [])].slice(0, 20);
      localStorage.setItem(CONTINUITY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Account persistence below may still succeed when browser storage is unavailable.
    }

    try {
      await fetch('/api/shift/continuity/remember', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceShiftId: activeShift.id, artifact }),
      });
    } catch {
      // Local continuity remains available when account storage is unavailable.
    }

    setContinuitySaved(true);
    playSoftSound('complete');
    setActiveTab('therapy-prep');
  };

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || loading) return;
    const safety = evaluateSafety(message);
    if (safety.isCrisis) {
      setCrisisInterruption({ isOpen: true, type: safety.crisisType, message: safety.crisisMessage });
      return;
    }

    playSoftSound('tap');
    const nextTurns: ConversationTurn[] = [...turns, { role: 'user', content: message }];
    setTurns(nextTurns);
    setInput('');
    setLoading(true);
    setMemorySuggestion(null);
    setMemorySaved(false);
    setTherapyLessonSuggestion(null);
    setTherapyLessonSaveState('idle');
    setOfferContinuity(false);
    setContinuitySaved(false);

    try {
      const response = await fetch('/api/shift/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalContext: activeContext(personalContext),
          approvedSummary,
          message,
          currentShift: activeShift,
          history: turns.slice(-8),
          memoryItems: memoryItems.slice(0, 80),
        }),
      });
      if (!response.ok) throw new Error('Conversation request failed');

      const data = await response.json() as {
        safetyInterruption?: boolean;
        crisisType?: string;
        crisisMessage?: string;
        reply?: string;
        evidence?: ConversationTurn['evidence'];
        relevantMemory?: string[];
        memorySuggestion?: MemorySuggestion | null;
        therapyLessonSuggestion?: TherapyLessonSuggestion | null;
        therapyLessonsUsed?: TherapyLessonUsed[];
        responseMode?: 'model' | 'unavailable';
        offerContinuity?: boolean;
      };

      if (data.safetyInterruption) {
        setCrisisInterruption({ isOpen: true, type: data.crisisType, message: data.crisisMessage });
        return;
      }

      const reply = data.reply || 'What part of that feels most important to name before we explain it?';
      setTurns((current) => [...current, {
        role: 'assistant',
        content: reply,
        evidence: data.responseMode === 'model' ? data.evidence : undefined,
        responseMode: data.responseMode,
      }]);
      setMemoryUsed(data.responseMode === 'model' && Array.isArray(data.relevantMemory) ? data.relevantMemory : []);
      setMemorySuggestion(data.responseMode === 'model' ? data.memorySuggestion || null : null);
      setTherapyLessonsUsed(data.responseMode === 'model' && Array.isArray(data.therapyLessonsUsed) ? data.therapyLessonsUsed : []);
      setTherapyLessonSuggestion(data.responseMode === 'model' ? data.therapyLessonSuggestion || null : null);
      setOfferContinuity(data.responseMode === 'model' && data.offerContinuity === true);
      playSoftSound('chime');
    } catch {
      setTurns((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'The live conversation could not be reached, so SHIFT cannot give you a reliable response to this message yet. Your message remains visible above; please try again in a moment.',
          responseMode: 'unavailable',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveSuggestedMemory = async () => {
    if (!memorySuggestion || memorySaved) return;
    setMemorySaved(true);

    const tags = memorySuggestion.tags?.length ? ` | tags: ${memorySuggestion.tags.join(', ')}` : '';
    addMemoryItem(
      memorySuggestion.type as any,
      `${memorySuggestion.label}: ${memorySuggestion.summary}${tags}`,
      'active',
      activeShift.id,
    );

    try {
      await fetch('/api/shift/memory/remember', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: activeShift.id, memory: memorySuggestion }),
      });
    } catch {
      // Device memory remains available if account persistence is temporarily offline.
    }

    playSoftSound('complete');
  };

  const saveTherapyLesson = async () => {
    if (!therapyLessonSuggestion || therapyLessonSaveState === 'saving' || therapyLessonSaveState === 'saved') return;
    setTherapyLessonSaveState('saving');
    try {
      const response = await fetch('/api/shift/therapy-lessons/remember', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(therapyLessonSuggestion),
      });
      if (!response.ok) throw new Error('Unable to save professional lesson');
      const data = await response.json() as { persisted?: boolean; accountRequired?: boolean };
      if (data.persisted) {
        setTherapyLessonSaveState('saved');
        playSoftSound('complete');
      } else if (data.accountRequired) {
        setTherapyLessonSaveState('account_required');
      } else {
        setTherapyLessonSaveState('error');
      }
    } catch {
      setTherapyLessonSaveState('error');
    }
  };

  return (
    <div className="keep-talking-immersive">
      <aside className="keep-talking-perspective" aria-live="polite" aria-label="Current SHIFT perspective">
        <div className="keep-talking-perspective__eyebrow"><Sparkles className="w-4 h-4" /> Perspective shift</div>
        <h2>{perspectiveHeadline}</h2>
        {perspectiveBody && <p className="keep-talking-perspective__answer">{perspectiveBody}</p>}
        <p className="keep-talking-perspective__note">A working reflection, not a verdict about you or anyone else.</p>

        {therapyLessonsUsed.length > 0 && (
          <div className="keep-talking-perspective__memory">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Bookmark className="w-4 h-4" /> Earlier professional learning may be relevant
            </div>
            <p>User-confirmed learning is being used as a comparison point, not as proof that this situation is the same.</p>
            <div className="keep-talking-perspective__memory-list">
              {therapyLessonsUsed.slice(0, 3).map((lesson) => (
                <span key={lesson.id}>{lesson.title} · {sourceLabel(lesson.sourceType)}</span>
              ))}
            </div>
          </div>
        )}

        {memoryUsed.length > 0 && (
          <div className="keep-talking-perspective__memory">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Brain className="w-4 h-4" /> Earlier learning may be relevant
            </div>
            <p>Comparison evidence only — not proof that the present situation means the same thing.</p>
            <div className="keep-talking-perspective__memory-list">
              {memoryUsed.slice(0, 3).map((memory) => <span key={memory}>{memory}</span>)}
            </div>
          </div>
        )}

        <div className="keep-talking-perspective__footer">
          <Leaf className="w-5 h-5" aria-hidden="true" />
          <span>Greater understanding creates more choice.</span>
        </div>
      </aside>

      <section className="keep-talking-dialogue" aria-labelledby="keep-talking-title">
        <div className="keep-talking-dialogue__header">
          <button
            onClick={() => setActiveTab('breakdown')}
            className="keep-talking-back-button inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-600 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to breakdown
          </button>
          <div className="keep-talking-section-label flex items-center gap-2 text-sky-600 text-xs font-mono uppercase tracking-wider">
            <MessageCircle className="w-4 h-4" /> Keep Talking
          </div>
          <h1 id="keep-talking-title" className="text-2xl sm:text-3xl font-bold mt-2">Stay with this before solving it</h1>
          <p className="text-sm mt-2 max-w-2xl text-slate-600">
            This is a space to explore what’s underneath. There’s no rush — we can look at this together.
          </p>
        </div>

        <div ref={threadRef} className="keep-talking-thread" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation history">
          {turns.map((turn, index) => (
            <div key={`${turn.role}-${index}`} className={`keep-talking-turn keep-talking-turn--${turn.role}`}>
              <div className="keep-talking-turn__label">{turn.role === 'user' ? 'You' : 'SHIFT'}</div>
              <div className="keep-talking-turn__body">{turn.content}</div>
              {turn.responseMode === 'unavailable' && (
                <output className="mt-3 block rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  No AI-generated interpretation was returned for this message.
                </output>
              )}
              {turn.evidence && <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-medium">Research context for this response</summary>
                <p className="mt-2">These sources support external factual claims only. They do not verify personal interpretations, motives, diagnoses, or what another person or animal subjectively intended.</p>
                {turn.evidence.sources.length === 0 && <p className="mt-2">No source-backed factual claim was selected; this response should remain exploratory.</p>}
                {turn.evidence.sources.slice(0, 8).map((source) => {
                  const href = safeResearchUrl(source.url);
                  if (!href) return null;
                  return <a key={source.url} href={href} target="_blank" rel="noreferrer" className="mt-2 block text-blue-700 underline">{source.title}</a>;
                })}
              </details>}
            </div>
          ))}
          {loading && (
            <div className="keep-talking-turn keep-talking-turn--assistant keep-talking-turn--loading">
              <div className="keep-talking-turn__label">SHIFT</div>
              <div className="keep-talking-turn__body flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-sky-500" /> Staying with what you said…</div>
            </div>
          )}
        </div>

        {therapyLessonSuggestion && (
          <div className="keep-talking-memory-suggestion" aria-live="polite">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-sky-700 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" /> Professional lesson you may want to remember
                </div>
                <p className="text-sm mt-1"><strong>{therapyLessonSuggestion.title}:</strong> {therapyLessonSuggestion.lessonSummary}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  SHIFT detected this only because you explicitly attributed the lesson to {sourceLabel(therapyLessonSuggestion.sourceType)}. Nothing is saved unless you choose to save it.
                </p>
                {therapyLessonSaveState === 'account_required' && <p className="text-[11px] text-amber-700 mt-1">Sign-in account storage is required to keep professional lessons across devices.</p>}
                {therapyLessonSaveState === 'error' && <p className="text-[11px] text-amber-700 mt-1">This lesson could not be saved right now.</p>}
              </div>
              <button
                type="button"
                onClick={() => void saveTherapyLesson()}
                disabled={therapyLessonSaveState === 'saving' || therapyLessonSaveState === 'saved'}
                className="keep-talking-remember-button"
              >
                {therapyLessonSaveState === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : therapyLessonSaveState === 'saved' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {therapyLessonSaveState === 'saved' ? 'Lesson remembered' : therapyLessonSaveState === 'saving' ? 'Saving…' : 'Remember lesson'}
              </button>
            </div>
          </div>
        )}

        {memorySuggestion && (
          <div className="keep-talking-memory-suggestion">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-sky-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Possible learning to remember
                </div>
                <p className="text-sm mt-1"><strong>{memorySuggestion.label}:</strong> {memorySuggestion.summary}</p>
                <p className="text-[11px] text-slate-500 mt-1">Nothing is saved unless you choose to save it.</p>
              </div>
              <button
                type="button"
                onClick={() => void saveSuggestedMemory()}
                disabled={memorySaved}
                className="keep-talking-remember-button"
              >
                {memorySaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {memorySaved ? 'Remembered' : 'Remember this'}
              </button>
            </div>
          </div>
        )}

        {offerContinuity && !continuitySaved && (
          <div className="keep-talking-memory-suggestion" aria-live="polite">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-sky-700 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" /> Carry this into the next session
                </div>
                <p className="text-sm mt-1">This exchange contains enough new learning to make a short professional-continuity note useful.</p>
                <p className="text-[11px] text-slate-500 mt-1">The note keeps facts, interpretations, working hypotheses, professional learning, experiments, outcomes, and open questions separate.</p>
              </div>
              <button type="button" onClick={() => void saveContinuityArtifact()} className="keep-talking-remember-button">
                <Save className="w-4 h-4" /> Save this for my next session
              </button>
            </div>
          </div>
        )}

        <div className="keep-talking-composer">
          <div className="keep-talking-composer-row flex gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              disabled={loading}
              rows={2}
              aria-label="Your message to SHIFT"
              placeholder="What’s on your mind right now?"
              className="keep-talking-composer__input"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="keep-talking-send-button"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>Send</span>
            </button>
          </div>
          <div className="keep-talking-secondary-row mt-3 flex flex-wrap gap-2">
            <button onClick={() => setActiveTab('scenario-game')} className="keep-talking-secondary-action">
              <Leaf className="w-4 h-4" aria-hidden="true" />
              <span>Practice this</span>
            </button>
            <button onClick={() => setActiveTab('prediction-lab')} className="keep-talking-secondary-action">
              <LineChart className="w-4 h-4" aria-hidden="true" />
              <span>Test a prediction</span>
            </button>
            <button onClick={() => void saveContinuityArtifact()} className="keep-talking-secondary-action">
              <Bookmark className="w-4 h-4" aria-hidden="true" />
              <span>Save for therapy</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
