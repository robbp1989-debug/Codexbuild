'use client';

import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  ClipboardCheck,
  FlaskConical,
  Gamepad2,
  GitBranch,
  Layers,
  Leaf,
  Lightbulb,
  Loader2,
  PenLine,
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
import { LANDING_FRAMES, LANDING_STOPS } from './landingSequence';

const QUICK_EXAMPLES = [
  "My friend hasn't answered me and I keep checking my phone.",
  "My boss corrected me in front of everyone and now I can't stop thinking about it.",
  "My partner said something that really annoyed me, but I don't know why.",
  "I want to drink even though nothing terrible happened.",
  "I feel weird and can't put it into words.",
];

const TOOL_LINKS = [
  { tab: 'dashboard', title: 'Shift Lab', copy: 'Your themes, working model, active experiments, and past updates.', Icon: Layers },
  { tab: 'arcade', title: 'Reflection Arcade', copy: 'Fast practice for separating facts, stories, feelings, and choices.', Icon: Gamepad2 },
  { tab: 'skills', title: 'Skill Tree', copy: 'Track depth across awareness, perspective, relationships, and regulation.', Icon: GitBranch },
  { tab: 'prediction-lab', title: 'Prediction Lab', copy: 'Compare what your old system feared with what actually happened.', Icon: FlaskConical },
] as const;

