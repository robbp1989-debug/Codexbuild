import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { QUESTIONS, spokenQuestion } from './questions';
import { parseCommand } from './intakeReducer';
import { BrowserVoiceProvider } from './browserVoiceProvider';
import type { VoiceProvider, VoiceState, VoiceOption } from './voiceProvider';
import { intakeSafety } from './safetyInterrupt';
import type { ContextItem } from '../personalization/model';

export function HollyIntake() {
  const {
    intake,
    dispatchIntake,
    rememberIntake,
    setRememberIntake,
    personalContext,
    savePersonalContext,
    contextNotice,
    setCrisisInterruption,
    setActiveTab,
  } = useApp();
  const [mode, setMode] = useState<'type' | 'voice'>('type');
  const [consent, setConsent] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [source, setSource] =
    useState<ContextItem['source']>('user_direct_form');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [notice, setNotice] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [ready, setReady] = useState(false);
  const provider = useRef<VoiceProvider | null>(null);
  const callbacks = useRef({
    onTranscript: (
      _text: string,
      _final: boolean,
      _confidence: number | null,
    ) => {},
  });
  const question = QUESTIONS[intake.index];
  function stop() {
    provider.current?.stop();
  }
  function speak(text: string) {
    if (consent) provider.current?.speak(text, voiceId, true);
  }
  function interrupt(text: string) {
    const safety = intakeSafety(text);
    if (!safety.isCrisis) return false;
    stop();
    dispatchIntake({ type: 'pause' });
    setCrisisInterruption({
      isOpen: true,
      type: safety.crisisType,
      message: safety.crisisMessage,
    });
    return true;
  }
  function command(text: string) {
    const intent = parseCommand(text);
    if (!intent) return false;
    stop();
    setDraft('');
    if (intent === 'repeat')
      speak(
        question
          ? spokenQuestion(question)
          : 'Review what you want SHIFT to use.',
      );
    if (intent === 'options' && question) speak(spokenQuestion(question, true));
    if (intent === 'skip' || intent === 'back') {
      dispatchIntake({ type: intent });
      setReady(false);
    }
    if (intent === 'type') {
      setMode('type');
      setNotice('You can type the same answer here.');
    }
    if (intent === 'pause' || intent === 'end')
      dispatchIntake({ type: 'pause' });
    if (intent === 'heard') {
      const last = intake.answers.at(-1);
      setNotice(
        last ? `Last answer: ${last.raw_user_text}` : 'No answer recorded yet.',
      );
      speak(last?.raw_user_text || 'No answer recorded yet.');
    }
    return true;
  }
  function answer() {
    submitAnswer(draft, source, confidence);
  }
  function submitAnswer(
    text: string,
    answerSource: ContextItem['source'],
    answerConfidence: number | null,
  ) {
    if (
      !text.trim() ||
      text.length > 600 ||
      intake.phase !== 'questions' ||
      !question
    )
      return;
    if (interrupt(text) || command(text)) return;
    stop();
    setDraft('');
    setReady(false);
    dispatchIntake({
      type: 'answer',
      answer: {
        id: crypto.randomUUID(),
        question_id: question.id,
        label: question.target.replace(/_/g, ' '),
        raw_user_text: text.trim(),
        text: text.trim(),
        source: answerSource,
        confidence: answerConfidence,
        structured_value: question.options.includes(text.trim())
          ? text.trim()
          : null,
        status: 'pending',
        timestamp: new Date().toISOString(),
      },
    });
  }
  useEffect(() => {
    callbacks.current.onTranscript = (text, final, c) => {
      if (interrupt(text)) return;
      if (final && command(text)) return;
      setDraft(text.slice(0, 3000));
      setSource('user_direct_voice');
      setConfidence(c);
      setReady(final);
      if (final && text.trim()) {
        if (text.length > 600) {
          stop();
          setNotice(
            'That answer was long. Please say a shorter version, or edit the transcript.',
          );
          speak('Please give me a shorter version of that answer.');
          return;
        }
        submitAnswer(text, 'user_direct_voice', c);
        setNotice(
          'Answer captured. Say go back to correct it. You will review everything before it is used.',
        );
      }
    };
  });
  useEffect(() => {
    // Future approved voice plugs in here; the question engine has no speech API dependency.
    provider.current = new BrowserVoiceProvider({
      onState: setVoiceState,
      onTranscript: (...args) => callbacks.current.onTranscript(...args),
      onError: (message) => {
        setNotice(message);
        setReady(true); // Keep voice controls available for a microphone retry.
      },
    });
    const refresh = () => setVoices(provider.current?.voices() || []);
    refresh();
    window.speechSynthesis?.addEventListener('voiceschanged', refresh);
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', refresh);
      provider.current?.dispose();
    };
  }, []);
  // Speech begins only after a user has explicitly chosen and consented to voice mode.
  useEffect(() => {
    if (mode === 'voice' && consent && intake.phase === 'questions' && question)
      provider.current?.speak(spokenQuestion(question), voiceId, true);
    else if (mode === 'voice' && consent && intake.phase === 'review')
      provider.current?.speak(
        'That gives me enough to get started. Review what I understood below. Nothing is used until you approve it.',
        voiceId,
      );
  }, [intake.index, intake.phase, mode, consent, question, voiceId]);
  function startVoice() {
    setConsentOpen(true);
  }
  function finish() {
    const approved = intake.answers.filter((x) => x.status !== 'pending');
    // Re-running intake explicitly replaces answers only for the same approved question.
    const replaced = new Set(approved.map((x) => x.question_id));
    if (
      savePersonalContext([
        ...personalContext.filter(
          (x) => x.source === 'document_report' || !replaced.has(x.question_id),
        ),
        ...approved,
      ])
    ) {
      setRememberIntake(false);
      dispatchIntake({ type: 'reset' });
      stop();
      setMode('type');
      setNotice('Your approved intake is ready. You can review it below.');
    }
  }
  return (
    <section className="personalize-card" aria-labelledby="holly-title">
      <p className="personalize-eyebrow">An easier way to begin</p>
      <h2 id="holly-title">Holly — SHIFT’s AI voice guide</h2>
      <p>
        Answer one question at a time, in your own words. Skip anything. Holly
        is an intake guide, not a therapist or emergency service.
      </p>
      <p className="personalize-small">
        Holly asks, then listens for your spoken answer and continues
        automatically. You do not need to type or press Use this answer. Say
        skip, go back, repeat that, or pause while listening. Temporary demo
        voice · No raw audio is recorded by SHIFT. Voice availability varies by
        browser and device.
      </p>
      {consentOpen && (
        <fieldset className="personalize-consent">
          <legend>Voice consent</legend>
          <h3>Before starting voice</h3>
          <p>
            Your browser may send audio to its speech service to create a
            transcript. Those services follow their own processing terms. SHIFT
            uses only the answers you review and approve. You can stop or type
            anytime.
          </p>
          <div className="personalize-actions">
            <button
              onClick={() => {
                setConsent(true);
                setConsentOpen(false);
                setMode('voice');
                dispatchIntake({ type: 'start' });
              }}
            >
              I agree — start Holly
            </button>
            <button
              className="secondary"
              onClick={() => {
                setConsentOpen(false);
                setMode('type');
                dispatchIntake({ type: 'start' });
              }}
            >
              Use typing instead
            </button>
          </div>
        </fieldset>
      )}
      {(intake.phase === 'choice' || intake.phase === 'paused') && (
        <div className="personalize-actions">
          <button onClick={startVoice}>
            {intake.index ? 'Resume with Holly' : 'Talk with Holly'}
          </button>
          <button
            className="secondary"
            onClick={() => {
              setMode('type');
              dispatchIntake({ type: 'start' });
            }}
          >
            {intake.index ? 'Resume on screen' : 'Answer on screen'}
          </button>
          <button className="secondary" onClick={() => setActiveTab('home')}>
            Quick start
          </button>
        </div>
      )}
      <label className="personalize-check">
        <input
          type="checkbox"
          checked={rememberIntake}
          onChange={(e) => setRememberIntake(e.target.checked)}
        />
        Save my unfinished intake on this device so I can resume after closing.
        This is unencrypted browser storage; avoid shared devices.
      </label>
      {intake.phase === 'questions' && question && (
        <>
          <p className="personalize-eyebrow">
            {question.id} · Question {intake.index + 1} of {QUESTIONS.length}
          </p>
          <h3>{question.prompt}</h3>
          {question.id === 'V8' && (
            <p>
              Would you like names remembered, or only relationship categories?
              Include only what you want kept in your answer.
            </p>
          )}
          <output aria-live="polite">
            {voiceState === 'listening'
              ? 'Listening…'
              : voiceState === 'speaking'
                ? 'Holly speaking…'
                : voiceState === 'paused'
                  ? 'Microphone off'
                  : 'Ready when you are'}
          </output>
          {mode === 'voice' && (
            <div className="personalize-actions">
              <button
                onClick={() => {
                  setDraft('');
                  setReady(false);
                  provider.current?.listen();
                }}
              >
                Speak now / Interrupt Holly
              </button>
              <button
                className="secondary"
                onClick={() => speak(spokenQuestion(question))}
              >
                Repeat question
              </button>
              <button
                className="secondary"
                onClick={() => {
                  stop();
                  setMode('type');
                  setReady(true);
                }}
              >
                Type instead
              </button>
              <button className="secondary" onClick={stop}>
                Mute / Stop microphone
              </button>
            </div>
          )}
          {mode === 'type' && (
            <button
              className="secondary"
              onClick={() => (consent ? setMode('voice') : startVoice())}
            >
              Switch to Holly
            </button>
          )}
          {mode === 'voice' && (
            <label>
              Temporary voice
              <select
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
              >
                <option value="">Suggested English voice</option>
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {question.options.length > 0 && (
            <div className="personalize-examples">
              <p>
                <strong>Some starting points</strong> — these are examples, not
                a required answer. Speak in your own words, combine ideas, or
                skip.
              </p>
              <div className="personalize-actions">
                {question.options.map((option) => (
                  <button
                    className="secondary"
                    key={option}
                    onClick={() => {
                      stop();
                      setDraft(option);
                      setSource('user_direct_form');
                      setConfidence(null);
                      setReady(true);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {mode === 'voice' && (
                <button
                  className="secondary"
                  onClick={() => speak(spokenQuestion(question, true))}
                >
                  Hear all examples
                </button>
              )}
            </div>
          )}
          <label>
            Your answer / transcript
            <textarea
              rows={3}
              value={draft}
              maxLength={3000}
              onChange={(e) => {
                setDraft(e.target.value);
                setSource('user_direct_form');
                setConfidence(null);
                setReady(true);
              }}
              placeholder="Say it your way, or skip…"
            />
          </label>
          <p className="personalize-small">
            {draft.length}/600 characters for your reviewed answer.{' '}
            {draft.length > 600
              ? 'Please shorten this answer before continuing.'
              : ''}{' '}
            {source === 'user_direct_voice'
              ? 'Please check names and sensitive details; Holly will not guess what you meant.'
              : ''}
          </p>
          <div className="personalize-actions">
            <button
              disabled={!draft.trim() || draft.length > 600 || !ready}
              onClick={answer}
            >
              Use this answer
            </button>
            <button className="secondary" onClick={() => command('skip')}>
              Skip
            </button>
            <button
              className="secondary"
              disabled={intake.index === 0}
              onClick={() => command('go back')}
            >
              Go back
            </button>
            <button className="secondary" onClick={() => command('pause')}>
              Pause / Stop for now
            </button>
            <button
              className="secondary"
              onClick={() => {
                stop();
                dispatchIntake({ type: 'review' });
              }}
            >
              Review answers so far
            </button>
          </div>
        </>
      )}
      {intake.phase === 'review' && (
        <>
          <h3>Review what I understood</h3>
          <p>
            Nothing here is set in stone. Keep only what you want SHIFT to use.
            Uncertain and historical answers do not become active
            personalization.
          </p>
          {intake.answers.length === 0 && (
            <p>No answers to approve. You can start without a profile.</p>
          )}
          {intake.answers.map((item) => (
            <div className="personalize-review" key={item.id}>
              <label>
                {item.label}
                <textarea
                  rows={2}
                  maxLength={600}
                  value={item.text}
                  onChange={(e) =>
                    dispatchIntake({
                      type: 'revise',
                      id: item.id,
                      text: e.target.value,
                    })
                  }
                />
              </label>
              <p className="personalize-small">
                {item.source === 'user_direct_voice'
                  ? 'Spoken answer'
                  : 'Typed answer'}{' '}
                · {item.status}
              </p>
              <div className="personalize-actions">
                <button
                  disabled={!item.text.trim()}
                  onClick={() =>
                    dispatchIntake({
                      type: 'revise',
                      id: item.id,
                      status: 'confirmed',
                    })
                  }
                >
                  Keep
                </button>
                <button
                  className="secondary"
                  onClick={() =>
                    dispatchIntake({
                      type: 'revise',
                      id: item.id,
                      status: 'historical',
                    })
                  }
                >
                  Not true anymore
                </button>
                <button
                  className="secondary"
                  onClick={() =>
                    dispatchIntake({
                      type: 'revise',
                      id: item.id,
                      status: 'uncertain',
                    })
                  }
                >
                  I’m not sure
                </button>
                <button
                  className="secondary"
                  onClick={() =>
                    dispatchIntake({ type: 'remove', id: item.id })
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="personalize-actions">
            <button onClick={finish}>Confirm approved answers</button>
            <button
              className="secondary"
              onClick={() => dispatchIntake({ type: 'back' })}
            >
              Go back
            </button>
          </div>
        </>
      )}
      {(intake.answers.length > 0 || intake.phase !== 'choice') && (
        <button
          className="secondary"
          onClick={() => {
            stop();
            setRememberIntake(false);
            setDraft('');
            dispatchIntake({ type: 'reset' });
            setNotice('Unfinished intake and its correction history deleted.');
          }}
        >
          Delete unfinished intake
        </button>
      )}
      <output aria-live="polite">{notice || contextNotice}</output>
    </section>
  );
}
