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
          // Only compact learning records are useful to the server. The retrieval
          // layer rejects raw CONFIRMED_FACT / USER_INTERPRETATION rows.
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

  const saveSuggestedMemory = () => {
    if (!memorySuggestion || memorySaved) return;
    const tags = memorySuggestion.tags?.length ? ` | tags: ${memorySuggestion.tags.join(', ')}` : '';
    addMemoryItem(
      memorySuggestion.type as any,
      `${memorySuggestion.label}: ${memorySuggestion.summary}${tags}`,
      'active',
      activeShift.id,
    );
    setMemorySaved(true);
    playSoftSound('complete');
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => setActiveTab('breakdown')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-300 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to breakdown
          </button>
          <div className="flex items-center gap-2 text-sky-300 text-xs font-mono uppercase tracking-wider">
            <MessageCircle className="w-4 h-4" /> Keep Talking
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mt-2">Stay with this before deciding what to do.</h1>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            SHIFT keeps the current breakdown underneath the conversation and can compare it with earlier learning when that history is genuinely relevant.
          </p>
        </div>
      </div>

      {memoryUsed.length > 0 && (
        <div className="mb-5 rounded-2xl border border-sky-500/20 bg-sky-950/20 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-300 mb-2">
            <Brain className="w-4 h-4" /> Earlier learning may be relevant
          </div>
          <p className="text-xs text-slate-400 mb-2">These are comparison points, not conclusions about the current situation.</p>
          <div className="flex flex-wrap gap-2">
            {memoryUsed.slice(0, 3).map((memory) => (
              <span key={memory} className="max-w-full truncate px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-300">
                {memory}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl overflow-hidden">
        <div className="min-h-[420px] max-h-[62vh] overflow-y-auto p-4 sm:p-6 space-y-4">
          {turns.map((turn, index) => (
            <div key={`${turn.role}-${index}`} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  turn.role === 'user'
                    ? 'bg-sky-500 text-slate-950 rounded-br-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-md'
                }`}
              >
                {turn.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-slate-950 border border-slate-800 text-slate-400 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" /> Staying with what you said…
              </div>
            </div>
          )}
        </div>

        {memorySuggestion && (
          <div className="mx-4 sm:mx-6 mb-4 rounded-2xl border border-sky-500/30 bg-sky-950/25 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Possible learning to remember
                </div>
                <p className="text-sm text-slate-200 mt-1"><strong>{memorySuggestion.label}:</strong> {memorySuggestion.summary}</p>
                <p className="text-[11px] text-slate-500 mt-1">Nothing is saved unless you choose to save it.</p>
              </div>
              <button
                type="button"
                onClick={saveSuggestedMemory}
                disabled={memorySaved}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-emerald-500 text-slate-950 text-xs font-bold"
              >
                {memorySaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {memorySaved ? 'Remembered' : 'Remember this'}
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-slate-800 bg-slate-950/70 p-3 sm:p-4">
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
              placeholder="Tell SHIFT what part still feels unfinished…"
              className="flex-1 resize-none rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="w-12 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setActiveTab('scenario-game')} className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-sky-500/60 hover:text-sky-300">Practice this</button>
            <button onClick={() => setActiveTab('prediction-lab')} className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-sky-500/60 hover:text-sky-300">Test a prediction</button>
            <button onClick={() => setActiveTab('therapy-prep')} className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-sky-500/60 hover:text-sky-300">Save for therapy</button>
          </div>
        </div>
      </div>
    </div>
  );
};