export const HomePage: React.FC = () => {
  const {
    approvedSummary,
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

  const navigateToTool = (tab: string) => {
    playSoftSound('tap');
    setActiveTab(tab);
    requestAnimationFrame(() => window.scrollTo({ top: 0 }));
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
        setLoadingStep('Identifying possible needs & working hypothesis...');
      }, 1400);

      const response = await fetch('/api/shift/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: text, memoryContext: approvedSummary ? [approvedSummary] : [] }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      if (!response.ok) throw new Error('Server returned an error status');

      const data = await response.json() as {
        safetyInterruption?: boolean;
        crisisType?: string;
        crisisMessage?: string;
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
        isSavedToProfile: false,
        savePreference: 'remember',
      };

      saveShiftBreakdown(newShift);
      setActiveShift(newShift);
      playSoftSound('complete');
      setActiveTab('breakdown');
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
        isSavedToProfile: false,
        savePreference: 'remember',
      };
      saveShiftBreakdown(fallbackShift);
      setActiveShift(fallbackShift);
      playSoftSound('complete');
      setActiveTab('breakdown');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CinematicSequence ref={sequenceRef} frames={LANDING_FRAMES}>
      <section className="cinematic-panel cinematic-panel--hero" aria-labelledby="hero-title">
        <header className="cinematic-nav">
          <button className="cinematic-brand" type="button" aria-label="SHIFT home" onClick={() => sequenceRef.current?.scrollToProgress(LANDING_STOPS.hero)}>
            <span className="cinematic-brand-mark" aria-hidden="true">S</span><span>SHIFT</span>
          </button>
          <nav aria-label="Landing page navigation">
            <button type="button" onClick={() => sequenceRef.current?.scrollToProgress(LANDING_STOPS.discipline)}>Our Approach</button>
            <span aria-hidden="true" />
            <button type="button" onClick={() => sequenceRef.current?.scrollToProgress(LANDING_STOPS.process)}>Process</button>
          </nav>
        </header>
        <div className="cinematic-hero-copy">
          <p className="cinematic-kicker">A clearer place to begin</p>
          <h1 id="hero-title">Mind over<br />matter.</h1>
          <i aria-hidden="true" />
          <p>An experience designed to help you prepare for and process therapy, <strong>effectively.</strong></p>
          <button className="cinematic-primary-cta" type="button" onClick={() => sequenceRef.current?.scrollToProgress(LANDING_STOPS.lifeContext)}>
            Start your shift <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="cinematic-panel cinematic-panel--context cinematic-panel--center" aria-label="Life context">
        <div className="cinematic-surface cinematic-context-surface">
          <p className="cinematic-eyebrow">Set the scene</p>
          <div className="cinematic-life-context"><LifeContextPicker inline /></div>
          <details className="personal-context-disclosure">
            <summary>Your story, in your words <span>Optional</span></summary>
            <PersonalSummary />
          </details>
        </div>
      </section>

      <section className="cinematic-panel cinematic-panel--reflection cinematic-panel--left" aria-labelledby="reflection-title">
        <div className="cinematic-surface cinematic-reflection-surface">
          <div className="cinematic-framework-label">S • H • I • F • T Framework</div>
          <h2 id="reflection-title">What’s going on?</h2>
          <p className="cinematic-intro">Start with a moment from your day. Review the facts, name your feelings, then practice a helpful response before you begin.</p>
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
            <div>
              {QUICK_EXAMPLES.map((example) => (
                <button type="button" key={example} disabled={loading} onClick={() => { setInputText(example); void handleAnalyze(example); }}>“{example}”</button>
              ))}
            </div>
          </div>
          <button className="cinematic-safety-link" type="button" onClick={() => navigateToTool('safety')}>
            <ShieldCheck aria-hidden="true" /> Educational skills tool <span>Safety & hotlines</span>
          </button>
        </div>
      </section>

      {TOOL_LINKS.map(({ tab, title, copy, Icon }, index) => (
        <section className={`cinematic-panel cinematic-panel--tool-${index} cinematic-panel--center`} aria-labelledby={`tool-title-${tab}`} key={tab}>
          <div className="cinematic-tools-wrap cinematic-tool-stage">
            <p className="cinematic-eyebrow">Continue your practice · {String(index + 1).padStart(2, '0')}</p>
            <span className="cinematic-tool-icon cinematic-tool-icon--featured"><Icon aria-hidden="true" /></span>
            <h2 id={`tool-title-${tab}`}>{title}</h2>
            <p className="cinematic-intro">{copy}</p>
            <button className="cinematic-tool-cta" type="button" onClick={() => navigateToTool(tab)}>
              Open {title} <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </section>
      ))}

      <section className="cinematic-panel cinematic-panel--discipline cinematic-panel--right" aria-labelledby="discipline-title">
        <div className="cinematic-surface cinematic-discipline-surface">
          <p className="cinematic-eyebrow"><Lightbulb aria-hidden="true" /> The SHIFT Discipline</p>
          <h2 id="discipline-title">Clarity before certainty.</h2>
          <ol>
            <li><span>01</span><div><strong>Observe First, Interpret Second</strong><p>Camera-test what was said and done before automatic stories create certainty.</p></div></li>
            <li><span>02</span><div><strong>Feel Before Explaining</strong><p>Notice emotional impact and bodily response before explaining someone else’s motives.</p></div></li>
            <li><span>03</span><div><strong>Hypotheses, Not Verdicts</strong><p>Protective rules are possibilities to test—not facts you have to obey.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="cinematic-panel cinematic-panel--arrival cinematic-panel--center" aria-label="Arrival at the therapy room">
        <div className="cinematic-arrival-copy"><span aria-hidden="true" /><p>From reflection<br />to preparation.</p></div>
      </section>

      <section className="cinematic-panel cinematic-panel--process" aria-labelledby="process-title">
        <div className="cinematic-process-copy">
          <h2 id="process-title">Three steps to<br />clearer sessions.</h2><i aria-hidden="true" />
          <p>A simple, proven flow that helps you reflect, practice, and prepare—so every session moves you forward.</p>
        </div>
        <div className="cinematic-process-cards">
          <button type="button" onClick={() => sequenceRef.current?.scrollToProgress(LANDING_STOPS.reflection)}>
            <span><Leaf aria-hidden="true" /></span><i aria-hidden="true" /><div><strong>Reflect</strong><p>Check in with yourself and bring clarity to what matters.</p></div>
          </button>
          <button type="button" onClick={() => navigateToTool('arcade')}>
            <span><PenLine aria-hidden="true" /></span><i aria-hidden="true" /><div><strong>Practice</strong><p>Build insight and skills with guided exercises.</p></div>
          </button>
          <button type="button" onClick={() => navigateToTool('therapy-prep')}>
            <span><ClipboardCheck aria-hidden="true" /></span><i aria-hidden="true" /><div><strong>Therapy Prep</strong><p>Organize your thoughts and get the most from each session.</p></div>
          </button>
        </div>
      </section>
    </CinematicSequence>
  );
};
