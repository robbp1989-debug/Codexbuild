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

// Replacing the current set with a longer sequence only requires adding the
// numbered assets and updating frameCount.
export const LANDING_FRAMES = buildNumberedFrameSequence({
  basePath: '/landing-sequence',
  frameCount: 8,
});

export const LANDING_STOPS = {
  hero: 0,
  lifeContext: 0.085,
  reflection: 0.192,
  tools: 0.315,
  discipline: 0.746,
  arrival: 0.854,
  process: 0.9,
} as const;
