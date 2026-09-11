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

// The approved production asset is an H.264 MP4, so offer it first and avoid
// delaying first paint while the browser probes an optional WebM that may not exist.
// The component still falls back to LANDING_FRAMES if the movie cannot be loaded.
export const LANDING_VIDEO_SOURCES: CinematicVideoSource[] = [
  { src: '/landing-sequence/shift-office-entry.mp4', type: 'video/mp4' },
  { src: '/landing-sequence/shift-office-entry.webm', type: 'video/webm' },
];

export const LANDING_VIDEO_POSTER = '/landing-sequence/frame-0001.webp';
export const LANDING_VIDEO_FPS = 24;

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
