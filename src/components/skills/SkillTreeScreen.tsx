import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SkillBranch, SkillNode, ArcadeModeType } from '../../types';
import {
  GitBranch,
  CheckCircle2,
  Lock,
  Play,
  Sparkles,
  Zap,
  Shield,
  Heart,
  Brain,
  Compass,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

const BRANCH_METADATA: Record<
  SkillBranch,
  { label: string; desc: string; color: string; bg: string; border: string; icon: any }
> = {
  self_awareness: {
    label: 'Branch 1: Self-Awareness',
    desc: 'Fact vs. Story, noticing body cues, separating thoughts from emotions, and naming urges.',
    color: 'text-teal-400',
    bg: 'bg-teal-950/20',
    border: 'border-teal-500/30',
    icon: Sparkles,
  },
  perspective: {
    label: 'Branch 2: Perspective & Meaning',
    desc: 'Possibility generation, dialectical thinking, cognitive flexibility, and belief updating.',
    color: 'text-sky-400',
    bg: 'bg-sky-950/20',
    border: 'border-sky-500/30',
    icon: Brain,
  },
  relationships: {
    label: 'Branch 3: Relational Dynamics',
    desc: 'Decentering others, boundary setting, clean communication, and values-aligned requests.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-950/20',
    border: 'border-indigo-500/30',
    icon: Shield,
  },
  regulation: {
    label: 'Branch 4: Regulation & Action',
    desc: 'The pause, somatic downshifting, behavioral experimentation, and urge surfing.',
    color: 'text-amber-400',
    bg: 'bg-amber-950/20',
    border: 'border-amber-500/30',
    icon: Compass,
  },
};

export const SkillTreeScreen: React.FC = () => {
  const { skillNodes, launchGameWithContext, playSoftSound, setActiveTab } = useApp();
  const [selectedBranch, setSelectedBranch] = useState<SkillBranch | 'all'>('all');

  const totalPractices = skillNodes.reduce((sum, n) => sum + n.practiceCount, 0);
  const masteredCount = skillNodes.filter((n) => n.status === 'mastered' || n.practiceCount >= 10).length;

  const filteredNodes =
    selectedBranch === 'all'
      ? skillNodes
      : skillNodes.filter((n) => n.branch === selectedBranch);

  const branches: SkillBranch[] = [
    'self_awareness',
    'perspective',
    'relationships',
    'regulation',
  ];

  const handlePracticeSkill = (node: SkillNode) => {
    playSoftSound('tap');
    launchGameWithContext({
      gameId: (node.recommendedGameId || node.linkedGameEngine || 'fact_or_story') as ArcadeModeType,
      theme: node.title || node.name || 'Cognitive Drill',
      scenarioText: node.description,
    });
  };

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-500/30 text-indigo-400 text-xs font-mono mb-2">
            <GitBranch className="w-3.5 h-3.5" />
            <span>PROGRESSION ARCHITECTURE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Behavioral Skill Tree
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your cognitive mastery across 4 foundational psychological branches. Practice builds automatic neural habits.
          </p>
        </div>

        {/* Stats Badge */}
        <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-5 py-3 rounded-2xl shrink-0">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Total Reps</span>
            <span className="text-lg font-mono font-bold text-teal-300">{totalPractices} drills</span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Mastered</span>
            <span className="text-lg font-mono font-bold text-indigo-300">
              {masteredCount} / {skillNodes.length}
            </span>
          </div>
        </div>
      </div>

      {/* Branch Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            playSoftSound('tap');
            setSelectedBranch('all');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            selectedBranch === 'all'
              ? 'bg-slate-100 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          All Branches ({skillNodes.length} Skills)
        </button>
        {branches.map((b) => {
          const meta = BRANCH_METADATA[b];
          const count = skillNodes.filter((n) => n.branch === b).length;
          return (
            <button
              key={b}
              onClick={() => {
                playSoftSound('tap');
                setSelectedBranch(b);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                selectedBranch === b
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {meta.label.split(':')[1]} ({count})
            </button>
          );
        })}
      </div>

      {/* Render Branch Sections */}
      <div className="space-y-8">
        {branches
          .filter((b) => selectedBranch === 'all' || selectedBranch === b)
          .map((b) => {
            const meta = BRANCH_METADATA[b];
            const nodes = skillNodes.filter((n) => n.branch === b);
            const Icon = meta.icon;

            return (
              <div
                key={b}
                className={`rounded-3xl border ${meta.border} ${meta.bg} p-6 sm:p-8 space-y-6 shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/80 flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-100">{meta.label}</h2>
                      <p className="text-xs text-slate-400">{meta.desc}</p>
                    </div>
                  </div>
                </div>

                {/* Nodes in this branch */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nodes.map((node) => {
                    const isMastered = node.status === 'mastered' || node.practiceCount >= 10;
                    const isAvailable = node.status ? node.status !== 'locked' : node.unlocked !== false;
                    const displayStatus = isMastered ? 'mastered' : isAvailable ? 'available' : 'locked';
                    const displayName = node.title || node.name || 'Skill';
                    const levelStr = typeof node.level === 'number' ? `TIER ${node.level}` : String(node.level || 1).toUpperCase();

                    return (
                      <div
                        key={node.id}
                        className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all ${
                          isMastered
                            ? 'bg-slate-900/90 border-teal-500/40 shadow-sm'
                            : isAvailable
                            ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-950/40 border-slate-900 opacity-60'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                                isMastered
                                  ? 'bg-teal-950 text-teal-300 border border-teal-700/50'
                                  : isAvailable
                                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {displayStatus}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {node.practiceCount} reps
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-slate-100">{displayName}</h3>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {node.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {levelStr}
                          </span>

                          {isAvailable ? (
                            <button
                              onClick={() => handlePracticeSkill(node)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-semibold cursor-pointer transition-colors"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Practice</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-600 text-xs font-mono">
                              <Lock className="w-3 h-3" />
                              <span>Locked</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
