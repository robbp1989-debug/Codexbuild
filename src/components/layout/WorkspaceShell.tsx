'use client';

import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface WorkspaceShellProps {
  children: React.ReactNode;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({ children }) => {
  return (
    <div className="shift-light workspace-office min-h-screen text-slate-900 selection:bg-sky-300/50 selection:text-slate-950">
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
