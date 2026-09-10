'use client';

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './components/home/HomePage';
import { ArcadeHub } from './components/arcade/ArcadeHub';
import { MyShiftDashboard } from './components/dashboard/MyShiftDashboard';
import { SkillTreeScreen } from './components/skills/SkillTreeScreen';
import { PredictionLabScreen } from './components/predictions/PredictionLabScreen';
import { TherapyPrepScreen } from './components/therapy/TherapyPrepScreen';
import { EpistemicMemoryScreen } from './components/memory/EpistemicMemoryScreen';
import { ShiftBreakdownScreen } from './components/reflect/ShiftBreakdownScreen';
import { PersonalizedScenarioGame } from './components/arcade/modes/PersonalizedScenarioGame';
import { SafetyPage } from './components/safety/SafetyPage';
import { PatternsPage } from './components/patterns/PatternsPage';
import { ReviewPage } from './components/review/ReviewPage';
import { LearnPage } from './components/learn/LearnPage';
import { GroundingModal } from './components/modals/GroundingModal';
import { CrisisInterruptionModal } from './components/modals/CrisisInterruptionModal';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="shift-light min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500/30 selection:text-teal-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === 'arcade' && <ArcadeHub />}
        {activeTab === 'scenario-game' && <PersonalizedScenarioGame />}
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'breakdown' && <ShiftBreakdownScreen />}
        {activeTab === 'reflect' && <HomePage />}
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
      </main>

      <Footer />

      {/* Global Modals */}
      <GroundingModal />
      <CrisisInterruptionModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
