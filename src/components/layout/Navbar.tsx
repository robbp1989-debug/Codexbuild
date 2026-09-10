import React from 'react';
import { ArrowLeft, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LifeContextPicker } from './LifeContextPicker';

const WORKSPACE_NAV = [
  { id: 'reflection', label: 'Reflection', tabs: ['breakdown'] },
  { id: 'conversation', label: 'Keep Talking', tabs: ['conversation'] },
  { id: 'prediction-lab', label: 'Prediction Lab', tabs: ['prediction-lab'] },
  { id: 'memory', label: 'Memory', tabs: ['memory'] },
] as const;

const MORE_TOOLS = [
  ['dashboard', 'My SHIFT'],
  ['arcade', 'Reflection Arcade'],
  ['skills', 'Skills'],
  ['therapy-prep', 'Therapy Prep'],
  ['patterns', 'Patterns'],
  ['review', 'Review'],
  ['learn', 'Learn'],
  ['safety', 'Safety & support'],
] as const;

export const Navbar: React.FC = () => {
  const {
    activeTab,
    activeShift,
    setActiveTab,
    audioEnabled,
    setAudioEnabled,
    playSoftSound,
    setGroundingModalOpen,
  } = useApp();

  const navigate = (tab: string) => {
    playSoftSound('tap');
    setActiveTab(tab);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const returnToArrival = () => {
    try { sessionStorage.setItem('shift_home_entry_v1', 'arrival'); } catch { /* no-op */ }
    navigate('home');
  };

  const replayIntro = () => {
    try { sessionStorage.setItem('shift_home_entry_v1', 'intro'); } catch { /* no-op */ }
    navigate('home');
  };

  const navigatePrimary = (id: string) => {
    if (id === 'reflection') {
      if (activeShift) navigate('breakdown');
      else returnToArrival();
      return;
    }
    if (id === 'conversation' && !activeShift) {
      returnToArrival();
      return;
    }
    navigate(id);
  };

  return (
    <header className="shift-header workspace-header sticky top-0 z-40">
      <div className="shift-nav workspace-nav">
        <button className="shift-brand workspace-brand" aria-label="Return to SHIFT arrival" onClick={returnToArrival}>
          <span className="workspace-brand-mark" aria-hidden="true">S</span>
          <span>SHIFT</span>
        </button>

        <nav aria-label="SHIFT workspace navigation" className="shift-nav-links workspace-nav-links">
          {WORKSPACE_NAV.map((item) => (
            <button
              key={item.id}
              aria-current={(item.tabs as readonly string[]).includes(activeTab) ? 'page' : undefined}
              onClick={() => navigatePrimary(item.id)}
            >
              {item.label}
            </button>
          ))}

          <a className="workspace-privacy-link" href="/privacy">Privacy</a>

          <button
            onClick={returnToArrival}
            className="workspace-arrival-action"
            aria-label="Return to the final office arrival screen"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Arrival</span>
          </button>

          <details className="workspace-more">
            <summary>More</summary>
            <div className="shift-more workspace-more-menu">
              {MORE_TOOLS.map(([id, label]) => (
                <button
                  key={id}
                  onClick={(event) => {
                    navigate(id);
                    event.currentTarget.closest('details')?.removeAttribute('open');
                  }}
                >
                  {label}
                </button>
              ))}
              <button onClick={replayIntro}>
                <RotateCcw size={15} aria-hidden="true" /> Replay office intro
              </button>
            </div>
          </details>

          <button
            onClick={() => setGroundingModalOpen(true)}
            className="workspace-icon-action"
            aria-label="Pause and ground"
          >
            <Pause size={17} aria-hidden="true" />
            <span className="workspace-action-label">Pause</span>
          </button>

          <button
            className="workspace-icon-action workspace-audio"
            aria-label={audioEnabled ? 'Mute sound' : 'Enable sound'}
            aria-pressed={audioEnabled}
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
          </button>
        </nav>
      </div>

      <div className="shift-support workspace-context-bar">
        <LifeContextPicker />
      </div>
    </header>
  );
};
