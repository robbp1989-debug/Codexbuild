import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ProtectiveRule,
  ReflectionRecord,
  BoundaryCard,
  PracticeSession,
  PredictionRecord,
  OutcomeRecord,
  ShiftBreakdown,
  EpistemicMemoryItem,
  SkillNode,
  ArcadeModeType,
  MemoryType,
  EpistemicTag,
  RuleVersion,
} from '../types';
import {
  INITIAL_RULES,
  INITIAL_REFLECTIONS,
  INITIAL_BOUNDARIES,
  INITIAL_PRACTICE_SESSIONS,
  INITIAL_SKILL_TREE,
  INITIAL_EPISTEMIC_MEMORY,
  INITIAL_DEMO_SHIFTS,
} from '../data/initialData';

interface GamePersonalizationContext {
  gameId: ArcadeModeType;
  title?: string;
  theme?: string;
  scenarioText?: string;
  customItems?: any[];
  sourceShiftId?: string;
}

interface AppContextType {
  // Navigation & View
  activeTab: string;
  setActiveTab: (tab: string) => void;
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  playSoftSound: (type?: 'chime' | 'tap' | 'ground' | 'complete') => void;

  // Active Shift & Breakdown
  shifts: ShiftBreakdown[];
  activeShift: ShiftBreakdown | null;
  setActiveShift: (shift: ShiftBreakdown | null) => void;
  saveShiftBreakdown: (breakdown: ShiftBreakdown) => void;
  updateShiftBreakdown: (id: string, updates: Partial<ShiftBreakdown>) => void;
  deleteShift: (id: string) => void;

  // Epistemic Memory
  memoryItems: EpistemicMemoryItem[];
  addMemoryItem: (
    typeOrItem: MemoryType | EpistemicTag | Partial<EpistemicMemoryItem>,
    content?: string,
    status?: EpistemicMemoryItem['status'],
    sourceSessionId?: string
  ) => void;
  updateMemoryStatus: (id: string, status: EpistemicMemoryItem['status']) => void;
  deleteMemoryItem: (id: string) => void;
  removeMemoryItem: (id: string) => void;
  clearAllMemory: () => void;

  // Skill Tree
  skillNodes: SkillNode[];
  incrementSkillPractice: (gameIdOrSkillId: string) => void;

  // Prediction Lab
  predictions: PredictionRecord[];
  addPrediction: (prediction: Omit<PredictionRecord, 'id' | 'committedAt' | 'status'>) => PredictionRecord;
  resolvePrediction: (
    id: string,
    whatActuallyHappened: string,
    didFearedHappen: 'yes' | 'partly' | 'no' | 'different_entirely',
    learningInsight: string,
    rating: PredictionRecord['outcomeRating']
  ) => void;
  deletePrediction: (id: string) => void;

  // Arcade Personalization
  activeGameContext: GamePersonalizationContext | null;
  launchGameWithContext: (ctx: GamePersonalizationContext) => void;
  clearGameContext: () => void;
  practiceSessions: PracticeSession[];
  logPracticeSession: (session: Omit<PracticeSession, 'id' | 'date'>) => void;

  // Grounding & Modals
  groundingModalOpen: boolean;
  setGroundingModalOpen: (open: boolean) => void;
  crisisInterruption: {
    isOpen: boolean;
    type?: string;
    message?: string;
  };
  setCrisisInterruption: (data: { isOpen: boolean; type?: string; message?: string }) => void;

  // Legacy compatibility helpers
  rules: ProtectiveRule[];
  reflections: ReflectionRecord[];
  boundaries: BoundaryCard[];
  currentReflectionId: string | null;
  setCurrentReflectionId: (id: string | null) => void;
  saveReflection: (record: ReflectionRecord) => void;
  commitPrediction: (prediction: PredictionRecord) => void;
  recordOutcome: (outcome: OutcomeRecord) => void;
  updatePresentDayRule: (ruleId: string, newWording: string) => void;
  createOrUpdateRuleFromReflection: (reflection: ReflectionRecord) => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
  resetToDefaults: () => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'shift_platform_storage_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // Core state
  const [shifts, setShifts] = useState<ShiftBreakdown[]>(INITIAL_DEMO_SHIFTS);
  const [activeShift, setActiveShift] = useState<ShiftBreakdown | null>(INITIAL_DEMO_SHIFTS[0]);
  const [memoryItems, setMemoryItems] = useState<EpistemicMemoryItem[]>(INITIAL_EPISTEMIC_MEMORY);
  const [skillNodes, setSkillNodes] = useState<SkillNode[]>(INITIAL_SKILL_TREE);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>(INITIAL_PRACTICE_SESSIONS);
  const [activeGameContext, setActiveGameContext] = useState<GamePersonalizationContext | null>(null);

