import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Compass, Sparkles, CheckCircle2, BookmarkPlus, ArrowRight, Zap } from 'lucide-react';

interface RehearsalScenario {
  id: string;
  title: string;
  cue: string;
  historicalResponse: string;
  suggestedActions: string[];
  suggestedPredictions: string[];
}

const REHEARSAL_SCENARIOS: RehearsalScenario[] = [
  {
    id: 'sc-1',
    title: 'The Ambiguous Silence',
    cue: 'You share an idea in a meeting and nobody comments for 5 seconds before the host moves to the next slide.',
    historicalResponse: 'Conclude you sounded foolish, feel a hot flush of shame, and vow never to speak up again.',
    suggestedActions: [
      'Take a full breath and let the silence sit without filling it with an apology.',
      'Unmute and say: "I can drop a 2-bullet summary in Slack if anyone wants to revisit that later."',
      'Notice the urge to panic, name it as "ambiguity anxiety", and stay engaged in the meeting.',
    ],
    suggestedPredictions: [
      'People will appreciate the point asynchronously, or the meeting will proceed normally.',
      'A colleague might reach out later to discuss the idea.',
      'Even if ignored, my professional credibility remains intact.',
    ],
  },
  {
    id: 'sc-2',
    title: 'The Last-Minute Scope Expansion',
    cue: 'A manager or client messages at 4:55 PM: "Could you quickly handle this additional report tonight?"',
    historicalResponse: 'Say "Sure thing!", cancel personal dinner plans, and harbor silent resentment.',
    suggestedActions: [
      'Reply: "I am wrapping up for today. I can prioritize this first thing tomorrow at 9 AM."',
      'Reply: "I can look at this tonight if we push tomorrow morning’s deliverable back."',
      'Pause for 10 minutes before replying to let the immediate urgency adrenaline settle.',
    ],
    suggestedPredictions: [
      'They will say tomorrow morning is fine.',
      'They might express mild urgency, but will respect the clear boundary.',
      'I will enjoy my evening without lingering guilt.',
    ],
  },
  {
    id: 'sc-3',
    title: 'The Emotionally Charged Criticism',
    cue: 'A close friend or partner snaps: "You never listen when I tell you what matters to me."',
    historicalResponse: 'Immediately counter-attack with a list of all the ways they failed to listen last week.',
    suggestedActions: [
      'Take a grounding breath and ask: "Can you tell me what felt missed just now?"',
      'Say: "I hear how frustrated you are. I want to understand, but let’s take a 15-minute reset."',
      'Drop my defensive posture, unclench my hands, and listen without interrupting.',
    ],
    suggestedPredictions: [
      'The conversation will de-escalate once they feel heard.',
      'We will have a constructive conversation instead of a shouting match.',
      'I will feel proud of staying grounded even during emotional tension.',
    ],
  },
];

