import React, { useState, useMemo } from 'react';
import { usePracticeSource } from '../../../context/usePracticeSource';
import { usePracticeContent } from '../../../context/usePracticeContent';
import { useApp } from '../../../context/AppContext';
import { ShiftBreakdown } from '../../../types';
import { KartLaneRunner3D, LaneGateQuestion } from '../3d/KartLaneRunner3D';
import {
  Gamepad2,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Trophy,
  BrainCircuit,
  Eye,
  Pause,
  Scale,
  FlaskConical,
  Bookmark,
} from 'lucide-react';

interface PersonalizedScenarioGameProps {
  onComplete?: () => void;
  scenarioOverride?: ShiftBreakdown;
}

export const PersonalizedScenarioGame: React.FC<PersonalizedScenarioGameProps> = ({
  onComplete,
  scenarioOverride,
}) => {
  const {
    activeShift,
    shifts,
    setActiveTab,
    playSoftSound,
  } = useApp();

  const currentShift = usePracticeSource(scenarioOverride);
  const sample = usePracticeContent().scenes[1];
  const [selectedCourse, setSelectedCourse] = useState<'all' | 'trap_vs_truth' | 'fact_vs_story' | 'pause_reflex'>('all');

  const handleBackToBreakdown = () => {
    playSoftSound('tap');
    if (onComplete) {
      onComplete();
    } else {
      setActiveTab('breakdown');
    }
  };

  // Build customized 3D questions based on selected course
  const customQuestions: LaneGateQuestion[] = useMemo(() => {
    const obs = currentShift?.userEditedObservation || currentShift?.observation || 'Friend has not replied to my message since yesterday';
    const interp = currentShift?.userEditedInterpretation || currentShift?.interpretation || 'They are losing interest and intentionally ignoring me';
    const rule = currentShift?.protective_rule_hypothesis || 'If someone is distant, I must panic and immediately demand reassurance';
    const perspective = currentShift?.updated_perspective || 'Silence is ambiguous data, not confirmed rejection';
    const choice = currentShift?.choice || 'Take a 60-second pause before acting on anxious impulses';

    if (selectedCourse === 'fact_vs_story') {
      return [
        {
          id: 'fvs-1',
          categoryTitle: 'CAMERA FACT OR MIND STORY?',
          statement: `“${obs}”`,
          leftLaneLabel: 'Mind Story',
          leftGateBanner: 'STORY',
          leftSubtext: 'Added interpretation',
          rightLaneLabel: 'Camera Fact',
          rightGateBanner: 'FACT',
          rightSubtext: 'Verifiable physical proof',
          correctLane: 'right',
          explanation: 'Camera fact: Measurable and verifiable by any neutral observer without speculation.',
          techniqueBadge: 'Objective Observation',
        },
        {
          id: 'fvs-2',
          categoryTitle: 'CAMERA FACT OR MIND STORY?',
          statement: `“${interp}”`,
          leftLaneLabel: 'Mind Story',
          leftGateBanner: 'STORY',
          leftSubtext: 'Added interpretation',
          rightLaneLabel: 'Camera Fact',
          rightGateBanner: 'FACT',
          rightSubtext: 'Verifiable physical proof',
          correctLane: 'left',
          explanation: 'Mind Story: An interpretation added by protective alarm systems, not an established external fact.',
          techniqueBadge: 'Cognitive Distortions',
        },
        {
          id: 'fvs-3',
          categoryTitle: 'CAMERA FACT OR MIND STORY?',
          statement: `Separate fictional example: “${sample.fact}”`,
          leftLaneLabel: 'Mind Story',
          leftGateBanner: 'STORY',
          leftSubtext: 'Added interpretation',
          rightLaneLabel: 'Camera Fact',
          rightGateBanner: 'FACT',
          rightSubtext: 'Verifiable physical proof',
          correctLane: 'right',
          explanation: 'This is the stated observation in a separate practice example, not an added detail about your situation.',
          techniqueBadge: 'Camera Proof',
        },
        {
          id: 'fvs-4',
          categoryTitle: 'CAMERA FACT OR MIND STORY?',
          statement: `Separate fictional example: “${sample.story}”`,
          leftLaneLabel: 'Mind Story',
          leftGateBanner: 'STORY',
          leftSubtext: 'Added interpretation',
          rightLaneLabel: 'Camera Fact',
          rightGateBanner: 'FACT',
          rightSubtext: 'Verifiable physical proof',
          correctLane: 'left',
          explanation: 'Catastrophic projection: Extrapolating a life disaster from a momentary pause.',
          techniqueBadge: 'Catastrophizing',
        },
      ];
    }

    if (selectedCourse === 'pause_reflex') {
      return [
        {
          id: 'pr-1',
          categoryTitle: 'KNEE-JERK REFLEX OR PAUSE BUTTON?',
          statement: `“${rule}”`,
          leftLaneLabel: 'Panic Reflex',
          leftGateBanner: 'REFLEX',
          leftSubtext: 'Urgent defensive reaction',
          rightLaneLabel: 'The Pause Button',
          rightGateBanner: 'PAUSE',
          rightSubtext: 'Regulated nervous system',
          correctLane: 'left',
          explanation: 'Knee-jerk reflex: Urgency driven by emotional dysregulation rather than thoughtful assessment.',
          techniqueBadge: 'Impulse Interception',
        },
        {
          id: 'pr-2',
          categoryTitle: 'KNEE-JERK REFLEX OR PAUSE BUTTON?',
          statement: `“${choice}”`,
          leftLaneLabel: 'Panic Reflex',
          leftGateBanner: 'REFLEX',
          leftSubtext: 'Urgent defensive reaction',
          rightLaneLabel: 'The Pause Button',
          rightGateBanner: 'PAUSE',
          rightSubtext: 'Regulated nervous system',
          correctLane: 'right',
          explanation: 'The Pause Button: Introducing strategic delay prevents reinforcing panic loops.',
          techniqueBadge: 'Grounding Technique',
        },
        {
          id: 'pr-3',
          categoryTitle: 'KNEE-JERK REFLEX OR PAUSE BUTTON?',
          statement: '“Send 4 follow-up texts asking if they are angry with me.”',
          leftLaneLabel: 'Panic Reflex',
          leftGateBanner: 'REFLEX',
          leftSubtext: 'Urgent defensive reaction',
          rightLaneLabel: 'The Pause Button',
          rightGateBanner: 'PAUSE',
          rightSubtext: 'Regulated nervous system',
          correctLane: 'left',
          explanation: 'Compulsive reassurance seeking: Relieves immediate distress while reinforcing long-term panic.',
          techniqueBadge: 'Reassurance Traps',
        },
        {
          id: 'pr-4',
          categoryTitle: 'KNEE-JERK REFLEX OR PAUSE BUTTON?',
          statement: '“Notice the physiological tightness in my chest and take 3 deep diaphragmatic breaths.”',
          leftLaneLabel: 'Panic Reflex',
          leftGateBanner: 'REFLEX',
          leftSubtext: 'Urgent defensive reaction',
          rightLaneLabel: 'The Pause Button',
          rightGateBanner: 'PAUSE',
          rightSubtext: 'Regulated nervous system',
          correctLane: 'right',
          explanation: 'Somatic regulation: Intercepts sympathetic nervous system fight-or-flight spikes.',
          techniqueBadge: 'Somatic Regulation',
        },
      ];
    }

    // Default: 'all' or 'trap_vs_truth'
    return [
      {
        id: 'all-1',
        categoryTitle: 'TRUTH OR COGNITIVE TRAP?',
        statement: `“${obs}”`,
        leftLaneLabel: 'Cognitive Trap',
        leftGateBanner: 'TRAP',
        leftSubtext: 'Mind story & alarm',
        rightLaneLabel: 'Objective Truth',
        rightGateBanner: 'TRUTH',
        rightSubtext: 'Verifiable camera fact',
        correctLane: 'right',
        explanation: 'Camera observation: Real-world event verified without emotional embroidery.',
        techniqueBadge: 'Camera Observation',
      },
      {
        id: 'all-2',
        categoryTitle: 'TRUTH OR COGNITIVE TRAP?',
        statement: `“${interp}”`,
        leftLaneLabel: 'Cognitive Trap',
        leftGateBanner: 'TRAP',
        leftSubtext: 'Mind story & alarm',
        rightLaneLabel: 'Objective Truth',
        rightGateBanner: 'TRUTH',
        rightSubtext: 'Verifiable camera fact',
        correctLane: 'left',
        explanation: 'Cognitive Trap: An automatic interpretation generated by your protective alarms.',
        techniqueBadge: 'Mind Reading',
      },
      {
        id: 'all-3',
        categoryTitle: 'TRUTH OR COGNITIVE TRAP?',
        statement: `“${rule}”`,
        leftLaneLabel: 'Cognitive Trap',
        leftGateBanner: 'TRAP',
        leftSubtext: 'Mind story & alarm',
        rightLaneLabel: 'Objective Truth',
        rightGateBanner: 'TRUTH',
        rightSubtext: 'Verifiable camera fact',
        correctLane: 'left',
        explanation: 'Knee-jerk hypothesis: A rigid rule attempting to control ambiguity before verifying facts.',
        techniqueBadge: 'Protective Rule',
      },
      {
        id: 'all-4',
        categoryTitle: 'TRUTH OR COGNITIVE TRAP?',
        statement: `“${perspective}”`,
        leftLaneLabel: 'Cognitive Trap',
        leftGateBanner: 'TRAP',
        leftSubtext: 'Mind story & alarm',
        rightLaneLabel: 'Objective Truth',
        rightGateBanner: 'TRUTH',
        rightSubtext: 'Verifiable camera fact',
        correctLane: 'right',
        explanation: 'Objective Truth: A balanced dialectic acknowledging emotions while respecting reality.',
        techniqueBadge: 'Both Can Be True',
      },
      {
        id: 'all-5',
        categoryTitle: 'TRUTH OR COGNITIVE TRAP?',
        statement: `“${choice}”`,
        leftLaneLabel: 'Cognitive Trap',
        leftGateBanner: 'TRAP',
        leftSubtext: 'Mind story & alarm',
        rightLaneLabel: 'Objective Truth',
        rightGateBanner: 'TRUTH',
        rightSubtext: 'Verifiable camera fact',
        correctLane: 'right',
        explanation: 'Grounded Action: A values-aligned move that tests reality rather than submitting to fear.',
        techniqueBadge: 'Present-Day Move',
      },
      {
        id: 'all-6',
        categoryTitle: 'TRUTH OR COGNITIVE TRAP?',
        statement: '“I am noticing an urge to avoid this entirely.”',
        leftLaneLabel: 'Cognitive Trap',
        leftGateBanner: 'TRAP',
        leftSubtext: 'Mind story & alarm',
        rightLaneLabel: 'Objective Truth',
        rightGateBanner: 'TRUTH',
        rightSubtext: 'Verifiable camera fact',
        correctLane: 'right',
        explanation: 'Defusion accuracy: Acknowledging having an urge is 100% objective truth.',
        techniqueBadge: 'Cognitive Defusion',
      },
    ];
  }, [currentShift, selectedCourse, sample]);

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-8 space-y-6">
      {/* Top Header & Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackToBreakdown}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Breakdown</span>
            </button>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-mono font-bold">
              <Sparkles className="w-3 h-3" />
              <span>3D ACTIVE RECALL SIMULATOR</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            {currentShift.id.startsWith('context-example-') ? 'Life-context practice kart' : 'Personalized 3D Scenario Kart Game'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Steer your kart in real-time 3D through the correct psychological gates to cement non-reactive neural responses.
          </p>
        </div>

        {currentShift && (
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-teal-500/30 text-right shrink-0">
            <div className="text-[10px] uppercase font-mono text-teal-400 font-bold">
              Active Scenario
            </div>
            <div className="text-xs text-slate-200 font-semibold max-w-xs truncate">
              "{currentShift.userEditedObservation || currentShift.observation}"
            </div>
          </div>
        )}
      </div>

      {/* 3D Course Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-mono uppercase font-bold mr-1">
          3D Track Circuit:
        </span>
        <button
          onClick={() => {
            playSoftSound('tap');
            setSelectedCourse('all');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedCourse === 'all'
              ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-950/40'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          🏁 Master Circuit (All Techniques)
        </button>
        <button
          onClick={() => {
            playSoftSound('tap');
            setSelectedCourse('trap_vs_truth');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedCourse === 'trap_vs_truth'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-950/40'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          🎯 Truth vs Cognitive Trap
        </button>
        <button
          onClick={() => {
            playSoftSound('tap');
            setSelectedCourse('fact_vs_story');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedCourse === 'fact_vs_story'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          📷 Camera Fact vs Mind Story
        </button>
        <button
          onClick={() => {
            playSoftSound('tap');
            setSelectedCourse('pause_reflex');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedCourse === 'pause_reflex'
              ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-950/40'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          ⏸️ Panic Reflex vs Pause Button
        </button>
      </div>

      {/* Flagship 3D Kart Lane Runner */}
      <KartLaneRunner3D
        key={selectedCourse}
        scenario={currentShift}
        questionsOverride={customQuestions}
        onComplete={handleBackToBreakdown}
      />

      {/* Cemented Psychological Insights Card */}
      {currentShift && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-bold text-slate-100">
                Active Recall Memory Matrix
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Personalized from your breakdown
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-teal-400 font-bold uppercase tracking-wider text-[10px] block">
                Objective Camera Fact
              </span>
              <p className="text-slate-200 font-semibold leading-relaxed">
                "{currentShift.userEditedObservation || currentShift.observation}"
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-rose-400 font-bold uppercase tracking-wider text-[10px] block">
                Mind Trap Intercepted
              </span>
              <p className="text-slate-200 font-semibold leading-relaxed">
                "{currentShift.userEditedInterpretation || currentShift.interpretation}"
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] block">
                Grounded Choice Practiced
              </span>
              <p className="text-slate-200 font-semibold leading-relaxed">
                "{currentShift.choice}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
