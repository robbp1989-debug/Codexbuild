export type NumberedFrameSequence = {
  basePath: string;
  frameCount: number;
  startAt?: number;
  pad?: number;
  extension?: string;
};

export type CinematicVideoSource = {
  src: string;
  type: string;
};

export function buildNumberedFrameSequence({
  basePath,
  frameCount,
  startAt = 1,
  pad = 4,
  extension = 'webp',
}: NumberedFrameSequence) {
  return Array.from({ length: frameCount }, (_, index) => {
    const frameNumber = String(startAt + index).padStart(pad, '0');
    return `${basePath}/frame-${frameNumber}.${extension}`;
  });
}

// Video is now the preferred transport layer because native video decoding gives
// the scroll sequence many more visual states than the original eight stills.
// The component automatically falls back to LANDING_FRAMES when the video asset
// has not been added yet or cannot be decoded by the browser.
export const LANDING_VIDEO_SOURCES: CinematicVideoSource[] = [
  { src: '/landing-sequence/shift-office-entry.webm', type: 'video/webm' },
  { src: '/landing-sequence/shift-office-entry.mp4', type: 'video/mp4' },
];

export const LANDING_VIDEO_POSTER = '/landing-sequence/frame-0001.webp';

export const LANDING_FRAMES = buildNumberedFrameSequence({
  basePath: '/landing-sequence',
  frameCount: 8,
});

export const LANDING_STOPS = {
  hero: 0,
  chair: 0.82,
  // The last portion of the scroll holds on the chair while the real workspace appears.
  workspace: 0.92,
} as const;
