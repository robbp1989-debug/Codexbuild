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
  const isConversation = activeTab === 'conversation';
  const immersiveClass = isConversation ? ' workspace-office--conversation' : '';

  useEffect(() => {
    // Workspace tools are distinct stationary views. Do not inherit the scroll
    // position from the previous tool (for example, the bottom of a breakdown).
    // Arrival replay is handled outside WorkspaceShell by the cinematic page.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

  const holdConversationBackgroundAtArrival = (video: HTMLVideoElement) => {
    const seekToArrival = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      try {
        video.currentTime = Math.max(0, video.duration - 0.08);
        video.pause();
      } catch {
        // The static fallback remains underneath if a browser cannot seek yet.
      }
    };

    if (video.readyState >= 1) seekToArrival();
    else video.addEventListener('loadedmetadata', seekToArrival, { once: true });
  };

  return (
    <div className={`shift-light workspace-office${immersiveClass} min-h-screen text-slate-900 selection:bg-sky-300/50 selection:text-slate-950`}>
      <div className="workspace-office__background" aria-hidden="true" />
      {isConversation && (
        <video
          className="workspace-office__background-video"
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          onLoadedMetadata={(event) => holdConversationBackgroundAtArrival(event.currentTarget)}
          onLoadedData={(event) => holdConversationBackgroundAtArrival(event.currentTarget)}
        >
          <source src="/landing-sequence/shift-office-entry.mp4" type="video/mp4" />
          <source src="/landing-sequence/shift-office-entry.webm" type="video/webm" />
        </video>
      )}
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
