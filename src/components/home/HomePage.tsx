import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Gamepad2,
  GitBranch,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  FlaskConical,
  HeartHandshake,
  Loader2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { ShiftBreakdown } from '../../types';
import { generateFallbackBreakdown } from '../../../server/fallbackAnalysis';
import { LifeContextPicker } from '../layout/LifeContextPicker';

const QUICK_EXAMPLES = [
  "My friend hasn't answered me and I keep checking my phone.",
  "My boss corrected me in front of everyone and now I can't stop thinking about it.",
  "My partner said something that really annoyed me, but I don't know why.",
  "I want to drink even though nothing terrible happened.",
  "I feel weird and can't put it into words.",
];

export const HomePage: React.FC = () => {
  const {
    setActiveTab,
    playSoftSound,
    setActiveShift,
    saveShiftBreakdown,
    setCrisisInterruption,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Gathering facts...');
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (textToAnalyze?: string) => {
    const text = (textToAnalyze || inputText).trim();
    if (!text) return;

    playSoftSound('tap');
    setLoading(true);
    setError(null);
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
        body: JSON.stringify({ situation: text }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!response.ok) {
        throw new Error('Server returned an error status');
      }

      const data = await response.json() as { safetyInterruption?: boolean; crisisType?: string; crisisMessage?: string; breakdown?: ReturnType<typeof generateFallbackBreakdown> };

      if (data.safetyInterruption) {
        setCrisisInterruption({
          isOpen: true,
          type: data.crisisType,
          message: data.crisisMessage,
        });
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
        protective_rule_hypothesis:
          breakdownData.protective_rule_hypothesis ||
          'When ambiguity occurs, I predict negative outcomes, so my system attempts to control or retreat.',
        hypothesis_confidence: breakdownData.hypothesis_confidence || 'medium',
        hypothesisUserStatus: 'unreviewed',
        updated_perspective:
          breakdownData.updated_perspective ||
          'The first thought that arrives in an activated moment is a hypothesis from an old safety program, not a verified fact about reality.',
        choice:
          breakdownData.choice ||
          'Pause for 60 seconds to separate verified facts from stories before choosing any action.',
        real_world_experiment:
          breakdownData.real_world_experiment ||
          'Observe the situation for 24 hours without acting on your first protective reflex.',
        follow_up_question:
          breakdownData.follow_up_question ||
          'What is one camera fact about what occurred, stripped of all interpretation?',
        recommended_skills: breakdownData.recommended_skills || ['fact_vs_interpretation'],
        recommended_games: breakdownData.recommended_games || ['fact_or_story', 'prediction_lab'],
        isSavedToProfile: false,
        savePreference: 'remember',
      };

      saveShiftBreakdown(newShift);
      setActiveShift(newShift);
      playSoftSound('complete');
      setActiveTab('breakdown');
    } catch (err) {
      console.warn('Network call failed, running local clinical fallback:', err);
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
        recommended_games: fallback.recommended_games as any,
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <LifeContextPicker inline />
      {/* Educational & Non-Medical Disclaimer Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
          <span>
            <strong>Educational Skills Tool:</strong> SHIFT helps you reflect and test real-life behavioral predictions. It is not diagnostic or medical therapy.
          </span>
        </div>
        <button
          onClick={() => setActiveTab('safety')}
          className="text-teal-400 hover:text-teal-300 font-medium underline shrink-0 cursor-pointer"
        >
          Safety & Hotlines
        </button>
      </div>

      {/* Primary Prompt Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/60 border border-teal-500/30 text-teal-300 text-xs font-mono mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span>S • H • I • F • T FRAMEWORK</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100 mb-3">
            What’s going on?
          </h1>
          <p className="text-slate-400 text-base sm:text-lg mb-8 leading-relaxed">
            Start with a moment from your day. Review the facts, name your feelings, then <strong className="text-teal-300 font-semibold">practice a helpful response through play.</strong> You can edit every suggestion before you begin.
          </p>

          {/* Input Area */}
          <div className="space-y-4">
            <div className="relative rounded-2xl bg-slate-950/80 border border-slate-700/80 p-3 sm:p-4 focus-within:border-teal-500 transition-colors shadow-inner">
              <textarea
                aria-label="What's going on? Describe your situation"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Describe what happened or what you're noticing inside (e.g. 'My friend hasn't replied...', 'My boss corrected me in a meeting...', 'I feel restless and want to escape...')"
                className="w-full h-32 sm:h-36 bg-transparent text-slate-100 placeholder-slate-500 text-base resize-none focus:outline-none leading-relaxed"
                disabled={loading}
              />

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-xs text-slate-500">
                  Reflect first. Then practice at your pace.
                </span>
                <button
                  onClick={() => handleAnalyze()}
                  disabled={loading || !inputText.trim()}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg ${
                    loading || !inputText.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'shift-primary font-semibold cursor-pointer active:scale-98'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>{loadingStep}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Explore my situation</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick 1-Tap Preset Buttons */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-teal-400" />
                Or try one-tap real-life reflection scenarios:
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_EXAMPLES.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputText(example);
                      handleAnalyze(example);
                    }}
                    disabled={loading}
                    className="text-left text-xs bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/80 hover:border-teal-500/50 text-slate-300 hover:text-teal-200 px-3 py-2 rounded-lg transition-all cursor-pointer"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Navigation / Modular Entry Points */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Shift Lab */}
        <div
          onClick={() => {
            playSoftSound('tap');
            setActiveTab('dashboard');
          }}
          className="group rounded-2xl bg-slate-900/70 border border-slate-800 p-5 hover:border-teal-500/50 hover:bg-slate-800/60 transition-all cursor-pointer shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 group-hover:text-teal-300 transition-colors">
            Shift Lab
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Your current theme, working model, active experiments, and past updates.
          </p>
        </div>

        {/* 16-Game Arcade */}
        <div
          onClick={() => {
            playSoftSound('tap');
            setActiveTab('arcade');
          }}
          className="group rounded-2xl bg-slate-900/70 border border-slate-800 p-5 hover:border-sky-500/50 hover:bg-slate-800/60 transition-all cursor-pointer shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3 group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-200 group-hover:text-sky-300 transition-colors">
              Reflection Arcade
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 border border-sky-600/30 text-sky-400">
              16 Engines (5 3D)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Fast, zero-typing drills: Fact vs Story, Both Can Be True, Pause Button, and more.
          </p>
        </div>

        {/* Skill Tree */}
        <div
          onClick={() => {
            playSoftSound('tap');
            setActiveTab('skills');
          }}
          className="group rounded-2xl bg-slate-900/70 border border-slate-800 p-5 hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all cursor-pointer shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
            <GitBranch className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
            Skill Tree
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Track practice depth across Self-Awareness, Perspective, Relationships, and Regulation.
          </p>
        </div>

        {/* Prediction Lab */}
        <div
          onClick={() => {
            playSoftSound('tap');
            setActiveTab('prediction-lab');
          }}
          className="group rounded-2xl bg-slate-900/70 border border-slate-800 p-5 hover:border-amber-500/50 hover:bg-slate-800/60 transition-all cursor-pointer shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
            <FlaskConical className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">
            Prediction Lab
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Log what your old system feared vs what actually happened in reality.
          </p>
        </div>
      </section>

      {/* Foundational Pillars */}
      <section className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-teal-400" />
          The SHIFT Disciplines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="space-y-1">
            <span className="font-semibold text-teal-300">1. Observe First, Interpret Second</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Camera-test what was said and done before letting automatic stories create certainty.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-sky-300">2. Feel Before Explaining</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Notice your immediate emotional impact and bodily reaction before rationalizing other people's motives.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-indigo-300">3. Hypotheses, Not Verdicts</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Protective rules were clever past solutions. You control whether a hypothesis fits your life today.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
