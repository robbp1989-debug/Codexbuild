import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Compass,
  Sparkles,
  Gamepad2,
  GitBranch,
  FlaskConical,
  FileText,
  Brain,
  Shield,
  Volume2,
  VolumeX,
  Menu,
  X,
  Pause,
  Layers,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    audioEnabled,
    setAudioEnabled,
    playSoftSound,
    setGroundingModalOpen,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'arcade', label: 'Arcade', icon: Gamepad2, badge: '16 Games (5 3D)' },
    { id: 'home', label: 'Reflect', icon: Sparkles },
    { id: 'dashboard', label: 'Shift Lab', icon: Compass },
    { id: 'skills', label: 'Skill Tree', icon: GitBranch },
    { id: 'prediction-lab', label: 'Prediction Lab', icon: FlaskConical },
    { id: 'therapy-prep', label: 'Therapy Prep', icon: FileText },
    { id: 'memory', label: 'Memory', icon: Brain },
    { id: 'safety', label: 'Safety', icon: Shield },
  ];

  const handleNav = (tabId: string) => {
    playSoftSound('tap');
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      {/* Top Educational Strip */}
      <div className="bg-slate-900/80 border-b border-slate-800/50 px-4 py-1 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
          <span className="truncate">
            <strong>Educational Self-Reflection & Behavioral Arcade</strong> — Not medical diagnosis, crisis, or emergency care.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              playSoftSound('tap');
              setActiveTab('safety');
            }}
            className="hover:text-teal-300 underline transition-colors cursor-pointer"
          >
            Crisis Helplines (988)
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => handleNav('arcade')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 via-teal-500/20 to-teal-400/30 border border-teal-500/40 flex items-center justify-center text-teal-300 group-hover:border-teal-400 transition-all shadow-sm shadow-teal-500/10">
            <Gamepad2 className="w-5 h-5 group-hover:rotate-6 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-slate-100 font-mono">
                SHIFT
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-800/50 text-teal-300 font-semibold">
                Arcade
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
              Notice the pattern. Test the prediction. Choose the move.
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNav(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-950'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Utility Controls */}
        <div className="flex items-center gap-2">
          {/* Pause / Grounding Trigger */}
          <button
            id="nav-grounding-pause-btn"
            onClick={() => {
              playSoftSound('ground');
              setGroundingModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-colors cursor-pointer"
            title="Open Grounding & Pause Console"
          >
            <Pause className="w-3.5 h-3.5 fill-teal-300/30" />
            <span className="hidden sm:inline">Pause / Ground</span>
          </button>

          {/* Audio toggle */}
          <button
            id="nav-audio-toggle"
            onClick={() => {
              const next = !audioEnabled;
              setAudioEnabled(next);
              if (next) playSoftSound('tap');
            }}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              audioEnabled
                ? 'bg-slate-800 border-teal-500/40 text-teal-400'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={audioEnabled ? 'Audio feedback enabled' : 'Audio feedback muted'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Mobile hamburger */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-950/95 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-teal-300 border border-teal-500/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