  // Predictions
  const [predictions, setPredictions] = useState<PredictionRecord[]>([
    {
      id: 'pred-demo-1',
      reflectionId: 'demo-shift-1',
      cueContext: 'Unanswered text from friend',
      intendedAction: 'Wait 24 hours without double-texting or calling',
      fearedConsequence: 'They will permanently disconnect and drift away',
      predictedOutcome: 'They will stop replying altogether',
      confidencePercent: 75,
      committedAt: '2026-09-02T10:45:00Z',
      status: 'tested',
      whatActuallyHappened: 'Friend replied 26 hours later, warmly apologizing for back-to-back 14-hour clinic rotations.',
      learningInsight: 'Silence is incomplete information. Delay rarely indicates rejection.',
      outcomeRecordedAt: '2026-09-03T13:00:00Z',
      didFearedOutcomeHappen: 'no',
      outcomeRating: 'better_than_expected',
    },
    {
      id: 'pred-demo-2',
      reflectionId: 'demo-shift-2',
      cueContext: 'Public meeting critique on project timeline',
      intendedAction: 'Ask clarifying question to supervisor instead of defending',
      fearedConsequence: 'They will attack me further and think I lack basic skills',
      predictedOutcome: 'Supervisor will reprimand me in front of team',
      confidencePercent: 80,
      committedAt: '2026-09-08T12:00:00Z',
      status: 'pending',
    },
  ]);

  // Legacy data compatibility
  const [rules, setRules] = useState<ProtectiveRule[]>(INITIAL_RULES);
  const [reflections, setReflections] = useState<ReflectionRecord[]>(INITIAL_REFLECTIONS);
  const [boundaries, setBoundaries] = useState<BoundaryCard[]>(INITIAL_BOUNDARIES);

  // Modals
  const [groundingModalOpen, setGroundingModalOpen] = useState<boolean>(false);
  const [crisisInterruption, setCrisisInterruption] = useState<{
    isOpen: boolean;
    type?: string;
    message?: string;
  }>({ isOpen: false });