export const ScenarioReplayMode: React.FC<{ onCompleteSession?: () => void }> = ({
  onCompleteSession,
}) => {
  const { playSoftSound, logPracticeSession, saveReflection, setActiveTab } = useApp();
  const [index, setIndex] = useState(0);

  const scenario = REHEARSAL_SCENARIOS[index];

  const [selectedAction, setSelectedAction] = useState<string>(scenario.suggestedActions[0]);
  const [selectedPrediction, setSelectedPrediction] = useState<string>(
    scenario.suggestedPredictions[0]
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Switch scenario resets choices
  const handleNext = () => {
    playSoftSound('tap');
    const nextIdx = index < REHEARSAL_SCENARIOS.length - 1 ? index + 1 : 0;
    setIndex(nextIdx);
    setSelectedAction(REHEARSAL_SCENARIOS[nextIdx].suggestedActions[0]);
    setSelectedPrediction(REHEARSAL_SCENARIOS[nextIdx].suggestedPredictions[0]);
    setSavedSuccess(false);
    if (index === REHEARSAL_SCENARIOS.length - 1 && onCompleteSession) {
      onCompleteSession();
    }
  };

  const handleSaveAsExperiment = () => {
    playSoftSound('complete');

    const newRefId = `ref-exp-${Date.now()}`;
    saveReflection({
      id: newRefId,
      title: `Experiment: ${scenario.title}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      observedEvent: scenario.cue,
      factsSeparatedFromAssumptions: true,
      emotions: [{ tag: 'Vulnerability', intensity: 6 }],
      bodySensations: ['Alertness'],
      urgesOrReactions: [],
      firstPersonNotes: 'Created via Scenario Replay practice',
      needsOrValues: ['Clarity', 'Fairness'],
      desiredBoundaryOrRequest: selectedAction,
      supportiveNextStep: selectedAction,
      mindStory: scenario.historicalResponse,
      knownFacts: scenario.cue,
      assumptions: 'Old habitual fear',
      unknowns: 'Actual response to new boundary',
      alternativeExplanations: ['They may welcome clarity', 'They may just be busy'],
      draftRuleCue: scenario.cue,
      draftRulePrediction: 'Old fear',
      draftRuleResponse: scenario.historicalResponse,
      ruleDraftFullText: `When ${scenario.cue}, I choose to ${selectedAction}`,
      userConfirmedRule: true,
      prediction: {
        id: `pred-${Date.now()}`,
        reflectionId: newRefId,
        cueContext: scenario.cue,
        intendedAction: selectedAction,
        fearedConsequence: 'Discomfort or pushback',
        predictedOutcome: selectedPrediction,
        confidencePercent: 65,
        committedAt: new Date().toISOString(),
        ruleVersionNumber: 1,
        isImmutable: true,
      },
      isCompleted: false,
      lastStepCompleted: 'predict',
    });

    logPracticeSession({
      mode: 'scenario_replay',
      durationSeconds: 60,
      itemsAttempted: 1,
      userRating: 'easy',
    });

    setSavedSuccess(true);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-teal-400 font-semibold uppercase tracking-wider">
            Mode 8: Scenario Replay
          </span>
          <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 text-[10px] border border-teal-500/30 flex items-center gap-1 font-sans">
            <Zap className="w-3 h-3" /> 1-Tap Rehearsal
          </span>
        </div>
        <span>
          Scenario {index + 1} of {REHEARSAL_SCENARIOS.length}
        </span>
      </div>

      {/* Scenario Cue */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <span className="text-xs font-mono uppercase text-sky-400 font-semibold">
          {scenario.title}
        </span>
        <p className="text-base text-slate-100 font-medium leading-relaxed font-serif">
          "{scenario.cue}"
        </p>

        <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl text-xs text-amber-300/80">
          <strong className="text-amber-200">Knee-Jerk Reflex:</strong> {scenario.historicalResponse}
        </div>
      </div>

      {/* 1-Tap Action Selector */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-mono text-teal-300 font-semibold block mb-2">
            1. Tap your chosen present-day response move:
          </label>
          <div className="space-y-2">
            {scenario.suggestedActions.map((act, i) => (
              <button
                key={i}
                onClick={() => {
                  playSoftSound('tap');
                  setSelectedAction(act);
                }}
                className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-2.5 ${
                  selectedAction === act
                    ? 'bg-teal-950/40 border-teal-400 text-teal-100 font-medium shadow-sm shadow-teal-500/10'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 text-teal-400 font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  {selectedAction === act ? '✓' : i + 1}
                </span>
                <span>{act}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 1-Tap Prediction Selector */}
        <div>
          <label className="text-xs font-mono text-sky-300 font-semibold block mb-2">
            2. Tap your realistic predicted outcome:
          </label>
          <div className="space-y-2">
            {scenario.suggestedPredictions.map((pred, i) => (
              <button
                key={i}
                onClick={() => {
                  playSoftSound('tap');
                  setSelectedPrediction(pred);
                }}
                className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-2.5 ${
                  selectedPrediction === pred
                    ? 'bg-sky-950/40 border-sky-400 text-sky-100 font-medium shadow-sm shadow-sky-500/10'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 text-sky-400 font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  {selectedPrediction === pred ? '✓' : i + 1}
                </span>
                <span>{pred}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={handleSaveAsExperiment}
            disabled={savedSuccess}
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-teal-500/20"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>{savedSuccess ? 'Saved as Experiment!' : 'Commit Replay as Experiment'}</span>
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1"
          >
            <span>Next Scenario</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-teal-950/40 border border-teal-800/60 rounded-xl text-xs text-teal-300 flex items-center justify-between">
            <span>Experiment committed to your journal. Ready to test in real life!</span>
            <button
              onClick={() => setActiveTab('review')}
              className="underline text-teal-200 font-semibold text-[11px]"
            >
              View in Review
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
