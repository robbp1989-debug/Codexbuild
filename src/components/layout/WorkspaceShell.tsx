'use client';

import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface WorkspaceShellProps {
  children: React.ReactNode;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({ children }) => {
  const { activeTab } = useApp();
  const immersiveClass = activeTab === 'conversation' ? ' workspace-office--conversation' : '';

  useEffect(() => {
    // Workspace tools are distinct stationary views. Do not inherit the scroll
    // position from the previous tool (for example, the bottom of a breakdown).
    // Arrival replay is handled outside WorkspaceShell by the cinematic page.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

  return (
    <div className={`shift-light workspace-office${immersiveClass} min-h-screen text-slate-900 selection:bg-sky-300/50 selection:text-slate-950`}>
      <div className="workspace-office__background" aria-hidden="true" />
      <div className="workspace-office__veil" aria-hidden="true" />

      <div className="workspace-office__app">
        <Navbar />
        <main className="workspace-office__main" id="shift-workspace-main">
          <div className="workspace-office__surface">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};
