export type NumberedFrameSequence = {
  basePath: string;
  frameCount: number;
  startAt?: number;
  pad?: number;
  extension?: string;
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

// The renderer crossfades continuously between the available source frames,
// so the current eight-frame set behaves like a much denser sequence without
// duplicating assets. If true intermediate renders are added later, only raise
// frameCount and drop the numbered files into /public/landing-sequence.
export const LANDING_FRAMES = buildNumberedFrameSequence({
  basePath: '/landing-sequence',
  frameCount: 8,
});

export const LANDING_STOPS = {
  hero: 0,
  // Arrive where the in-office menu is already beginning to rise.
  menu: 0.91,
} as const;
