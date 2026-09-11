'use client';

import React, {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';

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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

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
        const scrollDistance = Math.max(1, root.offsetHeight - window.innerHeight);
        window.scrollTo({
          top: rootTop + scrollDistance * clamp(progress, 0, 1),
          behavior: 'smooth',
        });
      },
    }));

    useLayoutEffect(() => {
      const root = rootRef.current;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!root || !canvas || frames.length === 0) return;

      const drawingContext = canvas.getContext('2d', { alpha: false });
      if (!drawingContext) return;

      const stage = root.querySelector<HTMLElement>('.cinematic-stage');
      const hero = root.querySelector<HTMLElement>('.cinematic-panel--hero');
      const heroCopy = root.querySelector<HTMLElement>('.cinematic-hero-copy');
      const arrival = root.querySelector<HTMLElement>('.cinematic-panel--menu-rise');
      const scrollCue = root.querySelector<HTMLElement>('.cinematic-scroll-cue');
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const images: Array<HTMLImageElement | undefined> = Array.from({ length: frames.length });
      let disposed = false;
      let display = 0;
      let target = 0;
      let duration = 10;
      let videoReady = false;
      let frameRequest = 0;
      let resizeRequest = 0;
      let viewportWidth = 1;
      let viewportHeight = 1;

      drawingContext.imageSmoothingEnabled = true;
      drawingContext.imageSmoothingQuality = 'high';

      const setApprovedScrollDistance = () => {
        root.style.height = window.innerWidth <= 640 ? '190vh' : '210vh';
      };

      const nearestReadyFrame = (rawTarget: number) => {
        const roundedTarget = Math.round(rawTarget);
        if (isReady(images[roundedTarget])) return images[roundedTarget];

        for (let distance = 1; distance < images.length; distance += 1) {
          const before = images[roundedTarget - distance];
          if (isReady(before)) return before;
          const after = images[roundedTarget + distance];
          if (isReady(after)) return after;
        }

        return undefined;
      };

      const renderFallbackFrame = () => {
        const rawFrame = clamp(display, 0, 1) * (frames.length - 1);
        const lowerIndex = Math.floor(rawFrame);
        const upperIndex = Math.min(frames.length - 1, Math.ceil(rawFrame));
        const lower = images[lowerIndex];
        const upper = images[upperIndex];
        const blend = smoothstep(rawFrame - lowerIndex);

        if (isReady(lower) && isReady(upper)) {
          drawImageCover(drawingContext, lower!, viewportWidth, viewportHeight, 1);
          if (upperIndex !== lowerIndex && blend > 0.001) {
            drawImageCover(drawingContext, upper!, viewportWidth, viewportHeight, blend);
          }
          return;
        }

        const fallback = nearestReadyFrame(rawFrame);
        if (fallback) drawImageCover(drawingContext, fallback, viewportWidth, viewportHeight, 1);
      };

      const renderMedia = () => {
        if (disposed) return;

        if (video && videoReady && duration > 0) {
          const safeFps = Math.max(1, videoFps);
          const frame = Math.round(clamp(display, 0, 1) * duration * safeFps);
          const time = Math.min(Math.max(0, duration - 0.001), frame / safeFps);

          if (Math.abs(video.currentTime - time) > 0.012) {
            try {
              video.currentTime = time;
            } catch {
              // Browsers can briefly reject seeks while media buffers. The next
              // animation frame retries naturally, matching the approved preview.
            }
          }
          return;
        }

        renderFallbackFrame();
      };

      const applyPresentation = () => {
        const heroExit = clamp((display - 0.08) / 0.17, 0, 1);
        if (hero) {
          hero.style.opacity = String(1 - heroExit);
          hero.style.visibility = heroExit >= 0.999 ? 'hidden' : 'visible';
          hero.style.pointerEvents = heroExit >= 0.8 ? 'none' : 'auto';
        }
        if (heroCopy) {
          heroCopy.style.transform = `translateY(${-22 * heroExit}px)`;
          heroCopy.style.filter = prefersReducedMotion ? 'none' : `blur(${3.5 * heroExit}px)`;
        }

        if (scrollCue) {
          scrollCue.style.opacity = String(clamp(1 - display * 4, 0, 1));
        }

        if (arrival) {
          const reveal = smoothstep(clamp((display - 0.78) / 0.16, 0, 1));
          arrival.style.opacity = String(reveal);
          arrival.style.visibility = reveal <= 0.001 ? 'hidden' : 'visible';
          arrival.style.transform = `translateY(${22 * (1 - reveal)}px)`;
          arrival.style.pointerEvents = reveal > 0.8 ? 'auto' : 'none';
        }
      };

      const render = () => {
        renderMedia();
        applyPresentation();
      };

      const tick = () => {
        frameRequest = 0;
        if (disposed) return;

        if (prefersReducedMotion) {
          display = target;
        } else {
          display += (target - display) * 0.22;
        }

        render();

        if (!prefersReducedMotion && Math.abs(target - display) > 0.0005) {
          frameRequest = requestAnimationFrame(tick);
          return;
        }

        display = target;
        render();
      };

      const requestTick = () => {
        if (!frameRequest) frameRequest = requestAnimationFrame(tick);
      };

      const updateTarget = () => {
        const rootTop = window.scrollY + root.getBoundingClientRect().top;
        const scrollDistance = Math.max(1, root.offsetHeight - window.innerHeight);
        target = clamp((window.scrollY - rootTop) / scrollDistance, 0, 1);
        requestTick();
      };

      const resizeCanvas = () => {
        setApprovedScrollDistance();
        const bounds = (stage ?? canvas).getBoundingClientRect();
        viewportWidth = Math.max(1, bounds.width);
        viewportHeight = Math.max(1, bounds.height);

        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.max(1, Math.round(viewportWidth * dpr));
        canvas.height = Math.max(1, Math.round(viewportHeight * dpr));
        drawingContext.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawingContext.imageSmoothingEnabled = true;
        drawingContext.imageSmoothingQuality = 'high';
        renderFallbackFrame();
        updateTarget();
      };

      const scheduleResize = () => {
        cancelAnimationFrame(resizeRequest);
        resizeRequest = requestAnimationFrame(resizeCanvas);
      };

      const activateVideo = () => {
        if (!video || disposed || !Number.isFinite(video.duration) || video.duration <= 0) return;
        duration = video.duration || 10;
        videoReady = true;
        video.pause();
        video.style.opacity = '1';
        canvas.style.opacity = '0';
        requestTick();
      };

      const useFrameFallback = () => {
        videoReady = false;
        if (video) video.style.opacity = '0';
        canvas.style.opacity = '1';
        requestTick();
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
            // onload already guarantees a drawable image when decode() is unavailable.
          }
          if (!videoReady) requestTick();
          resolve();
        };
        image.onerror = () => resolve();
        image.src = frames[index];
      });

      void Promise.all(frames.map((_, index) => loadFrame(index)));

      if (video && videoSources.length > 0) {
        video.addEventListener('loadedmetadata', activateVideo);
        video.addEventListener('loadeddata', activateVideo);
        video.addEventListener('error', useFrameFallback);
        video.pause();
        video.load();
        if (video.readyState >= 1) activateVideo();
      } else {
        useFrameFallback();
      }

      setApprovedScrollDistance();
      resizeCanvas();
      window.addEventListener('scroll', updateTarget, { passive: true });
      window.addEventListener('resize', scheduleResize, { passive: true });

      return () => {
        disposed = true;
        cancelAnimationFrame(frameRequest);
        cancelAnimationFrame(resizeRequest);
        window.removeEventListener('scroll', updateTarget);
        window.removeEventListener('resize', scheduleResize);
        if (video) {
          video.removeEventListener('loadedmetadata', activateVideo);
          video.removeEventListener('loadeddata', activateVideo);
          video.removeEventListener('error', useFrameFallback);
        }
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
