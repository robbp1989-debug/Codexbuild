import React from 'react';
import { Gamepad2, Pause, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LifeContextPicker } from './LifeContextPicker';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, audioEnabled, setAudioEnabled, playSoftSound, setGroundingModalOpen } = useApp();
  const navigate = (tab: string) => { playSoftSound('tap'); setActiveTab(tab); window.scrollTo({ top: 0 }); };
  const main = [
    { id: 'home', label: '1 · Reflect', tabs: ['home', 'reflect', 'breakdown'] },
    { id: 'arcade', label: '2 · Practice', tabs: ['arcade', 'scenario-game'] },
    { id: 'therapy-prep', label: '3 · Therapy Prep', tabs: ['therapy-prep'] },
  ];
  const more = [['dashboard', 'My reflections'], ['prediction-lab', 'Real-world experiments'], ['skills', 'Skills'], ['memory', 'Memory'], ['safety', 'Safety & support']];
  return <header className="shift-header sticky top-0 z-40">
    <div className="shift-nav">
      <button className="shift-brand" aria-label="SHIFT home" onClick={() => navigate('home')}><Gamepad2 aria-hidden="true" /> SHIFT</button>
      <nav aria-label="Main navigation" className="shift-nav-links">
        {main.map(item => <button key={item.id} id={`nav-${item.id}`} aria-current={item.tabs.includes(activeTab) ? 'page' : undefined} onClick={() => navigate(item.id)}>{item.label}</button>)}
        <details><summary>More</summary><div className="shift-more">{more.map(([id, label]) => <button key={id} onClick={event => { navigate(id); event.currentTarget.closest('details')?.removeAttribute('open'); }}>{label}</button>)}</div></details>
        <button onClick={() => setGroundingModalOpen(true)} className="inline-flex items-center gap-2"><Pause size={16} aria-hidden="true" /> Pause</button>
        <button aria-label={audioEnabled ? 'Mute sound' : 'Enable sound'} aria-pressed={audioEnabled} onClick={() => setAudioEnabled(!audioEnabled)}>{audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
      </nav>
    </div>
    <div className="shift-support"><LifeContextPicker /></div>
  </header>;
};
