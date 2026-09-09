import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ReflectionRecord, ReflectionStep, EmotionEntry } from '../../types';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Plus,
  X,
  HelpCircle,
  Compass,
  FileCheck,
  BookmarkCheck,
  Zap,
  Gamepad2,
} from 'lucide-react';

const QUICK_PRESETS = [
  {
    title: 'Unanswered Slack Message',
    observedEvent:
      'Sent proposal in Slack at 10:15 AM. Marked as seen with no reply for 4 hours.',
    emotions: [
      { tag: 'Vulnerability', intensity: 7 },
      { tag: 'Anxiety', intensity: 6 },
    ],
    bodySensations: ['Tight throat', 'Shallow breathing'],
    urgesOrReactions: ['Check phone repeatedly', 'Draft nervous apology message'],
    needsOrValues: ['Clarity', 'Predictability'],
    desiredBoundaryOrRequest:
      'Give them until tomorrow morning before sending a brief, neutral follow-up.',
    supportiveNextStep: 'Close Slack tab and focus on deep creative work.',
    mindStory: 'They think the idea was amateurish and are judging my skills.',
    knownFacts: 'The message was viewed. No response was posted.',
    assumptions: 'They are annoyed or disappointed in me.',
    unknowns: 'Their calendar, meetings, deadlines, or competing priorities.',
    alternativeExplanations: [
      'They opened it between meetings and intend to reply later.',
      'They agree with it and forwarded it for leadership approval.',
    ],
    draftRuleCue: 'When someone does not reply to my message within a few hours',
    draftRulePrediction: 'I predict they are disappointed in me or rejecting my work',
    draftRuleResponse: 'So I panic, apologize, or obsessively check for notifications',
    ruleDraftFullText:
      'When someone does not reply immediately, I predict rejection, so I panic and over-apologize.',
    presentDayRuleUpdate:
      'Silence usually reflects their bandwidth, not my worth. I wait calmly and follow up only when needed.',
  },
  {
    title: 'Unexpected Meeting Pushback',
    observedEvent:
      'During team review, lead said: "This timeline looks unrealistic, we need to redo the estimates."',
    emotions: [
      { tag: 'Embarrassment', intensity: 8 },
      { tag: 'Defensiveness', intensity: 6 },
    ],
    bodySensations: ['Flushed face', 'Clenched jaw'],
    urgesOrReactions: ['Argue immediately', 'Withdraw and turn off video camera'],
    needsOrValues: ['Respect', 'Fairness', 'Professional competence'],
    desiredBoundaryOrRequest:
      'Ask for specific timeline concerns rather than taking it as a personal attack.',
    supportiveNextStep: 'Take a breath and ask: "Which milestone feels tightest?"',
    mindStory: 'They are calling me incompetent in front of the entire team.',
    knownFacts:
      'The lead stated the timeline looked unrealistic and requested revised estimates.',
    assumptions: 'They think I do not know how to manage projects.',
    unknowns: 'External client pressures or revised roadmap requirements.',
    alternativeExplanations: [
      'The lead has seen similar scope blowouts and wants to protect the team.',
      'It is a standard estimation calibration, not a performance critique.',
    ],
    draftRuleCue: 'When my work estimate is questioned in a group',
    draftRulePrediction: 'I predict I am being judged as incompetent',
    draftRuleResponse: 'So I counter-attack or freeze in humiliation',
    ruleDraftFullText:
      'When questioned publicly, I predict public shame, so I react defensively.',
    presentDayRuleUpdate:
      'Estimates are collaborative forecasts, not identity tests. I stay curious and ask for specifics.',
  },
  {
    title: 'After-Hours Scope Creep',
    observedEvent:
      'Received an urgent email at 7:30 PM asking for spreadsheet changes by tomorrow morning.',
    emotions: [
      { tag: 'Resentment', intensity: 7 },
      { tag: 'Anxiety', intensity: 8 },
    ],
    bodySensations: ['Stomach knot', 'Tension in shoulders'],
    urgesOrReactions: ['Immediately open laptop and work while feeling bitter'],
    needsOrValues: ['Rest', 'Restful sleep', 'Predictable work hours'],
    desiredBoundaryOrRequest:
      'I will review this first thing tomorrow morning at 8:30 AM.',
    supportiveNextStep: 'Close email client and resume personal evening plans.',
    mindStory: 'If I do not fix this tonight, I will be seen as uncommitted.',
    knownFacts: 'Email received at 7:30 PM requesting spreadsheet changes.',
    assumptions: 'They will punish or demote me if I do not work tonight.',
    unknowns: 'Whether this is truly urgent or just sent when top-of-mind.',
    alternativeExplanations: [
      'The sender was working late and cleared their inbox without expecting an instant reply.',
      'Tomorrow morning is completely acceptable.',
    ],
    draftRuleCue: 'When an urgent request arrives outside work hours',
    draftRulePrediction: 'I predict that saying no will destroy my reputation',
    draftRuleResponse: 'So I immediately sacrifice my evening and harbor silent resentment',
    ruleDraftFullText:
      'When requests arrive late, I predict disaster if I say no, so I always say yes.',
    presentDayRuleUpdate:
      'My rest is essential for high-quality work. Clear morning availability is professional.',
  },
];

