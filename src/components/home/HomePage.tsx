'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Loader2,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { generateFallbackBreakdown } from '../../../server/fallbackAnalysis';
import { ShiftBreakdown } from '../../types';
import { useApp } from '../../context/AppContext';
import { LifeContextPicker } from '../layout/LifeContextPicker';
import { PersonalSummary } from './PersonalSummary';
import {
  CinematicSequence,
  type CinematicSequenceHandle,
} from './CinematicSequence';
import {
  LANDING_FRAMES,
  LANDING_STOPS,
  LANDING_VIDEO_FPS,
  LANDING_VIDEO_POSTER,
  LANDING_VIDEO_SOURCES,
} from './landingSequence';

const QUICK_EXAMPLES = [
  "My friend hasn't answered me and I keep checking my phone.",
  "My boss corrected me in front of everyone and now I can't stop thinking about it.",
  "My partner said something that really annoyed me, but I don't know why.",
  "I want to drink even though nothing terrible happened.",
  "I feel weird and can't put it into words.",
];

export const HomePage: React.FC = () => {
  const {
    memoryItems,
    setActiveTab,
    playSoftSound,
    setActiveShift,
    saveShiftBreakdown,
    setCrisisInterruption,
  } = useApp();

  const sequenceRef = useRef<CinematicSequenceHandle>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Gathering facts...');

  useEffect(() => {
    let entry: string | null = null;
    try {
      entry = sessionStorage.getItem('shift_home_entry_v1');
      sessionStorage.removeItem('shift_home_entry_v1');
    } catch {
      entry = null;
    }

    if (entry !== 'arrival') return;
    const timer = window.setTimeout(() => {
      sequenceRef.current?.scrollToProgress(LANDING_STOPS.workspace);
    }, 100);
    return () => window.clearTimeout(timer);
  }, []);

  const navigateToTool = (tab: string) => {
    playSoftSound('tap');
    setActiveTab(tab);
    requestAnimationFrame(() => window.scrollTo({ top: 0 }));
  };

  const arriveAtWorkspace = (focusTarget?: 'life-context' | 'reflection-workspace') => {
    playSoftSound('tap');
    sequenceRef.current?.scrollToProgress(LANDING_STOPS.workspace);

    if (!focusTarget) return;
    window.setTimeout(() => {
      const section = document.getElementById(focusTarget);
      const focusable = section?.querySelector<HTMLElement>('textarea, input, button, summary');
      focusable?.focus({ preventScroll: true });
    }, 850);
  };

  const handleAnalyze = async (textToAnalyze?: string) => {
    const text = (textToAnalyze || inputText).trim();
    if (!text) return;

    playSoftSound('tap');
    setLoading(true);
    setLoadingStep('Observing what objectively happened...');

    try {
      const stepTimer1 = setTimeout(() => {
        setLoadingStep('Distinguishing known facts from added interpretations...');
      }, 700);
      const stepTimer2 = setTimeout(() => {
        setLoadingStep('Checking whether earlier learning is actually relevant...');
      }, 1400);

      const response = await fetch('/api/shift/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation: text,
          // The server selects only reusable learning types. Raw event narratives and
          // unconfirmed interpretations are excluded from long-term context retrieval.
          memoryItems: memoryItems.slice(0, 80),
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      if (!response.ok) throw new Error('Server returned an error status');

      const data = await response.json() as {
        safetyInterruption?: boolean;
        crisisType?: string;
        crisisMessage?: string;
        memoryUsed?: string[];
        memorySource?: string;
        breakdown?: ReturnType<typeof generateFallbackBreakdown>;
      };

      if (data.safetyInterruption) {
        setCrisisInterruption({ isOpen: true, type: data.crisisType, message: data.crisisMessage });
        setLoading(false);
        return;
      }

      const breakdownData = data.breakdown || generateFallbackBreakdown(text);
      const newShift: ShiftBreakdown = {
        id: 'shift-' + Date.now(),
        rawInput: text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        observation: breakdownData.observation || text,
        userEditedObservation: breakdownData.observation || text,
        possible_emotions: breakdownData.possible_emotions || ['Uncertainty', 'Tension'],
        confirmed_emotions: [breakdownData.possible_emotions?.[0] || 'Uncertainty'],
        emotionIntensity: 6,
        interpretation: breakdownData.interpretation || 'Mind anticipating an unwanted consequence.',
        userEditedInterpretation: breakdownData.interpretation || 'Mind anticipating an unwanted consequence.',
        possible_needs: breakdownData.possible_needs || ['predictability', 'safety'],
        confirmed_needs: [breakdownData.possible_needs?.[0] || 'predictability'],
        protective_rule_hypothesis: breakdownData.protective_rule_hypothesis || 'When ambiguity occurs, I predict negative outcomes, so my system attempts to control or retreat.',
        hypothesis_confidence: breakdownData.hypothesis_confidence || 'medium',
        hypothesisUserStatus: 'unreviewed',
        updated_perspective: breakdownData.updated_perspective || 'The first thought that arrives in an activated moment is a hypothesis from an old safety program, not a verified fact about reality.',
        choice: breakdownData.choice || 'Pause for 60 seconds to separate verified facts from stories before choosing any action.',
        real_world_experiment: breakdownData.real_world_experiment || 'Observe the situation for 24 hours without acting on your first protective reflex.',
        follow_up_question: breakdownData.follow_up_question || 'What is one camera fact about what occurred, stripped of all interpretation?',
        recommended_skills: breakdownData.recommended_skills || ['fact_vs_interpretation'],
        recommended_games: breakdownData.recommended_games || ['fact_or_story', 'prediction_lab'],
        memoryUsed: Array.isArray(data.memoryUsed) ? data.memoryUsed : [],
        memorySource: data.memorySource || 'device_or_none',
        isSavedToProfile: false,
        // Nothing becomes durable memory before the user deliberately chooses Remember.
        savePreference: 'session_only',
      };

      saveShiftBreakdown(newShift);
      setActiveShift(newShift);
      playSoftSound('complete');
      // Keep Talking is now the immediate second screen. The full breakdown
      // remains available from the Reflection tab in the workspace navigation.
      setActiveTab('conversation');
    } catch (requestError) {
      console.warn('Network call failed, running local clinical fallback:', requestError);
      const fallback = generateFallbackBreakdown(text);
      const fallbackShift: ShiftBreakdown = {
        id: 'shift-' + Date.now(),
        rawInput: text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        observation: fallback.observation,
        userEditedObservation: fallback.observation,
        possible_emotions: fallback.possible_emotions,
        confirmed_emotions: [fallback.possible_emotions[0]],
        emotionIntensity: 6,
        interpretation: fallback.interpretation,
        userEditedInterpretation: fallback.interpretation,
        possible_needs: fallback.possible_needs,
        confirmed_needs: [fallback.possible_needs[0]],
        protective_rule_hypothesis: fallback.protective_rule_hypothesis,
        hypothesis_confidence: fallback.hypothesis_confidence,
        hypothesisUserStatus: 'unreviewed',
        updated_perspective: fallback.updated_perspective,
        choice: fallback.choice,
        real_world_experiment: fallback.real_world_experiment,
        follow_up_question: fallback.follow_up_question,
        recommended_skills: fallback.recommended_skills,
        recommended_games: fallback.recommended_games as ShiftBreakdown['recommended_games'],
        memoryUsed: [],
        memorySource: 'device_or_none',
        isSavedToProfile: false,
        savePreference: 'session_only',
      };
      saveShiftBreakdown(fallbackShift);
      setActiveShift(fallbackShift);
      playSoftSound('complete');
      setActiveTab('conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CinematicSequence
      ref={sequenceRef}
      frames={LANDING_FRAMES}
      videoSources={LANDING_VIDEO_SOURCES}
      poster={LANDING_VIDEO_POSTER}
      videoFps={LANDING_VIDEO_FPS}
    >
      <section className="cinematic-panel cinematic-panel--hero" aria-labelledby="hero-title">
        <header className="cinematic-nav cinematic-nav--hero">
          <button className="cinematic-brand" type="button" aria-label="SHIFT home" onClick={() => sequenceRef.current?.scrollToProgress(LANDING_STOPS.hero)}>
            <span className="cinematic-brand-mark" aria-hidden="true">S</span><span>SHIFT</span>
          </button>
          <nav aria-label="Landing page navigation">
            <button type="button" onClick={() => arriveAtWorkspace('life-context')}>Life context</button>
            <span aria-hidden="true" />
            <button type="button" onClick={() => arriveAtWorkspace('reflection-workspace')}>Reflection</button>
          </nav>
        </header>

        <div className="cinematic-hero-copy">
          <p className="cinematic-kicker">A clearer place to begin</p>
          <h1 id="hero-title">Mind over<br />matter.</h1>
          <i aria-hidden="true" />
          <p>An experience designed to help you prepare for and process therapy, <strong>effectively.</strong></p>
          <button className="cinematic-primary-cta" type="button" onClick={() => arriveAtWorkspace()}>
            Start your shift <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="cinematic-panel cinematic-panel--menu-rise cinematic-panel--workspace-arrival" aria-labelledby="arrival-prompt">
        <header className="arrival-header">
          <button className="cinematic-brand arrival-brand" type="button" aria-label="SHIFT home" onClick={() => sequenceRef.current?.scrollToProgress(LANDING_STOPS.hero)}>
            <span className="cinematic-brand-mark" aria-hidden="true">S</span><span>SHIFT</span>
          </button>

          <p id="arrival-prompt" className="arrival-prompt">Where would you like to begin?</p>

          <nav className="arrival-nav" aria-label="Shift starting points">
            <button type="button" onClick={() => arriveAtWorkspace('life-context')}>Life context</button>
            <button type="button" onClick={() => arriveAtWorkspace('reflection-workspace')}>Start a reflection</button>
            <button type="button" onClick={() => navigateToTool('dashboard')}>Explore Shift</button>
          </nav>
        </header>

        <div className="arrival-workspace">
          <div className="arrival-workspace-stack">
            <section className="arrival-card arrival-card--context" id="life-context" aria-label="Life context">
              <p className="cinematic-eyebrow">Set the scene</p>
              <div className="cinematic-life-context"><LifeContextPicker inline /></div>
              <details className="personal-context-disclosure">
                <summary>Your story, in your words <span>Optional</span></summary>
                <PersonalSummary />
              </details>
            </section>

            <section className="arrival-card arrival-card--reflection" id="reflection-workspace" aria-labelledby="reflection-title">
              <div className="cinematic-framework-label">S • H • I • F • T Framework</div>
              <h2 id="reflection-title">What’s going on?</h2>
              <p className="cinematic-intro">Start with a moment from your day. Review the facts, name your feelings, then practice a helpful response.</p>
              <label className="cinematic-textarea">
                <span className="sr-only">Describe what happened or what you are noticing inside</span>
                <textarea value={inputText} onChange={(event) => setInputText(event.target.value)} placeholder="Describe what happened or what you’re noticing inside…" disabled={loading} />
                <span className="cinematic-input-footer">
                  <small>Reflect first. Then practice at your pace.</small>
                  <button type="button" onClick={() => void handleAnalyze()} disabled={loading || !inputText.trim()}>
                    {loading ? <Loader2 className="is-spinning" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                    {loading ? loadingStep : 'Explore my situation'}
                  </button>
                </span>
              </label>

              <div className="cinematic-scenarios">
                <p><Zap aria-hidden="true" /> Or try one real-life reflection:</p>
                <div>{QUICK_EXAMPLES.map((example) => <button type="button" key={example} disabled={loading} onClick={() => { setInputText(example); void handleAnalyze(example); }}>“{example}”</button>)}</div>
              </div>

              <button className="cinematic-safety-link" type="button" onClick={() => navigateToTool('safety')}><ShieldCheck aria-hidden="true" /> Educational skills tool <span>Safety & hotlines</span></button>
            </section>
          </div>
        </div>
      </section>
    </CinematicSequence>
  );
};
