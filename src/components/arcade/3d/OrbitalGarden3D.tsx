import React from 'react';

export const OrbitalGarden3D: React.FC = () => {
  return (
    <section className="space-y-4" aria-labelledby="orbital-garden-heading">
      <div className="rounded-2xl border border-teal-500/30 bg-slate-900/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-mono font-bold tracking-[0.18em] text-teal-300">
              EXPERIMENTAL 3D PRACTICE
            </p>
            <h2 id="orbital-garden-heading" className="mt-1 text-lg font-bold text-slate-100">
              Orbital Garden
            </h2>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-[10px] font-mono text-slate-400">
            48,000 PARTICLES · WEBGL
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-400">
          Move among a flower, gravity ring, and spiral galaxy. For this first compatibility pass,
          SHIFT preserves the original interaction engine so touch, motion, audio, reduced-motion,
          and performance can be verified before the exercise is personalized.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#080f12] shadow-2xl">
        <iframe
          src="/games/orbital-garden/index.html"
          title="Orbital Garden interactive 3D particle experience"
          className="block h-[920px] w-full sm:h-[1050px]"
          loading="eager"
          allow="autoplay"
        />
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-slate-500">
        Original Orbital Garden code, copy, and generated visuals are distributed under CC0 1.0.
        This first SHIFT build is an integration test, not a scored training exercise.
      </p>
    </section>
  );
};
