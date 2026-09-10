'use client';

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { HomePage } from './components/home/HomePage';
import { WorkspaceShell } from './components/layout/WorkspaceShell';
import { ArcadeHub } from './components/arcade/ArcadeHub';
import { MyShiftDashboard } from './components/dashboard/MyShiftDashboard';
import { SkillTreeScreen } from './components/skills/SkillTreeScreen';
import { PredictionLabScreen } from './components/predictions/PredictionLabScreen';
import { TherapyPrepScreen } from './components/therapy/TherapyPrepScreen';
import { EpistemicMemoryScreen } from './components/memory/EpistemicMemoryScreen';
import { LearningMemorySync } from './components/memory/LearningMemorySync';
import { ShiftBreakdownScreen } from './components/reflect/ShiftBreakdownScreen';
import { BreakdownNextStepBar } from './components/reflect/BreakdownNextStepBar';
import { KeepTalkingScreen } from './components/reflect/KeepTalkingScreen';
import { MemoryInfluencePanel } from './components/reflect/MemoryInfluencePanel';
import { PersonalizedScenarioGame } from './components/arcade/modes/PersonalizedScenarioGame';
import { SafetyPage } from './components/safety/SafetyPage';
import { PatternsPage } from './components/patterns/PatternsPage';
import { ReviewPage } from './components/review/ReviewPage';
import { LearnPage } from './components/learn/LearnPage';
import { GroundingModal } from './components/modals/GroundingModal';
import { CrisisInterruptionModal } from './components/modals/CrisisInterruptionModal';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  if (activeTab === 'home' || activeTab === 'reflect') {
    return (
      <div className="shift-experience">
        <LearningMemorySync />
        <HomePage />
        <GroundingModal />
        <CrisisInterruptionModal />
      </div>
    );
  }

  return (
    <>
      <LearningMemorySync />
      <WorkspaceShell>
        {activeTab === 'arcade' && <ArcadeHub />}
        {activeTab === 'scenario-game' && <PersonalizedScenarioGame />}
        {activeTab === 'breakdown' && (
          <>
            <MemoryInfluencePanel />
            <ShiftBreakdownScreen />
            <BreakdownNextStepBar />
          </>
        )}
        {activeTab === 'conversation' && <KeepTalkingScreen />}
        {(activeTab === 'dashboard' || activeTab === 'my-shift' || activeTab === 'shift-lab') && (
          <MyShiftDashboard />
        )}
        {activeTab === 'skills' && <SkillTreeScreen />}
        {activeTab === 'prediction-lab' && <PredictionLabScreen />}
        {activeTab === 'therapy-prep' && <TherapyPrepScreen />}
        {activeTab === 'memory' && <EpistemicMemoryScreen />}
        {activeTab === 'patterns' && <PatternsPage />}
        {activeTab === 'review' && <ReviewPage />}
        {activeTab === 'learn' && <LearnPage />}
        {activeTab === 'safety' && <SafetyPage />}
      </WorkspaceShell>
      <GroundingModal />
      <CrisisInterruptionModal />
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
