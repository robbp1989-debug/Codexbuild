# SHIFT cinematic video asset

The landing renderer is video-first and automatically falls back to the existing `frame-0001.webp` through `frame-0008.webp` sequence when neither video source is available.

## Production filenames

Place one or both of these files in this directory:

- `shift-office-entry.webm`
- `shift-office-entry.mp4`

The browser will prefer WebM and fall back to MP4/H.264.

## Target render

- Duration: approximately 5–6 seconds
- Frame rate: 30 fps minimum; 60 fps is acceptable when file size remains reasonable
- Motion: continuous forward camera travel through the existing office environment
- Final composition: settle on the existing chair framing used by the current last frame
- No text or interface baked into the video; React/GSAP renders the hero and workspace independently
- No audio required

## Encoding guidance

For smooth scroll seeking, encode with frequent keyframes and move MP4 metadata to the beginning of the file (`faststart`). A practical H.264 target is 1080p, 30 fps, CRF 20–24, `yuv420p`, with keyframes approximately every 6–15 frames. Test file size and seeking behavior on desktop and mobile before increasing resolution or bitrate.

The React component maps scroll progress directly to `video.currentTime`, so the asset must remain visually coherent when paused on arbitrary frames and when scrubbed backward.
