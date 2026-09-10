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

function isReady(image?: HTMLImageElement) {
  return Boolean(image?.complete && image.naturalWidth);
}

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  alpha = 1,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const renderWidth = image.naturalWidth * scale;
  const renderHeight = image.naturalHeight * scale;

  context.save();
  context.globalAlpha = alpha;
  context.drawImage(
    image,
    (width - renderWidth) / 2,
    (height - renderHeight) / 2,
    renderWidth,
    renderHeight,
  );
  context.restore();
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
      const stageElement = root.querySelector<HTMLElement>('.cinematic-stage');
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const images: Array<HTMLImageElement | undefined> = Array.from({ length: frames.length });
      const playhead = { frame: 0 };
      let frameRequest = 0;
      let disposed = false;

      const setResponsiveTunnelLength = () => {
        if (prefersReducedMotion) {
          root.style.height = '180vh';
          return;
        }
        const width = window.innerWidth;
        root.style.height = width <= 640 ? '360vh' : width <= 900 ? '400vh' : '460vh';
      };

      const nearestReadyFrame = (target: number) => {
        const roundedTarget = Math.round(target);
        if (isReady(images[roundedTarget])) return images[roundedTarget];
        for (let distance = 1; distance < images.length; distance += 1) {
          const before = images[roundedTarget - distance];
          if (isReady(before)) return before;
          const after = images[roundedTarget + distance];
          if (isReady(after)) return after;
        }
        return undefined;
      };

      function renderFrame() {
        if (disposed) return;
        const { width, height } = (stageElement ?? canvasElement).getBoundingClientRect();
        const target = Math.min(frames.length - 1, Math.max(0, playhead.frame));
        const lowerIndex = Math.floor(target);
        const upperIndex = Math.min(frames.length - 1, Math.ceil(target));
        const blend = target - lowerIndex;
        const lower = images[lowerIndex];
        const upper = images[upperIndex];

        drawingContext.clearRect(0, 0, width, height);

        if (isReady(lower) && isReady(upper)) {
          drawImageCover(drawingContext, lower!, width, height, 1);
          if (upperIndex !== lowerIndex && blend > 0.001) {
            drawImageCover(drawingContext, upper!, width, height, blend);
          }
          return;
        }

        const fallback = nearestReadyFrame(target);
        if (fallback) drawImageCover(drawingContext, fallback, width, height, 1);
      }

      const resizeCanvas = () => {
        setResponsiveTunnelLength();
        const { width, height } = (stageElement ?? canvasElement).getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        canvasElement.width = Math.max(1, Math.round(width * dpr));
        canvasElement.height = Math.max(1, Math.round(height * dpr));
        drawingContext.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderFrame();
        ScrollTrigger.refresh();
      };

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
          if (index <= 1 || Math.abs(playhead.frame - index) < 1.2) scheduleRender();
          resolve();
        };
        image.onerror = () => resolve();
        image.src = frames[index];
      });

      const loadSequence = async () => {
        await loadFrame(0);
        await Promise.all(frames.slice(1, 4).map((_, index) => loadFrame(index + 1)));
        for (let index = 4; index < frames.length && !disposed; index += 1) {
          await loadFrame(index);
        }
      };

      void loadSequence();
      setResponsiveTunnelLength();
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas, { passive: true });

      const animationContext = gsap.context(() => {
        const panels = gsap.utils.toArray<HTMLElement>('.cinematic-panel');
        const hero = panels.find((panel) => panel.matches('.cinematic-panel--hero'));
        const menuRise = panels.find((panel) => panel.matches('.cinematic-panel--menu-rise'));
        const depthFar = root.querySelector<HTMLElement>('.cinematic-depth--far');
        const depthMid = root.querySelector<HTMLElement>('.cinematic-depth--mid');
        const depthNear = root.querySelector<HTMLElement>('.cinematic-depth--near');
        const CAMERA_TRAVEL_DURATION = 8;
        const MENU_RISE_AT = 7.35;

        gsap.set(panels, { autoAlpha: 0 });
        if (hero) gsap.set(hero, { autoAlpha: 1, y: 0, filter: 'blur(0px)' });
        if (menuRise) gsap.set(menuRise, { autoAlpha: 0, y: '72vh', filter: 'blur(4px)' });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom bottom',
            scrub: prefersReducedMotion ? false : 0.28,
            invalidateOnRefresh: true,
          },
        });

        timeline.to(playhead, {
          frame: frames.length - 1,
          duration: CAMERA_TRAVEL_DURATION,
          ease: 'none',
          onUpdate: scheduleRender,
        }, 0);

        if (!prefersReducedMotion) {
          // The frame sequence now carries most of the perceived travel. These layers
          // only add gentle parallax so the movement does not feel like a digital zoom.
          if (depthFar) timeline.to(depthFar, { scale: 1.035, z: -40, duration: CAMERA_TRAVEL_DURATION, ease: 'none' }, 0);
          if (depthMid) timeline.to(depthMid, { scale: 1.12, z: 55, duration: CAMERA_TRAVEL_DURATION, ease: 'none' }, 0);
          if (depthNear) timeline.to(depthNear, { scale: 1.55, z: 220, autoAlpha: 0, duration: 6.2, ease: 'none' }, 0.35);
          timeline.to(canvasElement, { scale: 1.055, duration: CAMERA_TRAVEL_DURATION, ease: 'none' }, 0);
        }

        if (hero) {
          timeline.to(hero, {
            autoAlpha: 0,
            y: -24,
            filter: prefersReducedMotion ? 'none' : 'blur(4px)',
            duration: 1.15,
            ease: 'power2.out',
          }, 1.05);
        }

        if (menuRise) {
          timeline
            .set(menuRise, { autoAlpha: 1 }, MENU_RISE_AT)
            .to(menuRise, {
              y: 0,
              filter: 'blur(0px)',
              duration: 1.25,
              ease: prefersReducedMotion ? 'none' : 'power3.out',
            }, MENU_RISE_AT);
        }
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
          <div className="cinematic-depth" aria-hidden="true">
            <span className="cinematic-depth-layer cinematic-depth--far" />
            <span className="cinematic-depth-layer cinematic-depth--mid" />
            <span className="cinematic-depth-layer cinematic-depth--near" />
          </div>
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
