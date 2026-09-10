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

type CinematicVideoSource = {
  src: string;
  type: string;
};

type CinematicSequenceProps = {
  frames: string[];
  videoSources?: CinematicVideoSource[];
  poster?: string;
  videoFps?: number;
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

  context.globalAlpha = alpha;
  context.drawImage(
    image,
    (width - renderWidth) / 2,
    (height - renderHeight) / 2,
    renderWidth,
    renderHeight,
  );
  context.globalAlpha = 1;
}

export const CinematicSequence = forwardRef<CinematicSequenceHandle, CinematicSequenceProps>(
  function CinematicSequence({ frames, videoSources = [], poster, videoFps = 24, children }, forwardedRef) {
    const rootRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

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
      const video = videoRef.current;
      if (!root || !canvas || frames.length === 0) return;

      gsap.registerPlugin(ScrollTrigger);

      const context2d = canvas.getContext('2d', { alpha: false });
      if (!context2d) return;
      const canvasElement = canvas;
      const videoElement = video;
      const drawingContext = context2d;
      const stageElement = root.querySelector<HTMLElement>('.cinematic-stage');
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      drawingContext.imageSmoothingEnabled = true;
      drawingContext.imageSmoothingQuality = 'high';

      const images: Array<HTMLImageElement | undefined> = Array.from({ length: frames.length });
      const transport = { progress: 0 };
      let frameRequest = 0;
      let resizeRequest = 0;
      let disposed = false;
      let viewportWidth = 1;
      let viewportHeight = 1;
      let videoReady = false;
      let videoDuration = 0;
      let lastVideoTarget = -1;

      const setResponsiveTunnelLength = () => {
        if (prefersReducedMotion) {
          root.style.height = '150vh';
          return;
        }

        const width = window.innerWidth;
        // The approved dense video has 240 real frames. One compact viewport-plus
        // journey is enough to feel cinematic without making the user spin the wheel.
        root.style.height = width <= 640 ? '190vh' : width <= 900 ? '200vh' : '210vh';
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

      function renderFallbackFrame() {
        const target = Math.min(frames.length - 1, Math.max(0, transport.progress * (frames.length - 1)));
        const lowerIndex = Math.floor(target);
        const upperIndex = Math.min(frames.length - 1, Math.ceil(target));
        const rawBlend = target - lowerIndex;
        const blend = rawBlend * rawBlend * (3 - 2 * rawBlend);
        const lower = images[lowerIndex];
        const upper = images[upperIndex];

        if (isReady(lower) && isReady(upper)) {
          drawImageCover(drawingContext, lower!, viewportWidth, viewportHeight, 1);
          if (upperIndex !== lowerIndex && blend > 0.001) {
            drawImageCover(drawingContext, upper!, viewportWidth, viewportHeight, blend);
          }
          return;
        }

        const fallback = nearestReadyFrame(target);
        if (fallback) drawImageCover(drawingContext, fallback, viewportWidth, viewportHeight, 1);
      }

      function renderVisual() {
        if (disposed) return;

        if (videoElement && videoReady && videoDuration > 0) {
          // The production movie is 24fps and encoded for seeking. Quantizing the
          // scroll target to real video frames prevents the browser from doing many
          // useless sub-frame seeks between the same two encoded pictures.
          const safeFps = Math.max(1, videoFps);
          const maxFrameIndex = Math.max(0, Math.floor(videoDuration * safeFps) - 1);
          const targetFrame = Math.min(
            maxFrameIndex,
            Math.max(0, Math.round(transport.progress * maxFrameIndex)),
          );
          const targetTime = targetFrame / safeFps;

          if (targetTime !== lastVideoTarget) {
            lastVideoTarget = targetTime;
            try {
              videoElement.currentTime = targetTime;
            } catch {
              // If a browser temporarily rejects a seek while loading, the next
              // ScrollTrigger update will retry on the next real frame boundary.
            }
          }
          return;
        }

        renderFallbackFrame();
      }

      const scheduleRender = () => {
        cancelAnimationFrame(frameRequest);
        frameRequest = requestAnimationFrame(renderVisual);
      };

      const activateVideo = () => {
        if (!videoElement || disposed || !Number.isFinite(videoElement.duration) || videoElement.duration <= 0) return;
        videoDuration = videoElement.duration;
        videoReady = true;
        videoElement.pause();
        videoElement.style.opacity = '1';
        canvasElement.style.opacity = '0';
        scheduleRender();
      };

      const useFrameFallback = () => {
        videoReady = false;
        if (videoElement) videoElement.style.opacity = '0';
        canvasElement.style.opacity = '1';
        scheduleRender();
      };

      if (videoElement && videoSources.length > 0) {
        // Wait until the first decoded frame is available before fading away the
        // still-image fallback. This prevents the brief black flash some browsers
        // show when only metadata has loaded.
        videoElement.addEventListener('loadeddata', activateVideo);
        videoElement.addEventListener('error', useFrameFallback);
        videoElement.pause();
        videoElement.load();
      } else {
        useFrameFallback();
      }

      const resizeCanvas = () => {
        setResponsiveTunnelLength();
        const { width, height } = (stageElement ?? canvasElement).getBoundingClientRect();
        viewportWidth = Math.max(1, width);
        viewportHeight = Math.max(1, height);

        const maxDpr = width > 1400 ? 1.25 : width > 900 ? 1.35 : 1.5;
        const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
        canvasElement.width = Math.max(1, Math.round(width * dpr));
        canvasElement.height = Math.max(1, Math.round(height * dpr));
        drawingContext.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawingContext.imageSmoothingEnabled = true;
        drawingContext.imageSmoothingQuality = 'high';
        renderFallbackFrame();
        ScrollTrigger.refresh();
      };

      const scheduleResize = () => {
        cancelAnimationFrame(resizeRequest);
        resizeRequest = requestAnimationFrame(resizeCanvas);
      };

      const loadFrame = (index: number) => new Promise<void>((resolve) => {
        const image = new Image();
        images[index] = image;
        image.decoding = 'async';
        if (index === 0) image.fetchPriority = 'high';
        image.onload = async () => {
          try {
            await image.decode();
          } catch {
            // onload already guarantees a usable image in browsers that reject decode().
          }
          if (!videoReady && (index <= 1 || Math.abs(transport.progress * (frames.length - 1) - index) < 1.5)) {
            scheduleRender();
          }
          resolve();
        };
        image.onerror = () => resolve();
        image.src = frames[index];
      });

      const loadSequence = async () => {
        await loadFrame(0);
        if (disposed) return;
        await Promise.all(frames.slice(1).map((_, index) => loadFrame(index + 1)));
      };

      void loadSequence();
      setResponsiveTunnelLength();
      resizeCanvas();
      window.addEventListener('resize', scheduleResize, { passive: true });

      const animationContext = gsap.context(() => {
        const panels = gsap.utils.toArray<HTMLElement>('.cinematic-panel');
        const hero = panels.find((panel) => panel.matches('.cinematic-panel--hero'));
        const workspaceArrival = panels.find((panel) => panel.matches('.cinematic-panel--menu-rise'));
        const depthFar = root.querySelector<HTMLElement>('.cinematic-depth--far');
        const depthMid = root.querySelector<HTMLElement>('.cinematic-depth--mid');
        const depthNear = root.querySelector<HTMLElement>('.cinematic-depth--near');
        const vignette = root.querySelector<HTMLElement>('.cinematic-vignette');
        const scrollCue = root.querySelector<HTMLElement>('.cinematic-scroll-cue');
        const mediaTargets = [canvasElement, videoElement].filter(Boolean) as HTMLElement[];

        const FRAME_TRAVEL_DURATION = 7.1;
        const CHAIR_SETTLE_AT = 6.15;
        const CHAIR_SETTLE_DURATION = 1.2;
        const WORKSPACE_REVEAL_AT = 7.35;
        // The real 240-frame movie supplies the visual continuity now, so scrub can
        // stay responsive instead of using a long lag to hide eight-frame stepping.
        const SCRUB_SMOOTHING = window.innerWidth <= 640 ? 0.56 : window.innerWidth <= 900 ? 0.64 : 0.72;

        gsap.set(panels, { autoAlpha: 0 });
        gsap.set(mediaTargets, { transformOrigin: '48% 64%' });
        if (hero) gsap.set(hero, { autoAlpha: 1, y: 0, filter: 'blur(0px)', pointerEvents: 'auto' });
        if (workspaceArrival) {
          gsap.set(workspaceArrival, {
            autoAlpha: 0,
            y: 34,
            scale: 0.992,
            filter: prefersReducedMotion ? 'none' : 'blur(6px)',
            pointerEvents: 'none',
          });
        }

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom bottom',
            scrub: prefersReducedMotion ? false : SCRUB_SMOOTHING,
            invalidateOnRefresh: true,
          },
        });

        timeline.to(transport, {
          progress: 1,
          duration: FRAME_TRAVEL_DURATION,
          ease: 'none',
          onUpdate: scheduleRender,
        }, 0);

        if (!prefersReducedMotion) {
          if (depthFar) timeline.to(depthFar, { scale: 1.025, z: -28, duration: FRAME_TRAVEL_DURATION, ease: 'none' }, 0);
          if (depthMid) timeline.to(depthMid, { scale: 1.08, z: 40, duration: FRAME_TRAVEL_DURATION, ease: 'none' }, 0);
          if (depthNear) timeline.to(depthNear, { scale: 1.42, z: 170, autoAlpha: 0, duration: 5.8, ease: 'none' }, 0.3);

          timeline.to(mediaTargets, {
            scale: 1.028,
            duration: CHAIR_SETTLE_AT,
            ease: 'none',
          }, 0);
          timeline.to(mediaTargets, {
            scale: 1.11,
            duration: CHAIR_SETTLE_DURATION,
            ease: 'power1.inOut',
          }, CHAIR_SETTLE_AT);
        }

        if (hero) {
          timeline.to(hero, {
            autoAlpha: 0,
            y: -24,
            filter: prefersReducedMotion ? 'none' : 'blur(4px)',
            pointerEvents: 'none',
            duration: 1.15,
            ease: 'power2.out',
          }, 1.05);
        }

        if (scrollCue) timeline.to(scrollCue, { autoAlpha: 0, duration: 0.7, ease: 'none' }, 0.8);
        if (vignette) timeline.to(vignette, { autoAlpha: 0.72, duration: 0.9, ease: 'none' }, WORKSPACE_REVEAL_AT - 0.35);

        if (workspaceArrival) {
          timeline
            .set(workspaceArrival, { autoAlpha: 1, pointerEvents: 'auto' }, WORKSPACE_REVEAL_AT)
            .to(workspaceArrival, {
              y: 0,
              scale: 1,
              filter: 'blur(0px)',
              duration: 1.05,
              ease: prefersReducedMotion ? 'none' : 'power3.out',
            }, WORKSPACE_REVEAL_AT);
        }
      }, root);

      return () => {
        disposed = true;
        cancelAnimationFrame(frameRequest);
        cancelAnimationFrame(resizeRequest);
        window.removeEventListener('resize', scheduleResize);
        if (videoElement) {
          videoElement.removeEventListener('loadeddata', activateVideo);
          videoElement.removeEventListener('error', useFrameFallback);
        }
        animationContext.revert();
      };
    }, [frames, videoSources, videoFps]);

    return (
      <div ref={rootRef} className="cinematic-scroll">
        <div className="cinematic-stage">
          <canvas
            ref={canvasRef}
            className="cinematic-canvas"
            aria-hidden="true"
            style={{ opacity: 1, transition: 'opacity 180ms ease' }}
          />
          {videoSources.length > 0 && (
            <video
              ref={videoRef}
              className="cinematic-canvas cinematic-video"
              poster={poster}
              preload="auto"
              muted
              playsInline
              disablePictureInPicture
              aria-hidden="true"
              style={{ opacity: 0, transition: 'opacity 180ms ease' }}
            >
              {videoSources.map((source) => (
                <source key={source.src} src={source.src} type={source.type} />
              ))}
            </video>
          )}
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
