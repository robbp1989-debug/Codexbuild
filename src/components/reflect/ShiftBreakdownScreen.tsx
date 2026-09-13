'use client';

import { EvidencePanel } from '../../second-brain/EvidencePanel';
import React, { useEffect, useMemo, useState } from 'react';
import { Check, CheckCircle2, Edit3, Save, Sparkles, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ShiftBreakdown } from '../../types';

const COMMON_NEEDS = [
  'safety',
  'connection',
  'respect',
  'predictability',
  'autonomy',
  'fairness',
  'acceptance',
  'being heard',
  'control',
  'competence',
  'belonging',
  'relief',
];

const editableTextClass =
  'w-full min-h-24 resize-y rounded-2xl border border-sky-200 bg-white/90 px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100';

const cardClass =
  'rounded-[24px] border border-sky-200/80 bg-white/82 p-5 sm:p-6 shadow-[0_14px_42px_rgba(38,74,101,0.08)] backdrop-blur-xl';

export const ShiftBreakdownScreen: React.FC = () => {
  const {
    activeShift,
    saveShiftBreakdown,
    updateShiftBreakdown,
    setActiveTab,
    playSoftSound,
  } = useApp();

  const [editingObservation, setEditingObservation] = useState(false);
  const [editingInterpretation, setEditingInterpretation] = useState(false);
  const [editingHypothesis, setEditingHypothesis] = useState(false);
  const [editingPerspective, setEditingPerspective] = useState(false);
  const [obsText, setObsText] = useState('');
  const [interpText, setInterpText] = useState('');
  const [hypoText, setHypoText] = useState('');
  const [perspText, setPerspText] = useState('');
  const [customEmotionInput, setCustomEmotionInput] = useState('');
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    if (!activeShift) return;
    setObsText(activeShift.userEditedObservation || activeShift.observation || '');
    setInterpText(activeShift.userEditedInterpretation || activeShift.interpretation || '');
    setHypoText(activeShift.userEditedHypothesis || activeShift.protective_rule_hypothesis || '');
    setPerspText(activeShift.userEditedPerspective || activeShift.updated_perspective || '');
    setEditingObservation(false);
    setEditingInterpretation(false);
    setEditingHypothesis(false);
    setEditingPerspective(false);
  }, [activeShift?.id]);

  const needOptions = useMemo(() => {
    const suggestions = activeShift?.possible_needs || [];
    const confirmed = activeShift?.confirmed_needs || [];
    return Array.from(new Set([...suggestions, ...confirmed, ...COMMON_NEEDS]));
  }, [activeShift?.possible_needs, activeShift?.confirmed_needs]);

  if (!activeShift) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-3xl border border-sky-200 bg-white/85 p-8 shadow-xl backdrop-blur-xl">
          <Sparkles className="mx-auto mb-4 h-9 w-9 text-sky-500" />
          <h2 className="text-2xl font-semibold text-slate-900">Start with a reflection first</h2>
          <p className="mt-2 text-sm text-slate-600">Describe one real moment so SHIFT has something specific to work with.</p>
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="mt-6 rounded-xl bg-sky-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
          >
            Go to reflection
          </button>
        </div>
      </div>
    );
  }

  const confirmedEmotions = activeShift.confirmed_emotions || [];
  const confirmedNeeds = activeShift.confirmed_needs || [];

  const toggleEmotion = (emotion: string) => {
    playSoftSound('tap');
    const next = confirmedEmotions.includes(emotion)
      ? confirmedEmotions.filter((item) => item !== emotion)
      : [...confirmedEmotions, emotion];
    updateShiftBreakdown(activeShift.id, { confirmed_emotions: next });
  };

  const addCustomEmotion = () => {
    const emotion = customEmotionInput.trim();
    if (!emotion) return;
    playSoftSound('tap');
    const possible = activeShift.possible_emotions || [];
    updateShiftBreakdown(activeShift.id, {
      possible_emotions: possible.includes(emotion) ? possible : [...possible, emotion],
      confirmed_emotions: confirmedEmotions.includes(emotion) ? confirmedEmotions : [...confirmedEmotions, emotion],
    });
    setCustomEmotionInput('');
  };

  const toggleNeed = (need: string) => {
    playSoftSound('tap');
    const next = confirmedNeeds.includes(need)
      ? confirmedNeeds.filter((item) => item !== need)
      : [...confirmedNeeds, need];
    updateShiftBreakdown(activeShift.id, { confirmed_needs: next });
  };

  const setHypothesisStatus = (status: 'accepted' | 'rejected') => {
    playSoftSound('chime');
    updateShiftBreakdown(activeShift.id, { hypothesisUserStatus: status });
  };

  const savePreference = (preference: 'remember' | 'session_only' | 'dont_save') => {
    playSoftSound(preference === 'remember' ? 'complete' : 'tap');
    const updated: ShiftBreakdown = {
      ...activeShift,
      savePreference: preference,
      isSavedToProfile: preference === 'remember',
      userEditedObservation: obsText,
      userEditedInterpretation: interpText,
      userEditedHypothesis: hypoText,
      userEditedPerspective: perspText,
    };
    saveShiftBreakdown(updated);
    setSavedBanner(true);
    window.setTimeout(() => setSavedBanner(false), 2600);
  };

  const editButton = (editing: boolean, setEditing: React.Dispatch<React.SetStateAction<boolean>>) => (
    <button
      type="button"
      onClick={() => setEditing(!editing)}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
    >
      <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
      {editing ? 'Done' : 'Edit'}
    </button>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:py-8">
      <section className="rounded-[30px] border border-sky-200/80 bg-white/76 p-5 shadow-[0_28px_80px_rgba(35,67,91,0.14)] backdrop-blur-2xl sm:p-7" aria-labelledby="shift-breakdown-title">
        <header className="mb-5 border-b border-sky-100 pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600">Personalized reflection</p>
          <h1 id="shift-breakdown-title" className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Your SHIFT breakdown</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            Review what fits. SHIFT separates what happened, what you felt, the meaning your mind added, what the response may be trying to do, and what you can choose today.
          </p>
        </header>

        <EvidencePanel query={[activeShift.userEditedObservation || activeShift.observation, ...confirmedNeeds].join(" ")} />

        {savedBanner && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50/90 px-4 py-3 text-sm text-sky-900" role="status">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" />
            Your preference was saved.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <article className={cardClass}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600">S · Situation</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">What happened?</h2>
              </div>
              {editButton(editingObservation, setEditingObservation)}
            </div>

            {activeShift.rawInput && activeShift.rawInput !== obsText && (
              <div className="mb-3 rounded-2xl border border-sky-200 bg-sky-50/85 p-3.5">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700">You described</p>
                <p className="text-sm leading-relaxed text-slate-800">{activeShift.rawInput}</p>
              </div>
            )}

            {editingObservation ? (
              <textarea
                className={editableTextClass}
                value={obsText}
                onChange={(event) => {
                  const value = event.target.value;
                  setObsText(value);
                  updateShiftBreakdown(activeShift.id, { userEditedObservation: value });
                }}
                aria-label="Edit camera-view observation"
              />
            ) : (
              <div className="rounded-2xl border border-slate-200/80 bg-white/88 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Camera view</p>
                <p className="text-sm leading-relaxed text-slate-800">{obsText}</p>
              </div>
            )}
            <p className="mt-3 text-xs leading-relaxed text-slate-500">Camera facts are what an outside observer could verify, without motives or conclusions added.</p>
          </article>

          <article className={cardClass}>
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600">H · Human response</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">What happened inside you?</h2>
              <p className="mt-1 text-xs text-slate-500">These are suggestions. You decide what actually fits.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(activeShift.possible_emotions || []).map((emotion) => {
                const selected = confirmedEmotions.includes(emotion);
                return (
                  <button
                    key={emotion}
                    type="button"
                    onClick={() => toggleEmotion(emotion)}
                    aria-pressed={selected}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selected ? 'border-sky-300 bg-sky-100 text-sky-900' : 'border-slate-200 bg-white/80 text-slate-600 hover:border-sky-200 hover:bg-sky-50'}`}
                  >
                    {selected && <Check className="mr-1 inline h-3 w-3" aria-hidden="true" />}
                    {emotion}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex max-w-md gap-2">
              <input
                type="text"
                value={customEmotionInput}
                onChange={(event) => setCustomEmotionInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addCustomEmotion();
                  }
                }}
                placeholder="Add your own feeling word"
                className="min-w-0 grow rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-xs text-slate-800 outline-none focus:border-sky-400"
              />
              <button type="button" onClick={addCustomEmotion} className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">Add</button>
            </div>

            <div className="mt-4 border-t border-sky-100 pt-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">What mattered?</p>
              <div className="flex flex-wrap gap-2">
                {needOptions.map((need) => {
                  const selected = confirmedNeeds.includes(need);
                  return (
                    <button
                      key={need}
                      type="button"
                      onClick={() => toggleNeed(need)}
                      aria-pressed={selected}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${selected ? 'border-sky-300 bg-sky-100 text-sky-900' : 'border-slate-200 bg-white/70 text-slate-600 hover:border-sky-200'}`}
                    >
                      {need}
                    </button>
                  );
                })}
              </div>
            </div>
          </article>

          <article className={cardClass}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600">I · Interpretation</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">What might your mind be adding?</h2>
              </div>
              {editButton(editingInterpretation, setEditingInterpretation)}
            </div>
            {editingInterpretation ? (
              <textarea
                className={editableTextClass}
                value={interpText}
                onChange={(event) => {
                  const value = event.target.value;
                  setInterpText(value);
                  updateShiftBreakdown(activeShift.id, { userEditedInterpretation: value });
                }}
                aria-label="Edit interpretation"
              />
            ) : (
              <p className="rounded-2xl border border-slate-200/80 bg-white/88 p-4 text-sm leading-relaxed text-slate-800">{interpText}</p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-slate-500">An interpretation can matter emotionally without being established fact.</p>
          </article>

          <article className={cardClass}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600">F · Function</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">What might the response be trying to do?</h2>
              </div>
              {editButton(editingHypothesis, setEditingHypothesis)}
            </div>

            {editingHypothesis ? (
              <textarea
                className={editableTextClass}
                value={hypoText}
                onChange={(event) => {
                  const value = event.target.value;
                  setHypoText(value);
                  updateShiftBreakdown(activeShift.id, { userEditedHypothesis: value });
                }}
                aria-label="Edit working hypothesis"
              />
            ) : (
              <p className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-sm leading-relaxed text-slate-800">{hypoText}</p>
            )}

            <p className="mt-3 text-xs leading-relaxed text-slate-500">This is a working hypothesis about function, not a verdict about your history, motives, or anyone else.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setHypothesisStatus('accepted')}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${activeShift.hypothesisUserStatus === 'accepted' ? 'border-sky-400 bg-sky-100 text-sky-900' : 'border-slate-200 bg-white/80 text-slate-700 hover:border-sky-200'}`}
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Yes, that fits
              </button>
              <button
                type="button"
                onClick={() => setHypothesisStatus('rejected')}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${activeShift.hypothesisUserStatus === 'rejected' ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-slate-200 bg-white/80 text-slate-700 hover:border-rose-200'}`}
              >
                <XCircle className="h-4 w-4" aria-hidden="true" /> No, that does not fit
              </button>
            </div>
          </article>

          <article className={`${cardClass} lg:col-span-2`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600">T · Today</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">What fits the present situation now?</h2>
              </div>
              {editButton(editingPerspective, setEditingPerspective)}
            </div>

            <div className="grid gap-3 md:grid-cols-[1.35fr_1fr]">
              <div className="rounded-2xl border border-sky-200 bg-sky-50/72 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700">Updated perspective</p>
                {editingPerspective ? (
                  <textarea
                    className={editableTextClass}
                    value={perspText}
                    onChange={(event) => {
                      const value = event.target.value;
                      setPerspText(value);
                      updateShiftBreakdown(activeShift.id, { userEditedPerspective: value });
                    }}
                    aria-label="Edit updated perspective"
                  />
                ) : (
                  <p className="text-sm font-medium leading-relaxed text-slate-800">{perspText}</p>
                )}
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white/84 p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Choice</p>
                  <p className="text-sm leading-relaxed text-slate-800">{activeShift.choice}</p>
                </div>
                {activeShift.real_world_experiment && (
                  <div className="rounded-2xl border border-slate-200 bg-white/84 p-4">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Small real-world test</p>
                    <p className="text-sm leading-relaxed text-slate-800">{activeShift.real_world_experiment}</p>
                  </div>
                )}
              </div>
            </div>
          </article>
        </div>

        <section className="mt-5 rounded-[24px] border border-sky-200 bg-sky-50/58 p-4 sm:p-5" aria-label="Memory preference">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-slate-900">What should SHIFT remember?</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">Nothing becomes durable learning unless you choose it. You can keep this reflection session-only or decline to save it.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => savePreference('remember')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition ${activeShift.savePreference === 'remember' ? 'bg-sky-400 text-slate-950 ring-2 ring-sky-200' : 'bg-sky-400 text-slate-950 hover:bg-sky-300'}`}
              >
                <Save className="h-4 w-4" aria-hidden="true" /> Remember this learning
              </button>
              <button
                type="button"
                onClick={() => savePreference('session_only')}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${activeShift.savePreference === 'session_only' ? 'border-sky-300 bg-white text-sky-900' : 'border-slate-200 bg-white/75 text-slate-700 hover:border-sky-200'}`}
              >
                Keep for this session
              </button>
              <button
                type="button"
                onClick={() => savePreference('dont_save')}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${activeShift.savePreference === 'dont_save' ? 'border-slate-400 bg-slate-100 text-slate-800' : 'border-slate-200 bg-white/75 text-slate-600 hover:border-slate-300'}`}
              >
                Don’t save
              </button>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
};
