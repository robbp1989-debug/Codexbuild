# SHIFT cinematic video asset

The landing renderer is video-first and automatically falls back to the existing `frame-0001.webp` through `frame-0008.webp` sequence if the production movie is unavailable or cannot be decoded.

## Approved production asset

The selected production master is the 10-second Gemini office-entry animation approved on 2026-09-10. The web encode should be saved here as:

- `shift-office-entry.mp4`

Optional later alternative:

- `shift-office-entry.webm`

The browser is configured to request the MP4 first.

## Production encode used for scroll scrubbing

- Codec/container: H.264 MP4
- Resolution: 1280×720
- Duration: 10.0 seconds
- Frame rate: 24 fps
- Frames: 240
- Pixel format: yuv420p
- Audio: removed
- MP4 metadata: faststart enabled
- Seeking: short-GOP/all-intra-friendly production encoding is preferred because the page maps scroll position directly to movie time

For the finalized handoff encode, every encoded frame can be made independently seekable (`-g 1`) when the extra file size is acceptable. This produces the most reliable frame-accurate reverse/forward scroll behavior. A short GOP of 6 frames is the lighter fallback.

## Runtime behavior

The React/GSAP component quantizes scroll targets to the movie's real 24 fps frame boundaries instead of issuing sub-frame seeks. This reduces decoder churn and makes mouse-wheel/trackpad scrubbing more stable.

The cinematic travel distance is intentionally compact:

- Desktop: 210vh total section height (about 110vh of actual sticky scroll travel)
- Tablet: 200vh
- Mobile: 190vh
- Reduced motion: 150vh with simplified behavior

The visual sequence remains:

hero → continuous office dolly → chair settles → final Life Context + “What’s going on?” workspace appears.

No text or UI is baked into the movie; React/GSAP renders the interface independently over the final chair composition.
