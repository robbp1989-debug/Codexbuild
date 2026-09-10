'use client';

import React, {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export type CinematicSequenceHandle = {
  scrollToProgress: (progress: number) => void;
};

type CinematicSequenceProps = {
  frames: string[];
  children: React.ReactNode;
};

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const renderWidth = image.naturalWidth * scale;
  const renderHeight = image.naturalHeight * scale;
  context.clearRect(0, 0, width, height);
  context.drawImage(
    image,
    (width - renderWidth) / 2,
    (height - renderHeight) / 2,
    renderWidth,
    renderHeight,
  );
}

export const CinematicSequence = forwardRef<CinematicSequenceHandle, CinematicSequenceProps>(
  function CinematicSequence({ frames, children }, forwardedRef) {
    const rootRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(forwardedRef, () => ({
      scrollToProgress(progress) {
        const root = rootRef.current;
        if (!root) return;
        const rootTop = window.scrollY + root.getBoundingClientRect().top;
        const scrollDistance = Math.max(0, root.offsetHeight - window.innerHeight);
        window.scrollTo({
          top: rootTop + scrollDistance * Math.min(1, Math.max(0, progress)),
          behavior: 'smooth',
        });
      },
    }));

    useLayoutEffect(() => {
      const root = rootRef.current;
      const canvas = canvasRef.current;
      if (!root || !canvas || frames.length === 0) return;

      gsap.registerPlugin(ScrollTrigger);

      const context2d = canvas.getContext('2d', { alpha: false });
      if (!context2d) return;
      const canvasElement = canvas;
      const drawingContext = context2d;

      const images: Array<HTMLImageElement | undefined> = Array.from({ length: frames.length });
      const playhead = { frame: 0 };
      let frameRequest = 0;
      let disposed = false;

      const resizeCanvas = () => {
        const { width, height } = canvasElement.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        canvasElement.width = Math.max(1, Math.round(width * dpr));
        canvasElement.height = Math.max(1, Math.round(height * dpr));
        drawingContext.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderFrame();
      };

      const nearestReadyFrame = (target: number) => {
        if (images[target]?.complete && images[target]?.naturalWidth) return images[target];
        for (let distance = 1; distance < images.length; distance += 1) {
          const before = images[target - distance];
          if (before?.complete && before.naturalWidth) return before;
          const after = images[target + distance];
          if (after?.complete && after.naturalWidth) return after;
        }
        return undefined;
      };

      function renderFrame() {
        if (disposed) return;
        const target = Math.min(frames.length - 1, Math.max(0, Math.round(playhead.frame)));
        const image = nearestReadyFrame(target);
        if (!image) return;
        const { width, height } = canvasElement.getBoundingClientRect();
        drawCover(drawingContext, image, width, height);
      }

      const scheduleRender = () => {
        cancelAnimationFrame(frameRequest);
        frameRequest = requestAnimationFrame(renderFrame);
      };

      const loadFrame = (index: number) => new Promise<void>((resolve) => {
        const image = new Image();
        images[index] = image;
        image.decoding = 'async';
        if (index === 0) image.fetchPriority = 'high';
        image.onload = () => {
          if (index === 0 || Math.round(playhead.frame) === index) scheduleRender();
          resolve();
        };
        image.onerror = () => resolve();
        image.src = frames[index];
      });

      const loadSequence = async () => {
        await loadFrame(0);
        await Promise.all(frames.slice(1, 3).map((_, index) => loadFrame(index + 1)));
        for (let index = 3; index < frames.length && !disposed; index += 1) {
          await loadFrame(index);
        }
      };

      void loadSequence();
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas, { passive: true });

      const animationContext = gsap.context(() => {
        const panels = gsap.utils.toArray<HTMLElement>('.cinematic-panel');
        // All panels are controlled by this single scrubbed timeline. Using discrete
        // hand-offs instead of overlapping opacity tweens guarantees that reversing
        // through a boundary cannot leave two stages visible at the same time.
        const panelState = { autoAlpha: 0, y: 30, filter: 'blur(8px)' };
        const stages = [
          ['.cinematic-panel--hero', 0],
          ['.cinematic-panel--context', 1.1],
          ['.cinematic-panel--reflection', 2.5],
          ['.cinematic-panel--tool-0', 4.1],
          ['.cinematic-panel--tool-1', 5.5],
          ['.cinematic-panel--tool-2', 6.9],
          ['.cinematic-panel--tool-3', 8.3],
          ['.cinematic-panel--discipline', 9.7],
          ['.cinematic-panel--arrival', 11.1],
          ['.cinematic-panel--process', 11.7],
        ] as const;
        const stagePanels = stages.reduce<Array<{ panel: HTMLElement; at: number }>>((available, [selector, at]) => {
          const panel = panels.find((candidate) => candidate.matches(selector));
          if (panel) available.push({ panel, at });
          return available;
        }, []);
        let activeStage = -1;

        const updateStage = (time: number) => {
          const nextStage = stagePanels.reduce((active, stage, index) => (
            time >= stage.at ? index : active
          ), 0);
          if (nextStage === activeStage) return;
          const nextPanel = stagePanels[nextStage]?.panel;
          if (!nextPanel) return;
          gsap.set(panels, panelState);
          gsap.set(nextPanel, { autoAlpha: 1, y: 0, filter: 'blur(0px)' });
          activeStage = nextStage;
        };

        updateStage(0);

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
            onRefresh: (trigger) => updateStage(trigger.progress * 13),
            onUpdate: (trigger) => updateStage(trigger.progress * 13),
          },
        });

        timeline.to(playhead, {
          frame: frames.length - 1,
          duration: 13,
          ease: 'none',
          snap: 'frame',
          onUpdate: scheduleRender,
        }, 0);

      }, root);

      return () => {
        disposed = true;
        cancelAnimationFrame(frameRequest);
        window.removeEventListener('resize', resizeCanvas);
        animationContext.revert();
      };
    }, [frames]);

    return (
      <div ref={rootRef} className="cinematic-scroll">
        <div className="cinematic-stage">
          <canvas ref={canvasRef} className="cinematic-canvas" aria-hidden="true" />
          <div className="cinematic-vignette" aria-hidden="true" />
          {children}
          <div className="cinematic-scroll-cue" aria-hidden="true">
            <span>Scroll to enter</span>
            <i />
          </div>
        </div>
      </div>
    );
  },
);
