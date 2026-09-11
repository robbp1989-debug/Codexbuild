'use client';

import React, { useMemo, useState } from 'react';
import { ArrowLeft, Brain, Check, Loader2, MessageCircle, Save, Send, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface MemorySuggestion {
  type: string;
  label: string;
  summary: string;
  tags?: string[];
  confidence?: string;
}

export const KeepTalkingScreen: React.FC = () => {
  const {
    activeShift,
    memoryItems,
    addMemoryItem,
    setActiveTab,
    setCrisisInterruption,
    playSoftSound,
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

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || loading) return;

    playSoftSound('tap');
    const nextTurns: ConversationTurn[] = [...turns, { role: 'user', content: message }];
    setTurns(nextTurns);
    setInput('');
    setLoading(true);
    setMemorySuggestion(null);
    setMemorySaved(false);

    try {
      const response = await fetch('/api/shift/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          currentShift: activeShift,
          history: turns.slice(-8),
          // The server prefers authenticated account memory and uses these compact
          // device memories only as migration/fallback context.
          memoryItems: memoryItems.slice(0, 80),
        }),
      });
      if (!response.ok) throw new Error('Conversation request failed');

      const data = await response.json() as {
        safetyInterruption?: boolean;
        crisisType?: string;
        crisisMessage?: string;
        reply?: string;
        relevantMemory?: string[];
        memorySuggestion?: MemorySuggestion | null;
      };

      if (data.safetyInterruption) {
        setCrisisInterruption({ isOpen: true, type: data.crisisType, message: data.crisisMessage });
        return;
      }

      const reply = data.reply || 'What part of that feels most important to name before we explain it?';
      setTurns((current) => [...current, { role: 'assistant', content: reply }]);
      setMemoryUsed(Array.isArray(data.relevantMemory) ? data.relevantMemory : []);
      setMemorySuggestion(data.memorySuggestion || null);
      playSoftSound('chime');
    } catch {
      setTurns((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'We can stay with this. What part is bothering you most right now — what happened, what you felt, what you think it meant, or what you wanted instead?',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveSuggestedMemory = async () => {
    if (!memorySuggestion || memorySaved) return;
    setMemorySaved(true);

    // Keep a device copy immediately, and also persist to the authenticated D1
    // account when available. The server never saves a model suggestion before
    // this explicit user action.
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

  return (
    <div className="keep-talking-immersive">
      <aside className="keep-talking-perspective" aria-live="polite" aria-label="Current SHIFT perspective">
        <div className="keep-talking-perspective__eyebrow"><Sparkles className="w-4 h-4" /> Perspective shift</div>
        <h2>{perspectiveHeadline}</h2>
        {perspectiveBody && <p className="keep-talking-perspective__answer">{perspectiveBody}</p>}
        <p className="keep-talking-perspective__note">A working reflection, not a verdict about you or anyone else.</p>

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

        <div className="keep-talking-perspective__footer">Greater understanding creates more choice.</div>
      </aside>

      <section className="keep-talking-dialogue" aria-labelledby="keep-talking-title">
        <div className="keep-talking-dialogue__header">
          <button
            onClick={() => setActiveTab('breakdown')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-600 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to breakdown
          </button>
          <div className="flex items-center gap-2 text-sky-600 text-xs font-mono uppercase tracking-wider">
            <MessageCircle className="w-4 h-4" /> Keep Talking
          </div>
          <h1 id="keep-talking-title" className="text-2xl sm:text-3xl font-bold mt-2">Stay with this before solving it</h1>
          <p className="text-sm mt-2 max-w-2xl text-slate-600">
            This is a space to explore what’s underneath. There’s no rush — we can look at this together.
          </p>
        </div>

        <div className="keep-talking-thread" aria-label="Conversation history">
          {turns.map((turn, index) => (
            <div key={`${turn.role}-${index}`} className={`keep-talking-turn keep-talking-turn--${turn.role}`}>
              <div className="keep-talking-turn__label">{turn.role === 'user' ? 'You' : 'SHIFT'}</div>
              <div className="keep-talking-turn__body">{turn.content}</div>
            </div>
          ))}
          {loading && (
            <div className="keep-talking-turn keep-talking-turn--assistant keep-talking-turn--loading">
              <div className="keep-talking-turn__label">SHIFT</div>
              <div className="keep-talking-turn__body flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-sky-500" /> Staying with what you said…</div>
            </div>
          )}
        </div>

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

        <div className="keep-talking-composer">
          <div className="flex gap-2">
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
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setActiveTab('scenario-game')} className="keep-talking-secondary-action">Practice this</button>
            <button onClick={() => setActiveTab('prediction-lab')} className="keep-talking-secondary-action">Test a prediction</button>
            <button onClick={() => setActiveTab('therapy-prep')} className="keep-talking-secondary-action">Save for therapy</button>
          </div>
        </div>
      </section>
    </div>
  );
};