  // Load persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.shifts) setShifts(parsed.shifts);
        if (parsed.memoryItems) setMemoryItems(parsed.memoryItems);
        if (parsed.skillNodes) setSkillNodes(parsed.skillNodes);
        if (parsed.predictions) setPredictions(parsed.predictions);
        if (parsed.practiceSessions) setPracticeSessions(parsed.practiceSessions);
        if (parsed.rules) setRules(parsed.rules);
        if (parsed.reflections) setReflections(parsed.reflections);
      }
    } catch (e) {
      console.warn('Could not read saved data from localStorage', e);
    }
  }, []);

  // Save persistence
  useEffect(() => {
    try {
      const dataToSave = {
        shifts,
        memoryItems,
        skillNodes,
        predictions,
        practiceSessions,
        rules,
        reflections,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('Could not persist data to localStorage', e);
    }
  }, [shifts, memoryItems, skillNodes, predictions, practiceSessions, rules, reflections]);

  // Audio synthesizer
  const playSoftSound = (type: 'chime' | 'tap' | 'ground' | 'complete' = 'tap') => {
    if (!audioEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'tap') {
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'chime') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'complete') {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'ground') {
        osc.frequency.setValueAtTime(196, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
      }
    } catch {
      // Ignore audio error
    }
  };

  // Shift Breakdown Management
  const saveShiftBreakdown = (breakdown: ShiftBreakdown) => {
    setShifts((prev) => {
      const idx = prev.findIndex((s) => s.id === breakdown.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = breakdown;
        return next;
      }
      return [breakdown, ...prev];
    });
    setActiveShift(breakdown);

    // If user marked 'remember', automatically add structured epistemic memory
    if (breakdown.savePreference === 'remember') {
      addMemoryItem('CONFIRMED_FACT', breakdown.userEditedObservation || breakdown.observation, 'active', breakdown.id);
      addMemoryItem('USER_INTERPRETATION', breakdown.userEditedInterpretation || breakdown.interpretation, 'active', breakdown.id);
      if (breakdown.hypothesisUserStatus === 'accepted') {
        addMemoryItem('WORKING_HYPOTHESIS', breakdown.userEditedHypothesis || breakdown.protective_rule_hypothesis, 'active', breakdown.id);
      }
      addMemoryItem('UPDATED_PERSPECTIVE', breakdown.userEditedPerspective || breakdown.updated_perspective, 'active', breakdown.id);
      if (breakdown.real_world_experiment) {
        addMemoryItem('CURRENT_EXPERIMENT', breakdown.real_world_experiment, 'active', breakdown.id);
      }
    }
  };

  const updateShiftBreakdown = (id: string, updates: Partial<ShiftBreakdown>) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
    );
    if (activeShift?.id === id) {
      setActiveShift((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const deleteShift = (id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
    if (activeShift?.id === id) {
      setActiveShift(null);
    }
  };

  // Epistemic Memory Management
  const addMemoryItem = (
    typeOrItem: MemoryType | EpistemicTag | Partial<EpistemicMemoryItem>,
    content?: string,
    status: EpistemicMemoryItem['status'] = 'active',
    sourceSessionId?: string
  ) => {
    let finalType: MemoryType | EpistemicTag | string = 'CONFIRMED_FACT';
    let finalContent = '';
    let finalStatus: EpistemicMemoryItem['status'] = status;
    let finalSource = sourceSessionId;

    if (typeof typeOrItem === 'object' && typeOrItem !== null) {
      finalType = (typeOrItem.type || 'CONFIRMED_FACT') as (MemoryType | EpistemicTag | string);
      finalContent = typeOrItem.content || '';
      finalStatus = typeOrItem.status || 'active';
      finalSource = typeOrItem.sourceSessionId;
    } else {
      finalType = typeOrItem as (MemoryType | EpistemicTag | string);
      finalContent = content || '';
    }

    if (!finalContent.trim()) return;
    const newItem: EpistemicMemoryItem = {
      id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      userId: 'user-default',
      type: finalType,
      content: finalContent.trim(),
      status: finalStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceSessionId: finalSource,
    };
    setMemoryItems((prev) => [newItem, ...prev]);
  };

  const updateMemoryStatus = (id: string, status: EpistemicMemoryItem['status']) => {
    setMemoryItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status, updatedAt: new Date().toISOString() } : m))
    );
  };

  const deleteMemoryItem = (id: string) => {
    setMemoryItems((prev) => prev.filter((m) => m.id !== id));
  };

  const removeMemoryItem = deleteMemoryItem;

  const clearAllMemory = () => {
    setMemoryItems([]);
  };

  // Skill Tree Management
  const incrementSkillPractice = (gameIdOrSkillId: string) => {
    setSkillNodes((prev) =>
      prev.map((node) => {
        if (node.id === gameIdOrSkillId || node.recommendedGameId === gameIdOrSkillId) {
          return { ...node, practiceCount: node.practiceCount + 1 };
        }
        return node;
      })
    );
  };

  // Prediction Lab Management
  const addPrediction = (predictionData: Omit<PredictionRecord, 'id' | 'committedAt' | 'status'>) => {
    const newPred: PredictionRecord = {
      ...predictionData,
      id: 'pred-' + Date.now(),
      committedAt: new Date().toISOString(),
      status: 'pending',
    };
    setPredictions((prev) => [newPred, ...prev]);
    addMemoryItem('PREDICTION', `Predicted: "${newPred.predictedOutcome}" | Feared: "${newPred.fearedConsequence}"`, 'active', newPred.reflectionId);
    return newPred;
  };

  const resolvePrediction = (
    id: string,
    whatActuallyHappened: string,
    didFearedOutcomeHappen: 'yes' | 'partly' | 'no' | 'different_entirely',
    learningInsight: string,
    rating: PredictionRecord['outcomeRating'] = 'about_as_expected'
  ) => {
    setPredictions((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'tested',
              whatActuallyHappened,
              didFearedOutcomeHappen,
              learningInsight,
              outcomeRating: rating,
              outcomeRecordedAt: new Date().toISOString(),
            }
          : p
      )
    );
    addMemoryItem(
      'OUTCOME',
      `Actual outcome: "${whatActuallyHappened}" | Lesson: "${learningInsight}"`,
      'active',
      id
    );
  };

  const deletePrediction = (id: string) => {
    setPredictions((prev) => prev.filter((p) => p.id !== id));
  };

  // Arcade Launch Helper
  const launchGameWithContext = (ctx: GamePersonalizationContext) => {
    playSoftSound('chime');
    setActiveGameContext(ctx);
    setActiveTab('arcade');
  };

  const clearGameContext = () => {
    setActiveGameContext(null);
  };

  const logPracticeSession = (session: Omit<PracticeSession, 'id' | 'date'>) => {
    const newSession: PracticeSession = {
      ...session,
      id: 'sess-' + Date.now(),
      date: new Date().toISOString(),
    };
    setPracticeSessions((prev) => [newSession, ...prev]);
    incrementSkillPractice(session.mode);
  };

  // Export / Import JSON
  const exportDataJSON = () => {
    const data = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      shifts,
      memoryItems,
      skillNodes,
      predictions,
      practiceSessions,
      rules,
      reflections,
      boundaries,
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.shifts) setShifts(data.shifts);
      if (data.memoryItems) setMemoryItems(data.memoryItems);
      if (data.skillNodes) setSkillNodes(data.skillNodes);
      if (data.predictions) setPredictions(data.predictions);
      if (data.practiceSessions) setPracticeSessions(data.practiceSessions);
      return true;
    } catch {
      return false;
    }
  };

  const resetToDefaults = () => {
    setShifts(INITIAL_DEMO_SHIFTS);
    setActiveShift(INITIAL_DEMO_SHIFTS[0]);
    setMemoryItems(INITIAL_EPISTEMIC_MEMORY);
    setSkillNodes(INITIAL_SKILL_TREE);
    setPracticeSessions(INITIAL_PRACTICE_SESSIONS);
    setPredictions([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const clearAllData = () => {
    setShifts([]);
    setActiveShift(null);
    setMemoryItems([]);
    setPredictions([]);
    setPracticeSessions([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const [currentReflectionId, setCurrentReflectionId] = useState<string | null>(null);

  const saveReflection = (record: ReflectionRecord) => {
    setReflections((prev) => {
      const idx = prev.findIndex((r) => r.id === record.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = record;
        return next;
      }
      return [record, ...prev];
    });
  };

  const commitPrediction = (pred: PredictionRecord) => {
    setPredictions((prev) => {
      const idx = prev.findIndex((p) => p.id === pred.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = pred;
        return next;
      }
      return [pred, ...prev];
    });
    if (pred.reflectionId) {
      setReflections((prev) =>
        prev.map((r) => (r.id === pred.reflectionId ? { ...r, prediction: pred } : r))
      );
    }
  };

  const recordOutcome = (outcome: OutcomeRecord) => {
    if (outcome.predictionId) {
      resolvePrediction(
        outcome.predictionId,
        outcome.whatActuallyHappened,
        outcome.didFearedOutcomeHappen,
        outcome.discrepancySummary,
        outcome.outcomeRating
      );
    }
    if (outcome.reflectionId) {
      setReflections((prev) =>
        prev.map((r) => (r.id === outcome.reflectionId ? { ...r, outcome } : r))
      );
    }
  };

  const updatePresentDayRule = (ruleId: string, newWording: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId) {
          const nextVer = (r.versionHistory?.length || 0) + 1;
          const newVersion: RuleVersion = {
            versionId: `v${nextVer}-${Date.now()}`,
            versionNumber: nextVer,
            wording: newWording,
            createdAt: new Date().toISOString(),
            status: 'updated',
          };
          return {
            ...r,
            currentPresentDayWording: newWording,
            status: 'updated',
            versionHistory: [...(r.versionHistory || []), newVersion],
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );
  };

  const createOrUpdateRuleFromReflection = (reflection: ReflectionRecord) => {
    if (!reflection.ruleDraftFullText && !reflection.draftRuleCue) return;
    const ruleId = reflection.protectiveRuleId || `rule-${Date.now()}`;
    const newRule: ProtectiveRule = {
      id: ruleId,
      title: reflection.title || 'Derived Protective Rule',
      cueContext: reflection.draftRuleCue || reflection.observedEvent,
      predictedConsequence: reflection.draftRulePrediction || 'feared outcome',
      protectiveResponse: reflection.draftRuleResponse || 'protective urge',
      originalWording: reflection.ruleDraftFullText || 'Past rule hypothesis',
      currentPresentDayWording: reflection.presentDayRuleUpdate || reflection.ruleDraftFullText || '',
      status: reflection.presentDayRuleUpdate ? 'updated' : 'testing',
      versionHistory: [
        {
          versionId: 'v1',
          versionNumber: 1,
          wording: reflection.ruleDraftFullText || '',
          createdAt: new Date().toISOString(),
          status: 'active',
        },
      ],
      linkedReflectionIds: [reflection.id],
      supportingEvidence: reflection.assumptions ? [reflection.assumptions] : [],
      challengingEvidence: reflection.alternativeExplanations || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRules((prev) => {
      const idx = prev.findIndex((r) => r.id === ruleId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newRule;
        return next;
      }
      return [newRule, ...prev];
    });
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        audioEnabled,
        setAudioEnabled,
        playSoftSound,

        shifts,
        activeShift,
        setActiveShift,
        saveShiftBreakdown,
        updateShiftBreakdown,
        deleteShift,

        memoryItems,
        addMemoryItem,
        updateMemoryStatus,
        deleteMemoryItem,
        removeMemoryItem,
        clearAllMemory,

        skillNodes,
        incrementSkillPractice,

        predictions,
        addPrediction,
        resolvePrediction,
        deletePrediction,

        activeGameContext,
        launchGameWithContext,
        clearGameContext,
        practiceSessions,
        logPracticeSession,

        groundingModalOpen,
        setGroundingModalOpen,
        crisisInterruption,
        setCrisisInterruption,

        rules,
        reflections,
        boundaries,
        currentReflectionId,
        setCurrentReflectionId,
        saveReflection,
        commitPrediction,
        recordOutcome,
        updatePresentDayRule,
        createOrUpdateRuleFromReflection,
        exportDataJSON,
        importDataJSON,
        resetToDefaults,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