export const ReflectFlow: React.FC = () => {
  const {
    reflections,
    rules,
    saveReflection,
    commitPrediction,
    recordOutcome,
    updatePresentDayRule,
    createOrUpdateRuleFromReflection,
    currentReflectionId,
    setCurrentReflectionId,
    setActiveTab,
    playSoftSound,
    setGroundingModalOpen,
  } = useApp();

  // Find existing or start fresh
  const activeRecord = reflections.find((r) => r.id === currentReflectionId);

  const [currentStep, setCurrentStep] = useState<ReflectionStep>('observe');
  const [formData, setFormData] = useState<ReflectionRecord>(() => {
    if (activeRecord) return activeRecord;
    const newId = `ref-${Date.now()}`;
    return {
      id: newId,
      title: 'New Reflection',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      observedEvent: '',
      whoWasInvolved: '',
      whereWasI: '',
      whatHappenedBefore: '',
      factsSeparatedFromAssumptions: true,
      emotions: [],
      bodySensations: [],
      urgesOrReactions: [],
      firstPersonNotes: '',
      needsOrValues: [],
      desiredBoundaryOrRequest: '',
      supportiveNextStep: '',
      mindStory: '',
      knownFacts: '',
      assumptions: '',
      unknowns: '',
      alternativeExplanations: ['', ''],
      draftRuleCue: '',
      draftRulePrediction: '',
      draftRuleResponse: '',
      ruleDraftFullText: '',
      userConfirmedRule: false,
      isCompleted: false,
      lastStepCompleted: 'observe',
    };
  });

  const [customEmotion, setCustomEmotion] = useState('');
  const [customIntensity, setCustomIntensity] = useState(6);
  const [customSensation, setCustomSensation] = useState('');
  const [customUrge, setCustomUrge] = useState('');
  const [customNeed, setCustomNeed] = useState('');
  const [ruleConfirmedStatus, setRuleConfirmedStatus] = useState<
    'idle' | 'fits' | 'editing' | 'does_not_fit' | 'keep_exploring'
  >('idle');

  // Prediction step state
  const [predAction, setPredAction] = useState('');
  const [predFeared, setPredFeared] = useState('');
  const [predOutcome, setPredOutcome] = useState('');
  const [predConfidence, setPredConfidence] = useState(70);

  // Outcome step state
  const [outcomeWhatHappened, setOutcomeWhatHappened] = useState('');
  const [outcomeRating, setOutcomeRating] = useState<
    ReflectionRecord['outcome'] extends { outcomeRating: infer T } ? T : any
  >('about_as_expected');
  const [outcomeFearedCheck, setOutcomeFearedCheck] = useState<
    'yes' | 'partly' | 'no' | 'different_entirely'
  >('no');
  const [outcomeDiscrepancy, setOutcomeDiscrepancy] = useState('');
  const [outcomeSuppEvidence, setOutcomeSuppEvidence] = useState('');
  const [outcomeChalEvidence, setOutcomeChalEvidence] = useState('');

  // Update step state
  const [updateChoice, setUpdateChoice] = useState<
    'keep' | 'narrow' | 'alternative' | 'unresolved' | 'practice_plan'
  >('alternative');
  const [presentDayRuleText, setPresentDayRuleText] = useState('');
  const [updateReason, setUpdateReason] = useState('');

  // Autosave when formData changes
  useEffect(() => {
    saveReflection(formData);
  }, [formData]);

  // Sync when active record loads
  useEffect(() => {
    if (activeRecord) {
      setFormData(activeRecord);
      if (activeRecord.prediction) {
        setPredAction(activeRecord.prediction.intendedAction || '');
        setPredFeared(activeRecord.prediction.fearedConsequence || '');
        setPredOutcome(activeRecord.prediction.predictedOutcome || '');
        setPredConfidence(activeRecord.prediction.confidencePercent || 70);
      }
      if (activeRecord.outcome) {
        setOutcomeWhatHappened(activeRecord.outcome.whatActuallyHappened || '');
        setOutcomeRating(activeRecord.outcome.outcomeRating || 'about_as_expected');
        setOutcomeFearedCheck(activeRecord.outcome.didFearedOutcomeHappen || 'no');
        setOutcomeDiscrepancy(activeRecord.outcome.discrepancySummary || '');
        setOutcomeSuppEvidence(activeRecord.outcome.evidenceSupportsOldRule || '');
        setOutcomeChalEvidence(activeRecord.outcome.evidenceChallengesOldRule || '');
      }
      if (activeRecord.presentDayRuleUpdate) {
        setPresentDayRuleText(activeRecord.presentDayRuleUpdate);
      }
    }
  }, [currentReflectionId]);

  // Gating rule: Interpret is locked until Observe, Name, and Need are completed
  const isObserveComplete = formData.observedEvent.trim().length > 0;
  const isNameComplete =
    formData.emotions.length > 0 ||
    formData.bodySensations.length > 0 ||
    formData.urgesOrReactions.length > 0 ||
    Boolean(formData.firstPersonNotes?.trim());
  const isNeedComplete =
    formData.needsOrValues.length > 0 ||
    Boolean(formData.desiredBoundaryOrRequest?.trim()) ||
    Boolean(formData.supportiveNextStep?.trim());
  const isInterpretUnlocked = isObserveComplete && isNameComplete && isNeedComplete;

  const stepsOrder: { id: ReflectionStep; label: string; locked: boolean }[] = [
    { id: 'observe', label: '1. Observe', locked: false },
    { id: 'name', label: '2. Name', locked: false },
    { id: 'need', label: '3. Need', locked: false },
    { id: 'interpret', label: '4. Interpret', locked: !isInterpretUnlocked },
    { id: 'rule', label: '5. Rule', locked: !isInterpretUnlocked },
    { id: 'predict', label: '6. Predict', locked: !isInterpretUnlocked },
    { id: 'outcome', label: '7. Outcome', locked: !isInterpretUnlocked },
    { id: 'update', label: '8. Update', locked: !isInterpretUnlocked },
  ];

  const currentStepIndex = stepsOrder.findIndex((s) => s.id === currentStep);

  const goToNextStep = () => {
    playSoftSound('tap');
    if (currentStepIndex < stepsOrder.length - 1) {
      const next = stepsOrder[currentStepIndex + 1];
      if (!next.locked) {
        setCurrentStep(next.id);
      }
    }
  };

  const goToPrevStep = () => {
    playSoftSound('tap');
    if (currentStepIndex > 0) {
      setCurrentStep(stepsOrder[currentStepIndex - 1].id);
    }
  };

  // Emotion Tag Helpers
  const addEmotion = (tag: string, intensity: number = 7) => {
    playSoftSound('tap');
    if (formData.emotions.some((e) => e.tag.toLowerCase() === tag.toLowerCase())) return;
    setFormData((prev) => ({
      ...prev,
      emotions: [...prev.emotions, { tag, intensity }],
    }));
  };

  const removeEmotion = (tag: string) => {
    playSoftSound('tap');
    setFormData((prev) => ({
      ...prev,
      emotions: prev.emotions.filter((e) => e.tag !== tag),
    }));
  };

  // Body Sensation Helpers
  const addSensation = (item: string) => {
    playSoftSound('tap');
    if (formData.bodySensations.includes(item)) return;
    setFormData((prev) => ({
      ...prev,
      bodySensations: [...prev.bodySensations, item],
    }));
  };

  const removeSensation = (item: string) => {
    playSoftSound('tap');
    setFormData((prev) => ({
      ...prev,
      bodySensations: prev.bodySensations.filter((s) => s !== item),
    }));
  };

  // Urge Helpers
  const addUrge = (item: string) => {
    playSoftSound('tap');
    if (formData.urgesOrReactions.includes(item)) return;
    setFormData((prev) => ({
      ...prev,
      urgesOrReactions: [...prev.urgesOrReactions, item],
    }));
  };

  const removeUrge = (item: string) => {
    playSoftSound('tap');
    setFormData((prev) => ({
      ...prev,
      urgesOrReactions: prev.urgesOrReactions.filter((u) => u !== item),
    }));
  };

  // Need Helpers
  const addNeed = (item: string) => {
    playSoftSound('tap');
    if (formData.needsOrValues.includes(item)) return;
    setFormData((prev) => ({
      ...prev,
      needsOrValues: [...prev.needsOrValues, item],
    }));
  };

  const removeNeed = (item: string) => {
    playSoftSound('tap');
    setFormData((prev) => ({
      ...prev,
      needsOrValues: prev.needsOrValues.filter((n) => n !== item),
    }));
  };

  // Handle rule confirmation
  const handleConfirmRuleFits = () => {
    playSoftSound('chime');
    const cue = formData.draftRuleCue || 'When tension or ambiguity occurs';
    const pred = formData.draftRulePrediction || 'I will be judged or rejected';
    const resp = formData.draftRuleResponse || 'I withdraw or appease';
    const full =
      formData.ruleDraftFullText ||
      `When ${cue}, I predict ${pred}, so I tend to ${resp}.`;

    const ruleId = createOrUpdateRuleFromReflection(
      {
        title: formData.title || 'Observed Protective Pattern',
        cueContext: cue,
        predictedConsequence: pred,
        protectiveResponse: resp,
        originalWording: full,
      },
      formData.id
    );

    setRuleConfirmedStatus('fits');
    setFormData((prev) => ({
      ...prev,
      protectiveRuleId: ruleId,
      ruleDraftFullText: full,
      userConfirmedRule: true,
    }));
  };

  // Commit Prediction
  const handleCommitPrediction = () => {
    if (!predFeared.trim() || !predAction.trim()) return;
    const ruleObj = rules.find((r) => r.id === formData.protectiveRuleId);
    commitPrediction(formData.id, {
      ruleId: formData.protectiveRuleId,
      cueContext: formData.draftRuleCue || formData.observedEvent.slice(0, 100),
      intendedAction: predAction,
      fearedConsequence: predFeared,
      predictedOutcome: predOutcome || predFeared,
      confidencePercent: predConfidence,
      ruleVersionNumber: ruleObj ? ruleObj.versionHistory.length : 1,
    });
    setFormData((prev) => ({
      ...prev,
      prediction: {
        id: `pred-${Date.now()}`,
        ruleId: prev.protectiveRuleId,
        reflectionId: prev.id,
        cueContext: prev.draftRuleCue || prev.observedEvent.slice(0, 100),
        intendedAction: predAction,
        fearedConsequence: predFeared,
        predictedOutcome: predOutcome || predFeared,
        confidencePercent: predConfidence,
        committedAt: new Date().toISOString(),
        ruleVersionNumber: 1,
        isImmutable: true,
      },
      lastStepCompleted: 'predict',
    }));
  };

  // Record Outcome
  const handleSaveOutcome = () => {
    if (!outcomeWhatHappened.trim() || !formData.prediction) return;
    recordOutcome(formData.id, {
      predictionId: formData.prediction.id,
      whatActuallyHappened: outcomeWhatHappened,
      outcomeRating: outcomeRating,
      didFearedOutcomeHappen: outcomeFearedCheck,
      discrepancySummary:
        outcomeDiscrepancy ||
        `Feared: ${formData.prediction.fearedConsequence}. Actual: ${outcomeWhatHappened}`,
      evidenceSupportsOldRule: outcomeSuppEvidence,
      evidenceChallengesOldRule: outcomeChalEvidence,
    });
    setFormData((prev) => ({
      ...prev,
      outcome: {
        id: `out-${Date.now()}`,
        predictionId: prev.prediction!.id,
        reflectionId: prev.id,
        whatActuallyHappened: outcomeWhatHappened,
        outcomeRating,
        didFearedOutcomeHappen: outcomeFearedCheck,
        discrepancySummary: outcomeDiscrepancy,
        evidenceSupportsOldRule: outcomeSuppEvidence,
        evidenceChallengesOldRule: outcomeChalEvidence,
        recordedAt: new Date().toISOString(),
      },
      lastStepCompleted: 'outcome',
    }));
  };

  // Complete Present-Day Update
  const handleSaveUpdate = () => {
    if (presentDayRuleText.trim() && formData.protectiveRuleId) {
      updatePresentDayRule(
        formData.protectiveRuleId,
        presentDayRuleText.trim(),
        updateReason || 'Updated from reflection outcome review'
      );
    }
    setFormData((prev) => ({
      ...prev,
      presentDayRuleUpdate: presentDayRuleText,
      updateActionTaken: updateChoice,
      isCompleted: true,
      lastStepCompleted: 'update',
    }));
    playSoftSound('complete');
  };

  const loadPreset = (preset: (typeof QUICK_PRESETS)[0]) => {
    playSoftSound('chime');
    setFormData((prev) => ({
      ...prev,
      title: preset.title,
      observedEvent: preset.observedEvent,
      emotions: preset.emotions,
      bodySensations: preset.bodySensations,
      urgesOrReactions: preset.urgesOrReactions,
      needsOrValues: preset.needsOrValues,
      desiredBoundaryOrRequest: preset.desiredBoundaryOrRequest,
      supportiveNextStep: preset.supportiveNextStep,
      mindStory: preset.mindStory,
      knownFacts: preset.knownFacts,
      assumptions: preset.assumptions,
      unknowns: preset.unknowns,
      alternativeExplanations: preset.alternativeExplanations,
      draftRuleCue: preset.draftRuleCue,
      draftRulePrediction: preset.draftRulePrediction,
      draftRuleResponse: preset.draftRuleResponse,
      ruleDraftFullText: preset.ruleDraftFullText,
      presentDayRuleUpdate: preset.presentDayRuleUpdate,
      userConfirmedRule: true,
      lastStepCompleted: 'update',
      isCompleted: true,
    }));
    setPredAction(preset.desiredBoundaryOrRequest);
    setPredFeared(preset.draftRulePrediction);
    setPredOutcome(preset.presentDayRuleUpdate);
    setPresentDayRuleText(preset.presentDayRuleUpdate);
    setCurrentStep('observe');
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-8">
      {/* Top Breadcrumb / Stage Navigation */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-mono uppercase tracking-wider text-teal-400 font-semibold">
            Guided Reflection Console
          </span>
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Autosaved locally</span>
          </div>
        </div>

        {/* Progress Bar Steps */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 sm:gap-2">
          {stepsOrder.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isPassed = currentStepIndex > idx;
            return (
              <button
                key={step.id}
                disabled={step.locked}
                onClick={() => {
                  playSoftSound('tap');
                  setCurrentStep(step.id);
                }}
                className={`py-2 px-1 rounded-lg text-center text-xs font-mono transition-all flex flex-col items-center justify-center relative ${
                  isActive
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold shadow-sm'
                    : isPassed
                    ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                    : step.locked
                    ? 'bg-slate-950/50 text-slate-600 border border-slate-900 cursor-not-allowed'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="truncate w-full text-[11px]">{step.label}</span>
                {step.locked && (
                  <Lock className="w-2.5 h-2.5 text-slate-600 absolute top-1 right-1" />
                )}
                {isPassed && (
                  <CheckCircle2 className="w-2.5 h-2.5 text-teal-400 absolute top-1 right-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1-Tap Scenario Presets (Zero Typing) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-300 font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>1-Tap Scenario Presets (Skip Typing)</span>
          </div>
          <p className="text-xs text-slate-400">
            Tap a real-life situation to load all 8 stages instantly, or practice directly in Arcade:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {QUICK_PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => loadPreset(p)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-teal-500/20 text-slate-200 hover:text-teal-300 border border-slate-700 hover:border-teal-500/40 text-xs font-mono transition-colors"
            >
              ⚡ {p.title}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('arcade')}
            className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-teal-500/20"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Play Arcade Now →</span>
          </button>
        </div>
      </div>

      {/* Main Step Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* STEP 1: OBSERVE */}
        {currentStep === 'observe' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400 font-semibold mb-1">
                <span>Stage 1</span>
                <span>•</span>
                <span>The Camera Test</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                What happened?
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                Write only what you directly observed or experienced. Save interpretations, assumed motives, and conclusions for later.
              </p>
            </div>

            {/* Prompt Chips */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-2">
                Click prompt chips to anchor observable facts:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'What was said or done verbatim?',
                  'Where was I physically?',
                  'Who was involved?',
                  'What happened right before this?',
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      playSoftSound('tap');
                      setFormData((prev) => ({
                        ...prev,
                        observedEvent: prev.observedEvent
                          ? `${prev.observedEvent}\n• ${chip.replace('?', ': ')}`
                          : `• ${chip.replace('?', ': ')}`,
                      }));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-300 border border-slate-700 transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Area */}
            <div>
              <textarea
                id="reflect-observe-input"
                rows={5}
                value={formData.observedEvent}
                onChange={(e) =>
                  setFormData({ ...formData, observedEvent: e.target.value })
                }
                placeholder="Example: During our Monday 10 AM sync, my manager paused after looking at my slide and asked: 'Could we verify the client feedback on this?' in a neutral tone."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/50 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 leading-relaxed outline-none"
              />
            </div>

            {/* Quick Context Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Who was present / involved? (optional)
                </label>
                <input
                  type="text"
                  value={formData.whoWasInvolved || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, whoWasInvolved: e.target.value })
                  }
                  placeholder="e.g. My partner, Team of 6, Colleague Alex"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-teal-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Where did this take place? (optional)
                </label>
                <input
                  type="text"
                  value={formData.whereWasI || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, whereWasI: e.target.value })
                  }
                  placeholder="e.g. Living room, Video call, Office kitchen"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-teal-500/50"
                />
              </div>
            </div>

            {/* Why This Matters Box */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 leading-relaxed flex items-start gap-3">
              <HelpCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Why this matters:</strong>{' '}
                Our nervous system routinely confuses sensory reality with mental narration. Sticking strictly to what a video camera could capture interrupts catastrophic assumptions before they trigger defensive reflexes.
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: NAME */}
        {currentStep === 'name' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold mb-1">
                <span>Stage 2</span>
                <span>•</span>
                <span>First-Person Response</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                What did you feel or notice in yourself?
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                Name your emotional response, somatic bodily reactions, and any immediate impulsive urges.
              </p>
            </div>

            {/* Emotion Tags */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block">
                Emotion Labels (Affect Labeling):
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Anger',
                  'Shame',
                  'Fear',
                  'Sadness',
                  'Numbness',
                  'Vulnerability',
                  'Disappointment',
                  'Anxiety',
                  'Guilt',
                ].map((emo) => {
                  const isSelected = formData.emotions.some(
                    (e) => e.tag.toLowerCase() === emo.toLowerCase()
                  );
                  return (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => (isSelected ? removeEmotion(emo) : addEmotion(emo))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {emo} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>

              {/* Selected Emotions with Intensity Sliders */}
              {formData.emotions.length > 0 && (
                <div className="mt-3 space-y-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-mono text-slate-400 block">
                    Adjust Emotional Intensity (1 = subtle, 10 = peak surge):
                  </span>
                  {formData.emotions.map((item) => (
                    <div
                      key={item.tag}
                      className="flex items-center justify-between gap-4 text-xs"
                    >
                      <span className="text-slate-200 font-semibold w-24">
                        {item.tag}
                      </span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={item.intensity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData((prev) => ({
                            ...prev,
                            emotions: prev.emotions.map((em) =>
                              em.tag === item.tag ? { ...em, intensity: val } : em
                            ),
                          }));
                        }}
                        className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <span className="font-mono text-indigo-300 w-8 text-right">
                        {item.intensity}/10
                      </span>
                      <button
                        onClick={() => removeEmotion(item.tag)}
                        className="text-slate-500 hover:text-slate-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Somatic Signals */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block">
                Physical / Bodily Sensations:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Tight chest',
                  'Racing heart',
                  'Lump in throat',
                  'Hollow stomach',
                  'Shoulder tension',
                  'Shallow breathing',
                  'Heat in face',
                  'Clenched jaw',
                ].map((sensation) => {
                  const isSelected = formData.bodySensations.includes(sensation);
                  return (
                    <button
                      key={sensation}
                      type="button"
                      onClick={() =>
                        isSelected ? removeSensation(sensation) : addSensation(sensation)
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {sensation} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Impulsive Reaction Urges */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block">
                Initial Impulses or Urges:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Urge to withdraw / go silent',
                  'Urge to argue / defend',
                  'Urge to over-explain',
                  'Urge to appease / say yes',
                  'Urge to disappear',
                  'Urge to lash out',
                ].map((urge) => {
                  const isSelected = formData.urgesOrReactions.includes(urge);
                  return (
                    <button
                      key={urge}
                      type="button"
                      onClick={() => (isSelected ? removeUrge(urge) : addUrge(urge))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {urge} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Free Notes */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Additional first-person observations:
              </label>
              <textarea
                rows={2}
                value={formData.firstPersonNotes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, firstPersonNotes: e.target.value })
                }
                placeholder="What did you feel happening internally in the exact second it took place?"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/50"
              />
            </div>

            {/* Why This Matters Box */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 leading-relaxed flex items-start gap-3">
              <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Why this matters:</strong>{' '}
                Neuroscience demonstrates that affect labeling (naming discrete sensations and feelings) shifts brain activation from amygdala reactivity to prefrontal cognitive control.
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: NEED / BOUNDARY */}
        {currentStep === 'need' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400 font-semibold mb-1">
                <span>Stage 3</span>
                <span>•</span>
                <span>Needs & Boundaries</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                What did you need, want, or need to protect?
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                Identify the core value, boundary, or supportive next step that would genuinely support your wellbeing.
              </p>
            </div>

            {/* Prompt Chips */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-2">
                Common Core Needs & Values:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Respect',
                  'Clarity',
                  'Space',
                  'Safety',
                  'Support',
                  'Time to process',
                  'Fairness',
                  'A clear boundary',
                  'A direct conversation',
                ].map((need) => {
                  const isSelected = formData.needsOrValues.includes(need);
                  return (
                    <button
                      key={need}
                      type="button"
                      onClick={() => (isSelected ? removeNeed(need) : addNeed(need))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {need} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                What boundary, request, or personal limit would support you here?
              </label>
              <textarea
                rows={3}
                value={formData.desiredBoundaryOrRequest || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    desiredBoundaryOrRequest: e.target.value,
                  })
                }
                placeholder="e.g. I need clarity on expectations before agreeing. Or: I need to step away from heated tones."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/60 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 leading-relaxed outline-none"
              />
            </div>

            {/* Why This Matters Box */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 leading-relaxed flex items-start gap-3">
              <HelpCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Why this matters:</strong>{' '}
                Before you analyze what another person meant, you must anchor in what you needed. Unmet needs drive anxiety; naming them restores self-advocacy.
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: INTERPRET */}
        {currentStep === 'interpret' && (
          <div className="space-y-6">
            {!isInterpretUnlocked ? (
              <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-900/60 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <h3 className="text-lg font-bold text-amber-200">
                  Sequence Gate Locked
                </h3>
                <p className="text-xs text-amber-300/80 max-w-md mx-auto leading-relaxed">
                  To keep reflection grounded, SHIFT requires completing Observation, Emotional Response, and Need / Boundary before opening interpretation.
                </p>
                <button
                  onClick={() => setCurrentStep('observe')}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium"
                >
                  Return to Observation
                </button>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold mb-1">
                    <span>Stage 4</span>
                    <span>•</span>
                    <span>Exploring the Mind’s Narrative</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    What story did your mind make about this?
                  </h2>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                    <p>
                      • <strong className="text-sky-300">An interpretation can be useful without being proven.</strong>
                    </p>
                    <p>
                      • Stay curious; do not treat a guess about another person’s motives as a fact.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    What narrative did your brain spin?
                  </label>
                  <textarea
                    rows={3}
                    value={formData.mindStory}
                    onChange={(e) =>
                      setFormData({ ...formData, mindStory: e.target.value })
                    }
                    placeholder="e.g. My mind told me: 'They are annoyed with me, think I’m incompetent, and will look for someone else.'"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500/60 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 outline-none"
                  />
                </div>

                {/* Quad breakdown: Known, Assumption, Unknown, Alternative */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <label className="text-xs font-mono text-teal-400 font-semibold block">
                      What do I actually KNOW for certain?
                    </label>
                    <textarea
                      rows={2}
                      value={formData.knownFacts}
                      onChange={(e) =>
                        setFormData({ ...formData, knownFacts: e.target.value })
                      }
                      placeholder="Only verified physical facts"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <label className="text-xs font-mono text-amber-400 font-semibold block">
                      What am I ASSUMING about their intent?
                    </label>
                    <textarea
                      rows={2}
                      value={formData.assumptions}
                      onChange={(e) =>
                        setFormData({ ...formData, assumptions: e.target.value })
                      }
                      placeholder="Guesses about their feelings, motives, thoughts"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <label className="text-xs font-mono text-slate-400 font-semibold block">
                      What is still UNKNOWN?
                    </label>
                    <textarea
                      rows={2}
                      value={formData.unknowns}
                      onChange={(e) =>
                        setFormData({ ...formData, unknowns: e.target.value })
                      }
                      placeholder="Missing information, their schedule, stressors"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <label className="text-xs font-mono text-indigo-400 font-semibold block">
                      Two other possible explanations:
                    </label>
                    <input
                      type="text"
                      value={formData.alternativeExplanations[0] || ''}
                      onChange={(e) => {
                        const next = [...formData.alternativeExplanations];
                        next[0] = e.target.value;
                        setFormData({ ...formData, alternativeExplanations: next });
                      }}
                      placeholder="Alternative 1: They might be stressed by deadlines"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none mb-1.5"
                    />
                    <input
                      type="text"
                      value={formData.alternativeExplanations[1] || ''}
                      onChange={(e) => {
                        const next = [...formData.alternativeExplanations];
                        next[1] = e.target.value;
                        setFormData({ ...formData, alternativeExplanations: next });
                      }}
                      placeholder="Alternative 2: Their comment was about the slide layout, not me"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 5: RULE */}
        {currentStep === 'rule' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold mb-1">
                <span>Stage 5</span>
                <span>•</span>
                <span>The Protective Rule</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                What old protective rule may have activated here?
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                A protective rule is a learned survival heuristic that once kept you safe. This is a working hypothesis you confirm or reject—not an AI diagnosis.
              </p>
            </div>

            {/* The Formula Builder */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-bold">
                Pattern Rule Format
              </span>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-400 text-xs font-mono block mb-1">
                    When [cue / context] happens:
                  </span>
                  <input
                    type="text"
                    value={formData.draftRuleCue || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, draftRuleCue: e.target.value })
                    }
                    placeholder="e.g. Someone seems disappointed or quiet"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <span className="text-slate-400 text-xs font-mono block mb-1">
                    I predict [feared consequence]:
                  </span>
                  <input
                    type="text"
                    value={formData.draftRulePrediction || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        draftRulePrediction: e.target.value,
                      })
                    }
                    placeholder="e.g. They will reject or abandon me"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <span className="text-slate-400 text-xs font-mono block mb-1">
                    So I tend to [protective response]:
                  </span>
                  <input
                    type="text"
                    value={formData.draftRuleResponse || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        draftRuleResponse: e.target.value,
                      })
                    }
                    placeholder="e.g. Over-explain, appease, or avoid speaking up"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Formatted Preview */}
              <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  Draft Working Rule:
                </span>
                <p className="text-sm font-serif italic text-teal-200">
                  "{formData.draftRuleCue ? `When ${formData.draftRuleCue}, ` : 'When [cue], '}
                  {formData.draftRulePrediction
                    ? `I predict ${formData.draftRulePrediction}, `
                    : 'I predict [consequence], '}
                  {formData.draftRuleResponse
                    ? `so I tend to ${formData.draftRuleResponse}.`
                    : 'so I tend to [response].'}"
                </p>
              </div>

              {/* User Confirmation Buttons */}
              <div className="pt-2">
                <div className="text-xs text-slate-400 mb-2">
                  Does this working hypothesis fit what happened?
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmRuleFits}
                    className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>This fits (Save to Pattern Lab)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSoftSound('tap');
                      setRuleConfirmedStatus('editing');
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    Edit wording
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSoftSound('tap');
                      setRuleConfirmedStatus('does_not_fit');
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    This does not fit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSoftSound('tap');
                      setRuleConfirmedStatus('keep_exploring');
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    Keep exploring
                  </button>
                </div>
              </div>

              {ruleConfirmedStatus === 'fits' && (
                <div className="p-3 bg-teal-950/40 border border-teal-800/50 rounded-lg text-xs text-teal-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Rule saved to your private Pattern Lab for this reflection!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 6: PREDICT */}
        {currentStep === 'predict' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold mb-1">
                <span>Stage 6</span>
                <span>•</span>
                <span>Pre-Action Prediction Commitment</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                If you try a different next step, what do you predict will happen?
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                Lock in your honest prediction BEFORE you act or know what happens. This prevents hindsight bias and creates real empirical evidence.
              </p>
            </div>

            {formData.prediction?.isImmutable ? (
              <div className="p-5 rounded-2xl bg-slate-950 border border-teal-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
                    <BookmarkCheck className="w-5 h-5 text-teal-400" />
                    <span>Prediction Committed & Locked</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Committed: {new Date(formData.prediction.committedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-slate-200">
                  <p>
                    <strong>Intended Action:</strong> {formData.prediction.intendedAction}
                  </p>
                  <p>
                    <strong>Feared Consequence:</strong> {formData.prediction.fearedConsequence}
                  </p>
                  <p>
                    <strong>Predicted Outcome:</strong> {formData.prediction.predictedOutcome}
                  </p>
                  <p>
                    <strong>Fear Confidence:</strong> {formData.prediction.confidencePercent}%
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                  Note: The original prediction remains visible for honest comparison when you record the outcome later.
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    What different, healthier response or boundary will you try?
                  </label>
                  <input
                    type="text"
                    value={predAction}
                    onChange={(e) => setPredAction(e.target.value)}
                    placeholder="e.g. Ask for clarification directly rather than withdrawing"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    What is the worst-case consequence you fear?
                  </label>
                  <input
                    type="text"
                    value={predFeared}
                    onChange={(e) => setPredFeared(e.target.value)}
                    placeholder="e.g. They will be angry and say I’m causing trouble"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Specific prediction statement:
                  </label>
                  <textarea
                    rows={2}
                    value={predOutcome}
                    onChange={(e) => setPredOutcome(e.target.value)}
                    placeholder="What exact reaction or event do you predict will take place?"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>How strongly do you believe this fear right now?</span>
                    <span className="font-mono text-sky-400 font-bold">{predConfidence}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={predConfidence}
                    onChange={(e) => setPredConfidence(Number(e.target.value))}
                    className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!predAction.trim() || !predFeared.trim()}
                    onClick={handleCommitPrediction}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <BookmarkCheck className="w-4 h-4 text-slate-950" />
                    <span>Commit Prediction</span>
                  </button>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Once committed, the prediction is timestamped and locked so you can compare it with reality later.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 7: OUTCOME */}
        {currentStep === 'outcome' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold mb-1">
                <span>Stage 7</span>
                <span>•</span>
                <span>Comparing Reality With Prediction</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                What actually happened?
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                Compare the actual event against what was predicted. This can be filled immediately or later after the situation has unfolded.
              </p>
            </div>

            {formData.prediction && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 font-mono text-[10px] uppercase">
                  Locked Prediction to Compare:
                </span>
                <p className="text-slate-200 mt-1">
                  "{formData.prediction.predictedOutcome || formData.prediction.fearedConsequence}"
                </p>
              </div>
            )}

            <div className="space-y-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  What happened in reality?
                </label>
                <textarea
                  rows={3}
                  value={outcomeWhatHappened}
                  onChange={(e) => setOutcomeWhatHappened(e.target.value)}
                  placeholder="Record what was said, how they reacted, or what actually transpired."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 outline-none focus:border-teal-500"
                />
              </div>

              {/* Outcome Choices */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-2">
                  Outcome relative to expectation:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'better_than_expected', label: 'Better than expected' },
                    { id: 'about_as_expected', label: 'About as expected' },
                    { id: 'worse_than_expected', label: 'Worse than expected' },
                    { id: 'mixed_partly_true', label: 'Mixed / partly true' },
                    { id: 'still_unfolding', label: 'Still unfolding' },
                    { id: 'not_sure', label: 'Not sure' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        playSoftSound('tap');
                        setOutcomeRating(opt.id as any);
                      }}
                      className={`p-2.5 rounded-lg border text-center font-medium transition-colors ${
                        outcomeRating === opt.id
                          ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Did feared outcome happen? */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-2">
                  Did the feared outcome happen?
                </label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { id: 'no', label: 'No, did not happen' },
                    { id: 'partly', label: 'Partly happened' },
                    { id: 'yes', label: 'Yes, it happened' },
                    { id: 'different_entirely', label: 'Different entirely' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        playSoftSound('tap');
                        setOutcomeFearedCheck(opt.id as any);
                      }}
                      className={`px-3 py-1.5 rounded-lg border transition-colors ${
                        outcomeFearedCheck === opt.id
                          ? 'bg-teal-500/20 border-teal-400 text-teal-300 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discrepancy & Evidence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Evidence challenging old rule:
                  </label>
                  <input
                    type="text"
                    value={outcomeChalEvidence}
                    onChange={(e) => setOutcomeChalEvidence(e.target.value)}
                    placeholder="e.g. They thanked me for speaking up"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Evidence supporting old rule (if any):
                  </label>
                  <input
                    type="text"
                    value={outcomeSuppEvidence}
                    onChange={(e) => setOutcomeSuppEvidence(e.target.value)}
                    placeholder="e.g. There was initial awkwardness"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={!outcomeWhatHappened.trim()}
                  onClick={handleSaveOutcome}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Save Outcome Comparison
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: UPDATE */}
        {currentStep === 'update' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold mb-1">
                <span>Stage 8</span>
                <span>•</span>
                <span>The Present-Day Rule</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                What does this experience suggest about your rule now?
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                Preserve your original protective rule as a meaningful chapter, and craft an updated present-day alternative that reflects current reality.
              </p>
            </div>

            {/* Version Card Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-400 font-bold uppercase">Original Protective Rule</span>
                  <span className="text-slate-500">v1 (Preserved)</span>
                </div>
                <p className="text-xs text-slate-300 italic font-serif leading-relaxed">
                  "{formData.ruleDraftFullText || 'When [cue], I predict [danger], so I [protect].'}"
                </p>
                <div className="text-[11px] text-slate-500">
                  Learned in past environments to keep you safe.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-teal-300 font-bold uppercase">Present-Day Rule</span>
                  <span className="text-teal-500">v2 (Current)</span>
                </div>
                <p className="text-xs text-teal-100 font-medium leading-relaxed">
                  {presentDayRuleText ||
                    'Craft your resilient present-day alternative below...'}
                </p>
                <div className="text-[11px] text-teal-400/80">
                  Anchored in both realistic expectations and internal coping ability.
                </div>
              </div>
            </div>

            {/* Rule Update Options */}
            <div className="space-y-3">
              <label className="text-xs font-mono text-slate-400 block">
                Choose action for this rule:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'alternative', label: 'Create present-day alternative' },
                  { id: 'narrow', label: 'Narrow the rule' },
                  { id: 'keep', label: 'Keep current rule' },
                  { id: 'practice_plan', label: 'Create a practice plan' },
                  { id: 'unresolved', label: 'Leave unresolved' },
                ].map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      playSoftSound('tap');
                      setUpdateChoice(act.id as any);
                    }}
                    className={`p-2 rounded-lg border text-center font-medium transition-colors ${
                      updateChoice === act.id
                        ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Present-Day Rule Input */}
            <div className="space-y-3">
              <label className="text-xs font-mono text-slate-400 block">
                Write your present-day rule:
              </label>
              <textarea
                rows={3}
                value={presentDayRuleText}
                onChange={(e) => setPresentDayRuleText(e.target.value)}
                placeholder="Example: Some people may react poorly when I speak up, but I can communicate clearly, choose safe people, and handle discomfort."
                className="w-full bg-slate-950/90 border border-teal-500/50 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 leading-relaxed outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSaveUpdate}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Save Reflection & Updated Rule</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playSoftSound('tap');
                  setActiveTab('patterns');
                }}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                View in Pattern Lab
              </button>
              <button
                type="button"
                onClick={() => {
                  playSoftSound('tap');
                  setActiveTab('arcade');
                }}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-medium border border-slate-700 transition-colors"
              >
                Practice in Arcade
              </button>
            </div>
          </div>
        )}

        {/* Footer Navigation Bar for Flow */}
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-800">
          <button
            id="reflect-prev-btn"
            disabled={currentStepIndex === 0}
            onClick={goToPrevStep}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Stage</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playSoftSound('ground');
                setGroundingModalOpen(true);
              }}
              className="text-xs text-slate-400 hover:text-teal-300 underline font-mono"
            >
              Need a pause?
            </button>

            {currentStepIndex < stepsOrder.length - 1 && (
              <button
                id="reflect-next-btn"
                onClick={goToNextStep}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 transition-all hover:border-teal-500/40"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 text-teal-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
