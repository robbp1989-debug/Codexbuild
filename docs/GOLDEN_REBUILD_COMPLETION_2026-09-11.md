# SHIFT Golden Rebuild — Completion Record

Date: 2026-09-11

## Status

Implementation is complete on the isolated integration branch and is ready for final human visual approval before merge.

- Integration branch: `integration/golden-scroll-rebuild-2026-09-11`
- Base application: `master` at `b966b0f80056cce54b5651ac6e57d34e0c0fc620`
- Golden visual commit: `eb4b835a319ac4e005a738c2e39a1527772142ec`
- Golden recovery branch: `backup/perfect-live-scroll-2026-09-10`
- Golden preview: `preview/shift-live-scroll.html`
- Pull request: #22
- Merge state: intentionally not merged; keep the PR in draft until final visual approval.

The golden commit was used as a visual/behavioral reference only. The current application was not rolled back.

## Completed handoff checklist

### 1. Golden cinematic transport restored

The real application now follows the approved standalone transport rather than the later GSAP travel/zoom implementation:

- desktop cinematic root: `210vh`
- mobile cinematic root: `190vh`
- sticky stage: `100svh`
- production movie: `/landing-sequence/shift-office-entry.mp4`
- direct `requestAnimationFrame` transport
- normalized target scroll progress
- smoothing: `display += (target - display) * 0.22`
- 24 fps frame quantization
- early hero fade
- arrival begins near 78% and is substantially complete near 94%
- no extra push-in / artificial depth travel
- forward, stop, and reverse behavior remain tied to scroll position

Automated parity regression samples the golden and rebuilt implementations at progress 0, .08, .16, .25, .50, .78, .86, .94, and 1.00. It verifies video-time parity within 0.08 seconds and hero/arrival/scroll-cue opacity parity within 0.035.

### 2. Final chair arrival restored

The arrival remains part of the cinematic office instead of switching to a generic page.

Restored structure:

- SHIFT brand at left
- centered `Where would you like to begin?`
- Life context / Start a reflection / Explore Shift navigation at right
- chair and office remain visible
- Life Context card remains right-weighted
- `S • H • I • F • T Framework / What’s going on?` card remains right-weighted
- golden six arrival contexts are visible: Everyday life, Work, Relationships, Family, Recovery, Social situations
- richer internal context/training logic remains available behind the presentation layer

The hero and arrival CSS is sourced from the pinned golden implementation, with only narrow compatibility overrides for the current React/Tailwind application.

### 3. Reflection transition uses a stationary office workspace

Submitting `Explore my situation` ends cinematic scrubbing and enters the current application workspace. Deep tools do not continue the scroll-scrub behavior.

The office remains the environmental shell through the newer product surfaces.

### 4. Current SHIFT breakdown preserved

The current breakdown implementation remains intact, including:

- Situation / Human Response / Interpretation / Function / Today structure
- editable observation and interpretation
- emotion and need selection
- protective-rule hypothesis review
- hypothesis accept/reject controls
- updated perspective
- present-day choice
- real-world experiment
- explicit save preference / memory consent
- Keep Talking and Prediction Lab next actions

The older game-first processing path was not restored as the dominant route.

### 5. Keep Talking restored to the approved immersive office treatment

Desktop conversation now uses the approved two-zone composition:

- Perspective Shift occupies the painting/console region on the left
- the left panel is large/high enough to replace the painting visually rather than sit as a small floating card over it
- live conversation occupies the right side
- user turns use pale blue surfaces
- SHIFT turns use soft white/cool neutral surfaces
- Send uses the light-blue accent family
- bottom actions remain available

The real `/api/shift/conversation` endpoint is preserved. Visual QA sends multiple user turns and requires completed assistant turns to advance rather than repeatedly showing the same loading/canned response.

A server-side anti-repeat fallback was also added so degraded/offline conversation behavior can vary with the current turn rather than echoing one identical fallback response indefinitely.

### 6. Workspace navigation preserved

The office-backed workspace keeps the current high-value navigation:

- Reflection
- Keep Talking
- Prediction Lab
- Memory
- Privacy
- Arrival

Returning to Arrival sends the user directly to the chair/intake portion of the cinematic sequence rather than replaying the entire intro.

Workspace route changes reset scroll position so deep tools do not inherit a previous tool's vertical scroll offset.

### 7. Prediction Lab preserved and visually reconciled

Prediction testing remains current application logic:

- predicted outcome
- confidence
- action/experiment
- observed outcome
- learning
- optional explicit account-memory learning

Legacy amber emphasis was visually reconciled into the approved light-blue office palette without removing Prediction Lab semantics or behavior.

### 8. Learning memory and source architecture preserved

The rebuild does not replace or bypass the newer memory architecture. Preserved systems include:

- compact reusable learning records
- account memory controls
- semantic + lexical retrieval
- D1 persistence paths
- source/document ingestion and extraction
- R2 source-management paths
- memory influence transparency
- explicit remember action
- session-only use when durable memory is not chosen

Raw imported documents are not intentionally reinserted wholesale into every normal reflection/conversation request.

### 9. Privacy and safety work preserved

The current Privacy surface remains reachable and the existing safety interruption path remains in the current application/API flow. The rebuild did not replace these systems with the older standalone preview.

### 10. Golden visual QA added

`.github/workflows/visual-qa.yml` now exercises the real H.264 movie in installed Google Chrome, because Chromium-only codec behavior can otherwise silently fall back to static frames and produce a false visual comparison.

The workflow:

1. pins the golden HTML at commit `eb4b835a319ac4e005a738c2e39a1527772142ec`
2. serves the golden fixture and current app against the same local production movie
3. verifies numerical scroll transport parity
4. captures golden hero and arrival screenshots
5. captures rebuilt hero and arrival screenshots
6. submits a reflection
7. captures the breakdown
8. opens Keep Talking and exercises multiple conversation turns
9. captures Prediction Lab
10. captures Memory
11. captures Privacy
12. returns to Arrival and captures the chair/intake state

The normal validation workflow separately runs the learning-memory architecture contract check and production build.

## Final validation requirement

Before merging #22, require both checks at the current head to be green:

- `Validate SHIFT`
- `Visual QA`

Also perform one final human check of:

- mouse-wheel scroll feel forward and backward
- hero framing
- chair destination
- arrival card placement
- Perspective Shift coverage of the painting zone
- alternating conversation colors
- Return to Arrival behavior

## Recovery rule

If a future landing change breaks the cinematic behavior, do not roll the application back to the golden commit. Revert only the landing/scroll implementation and reconcile it again against:

- `backup/perfect-live-scroll-2026-09-10`
- `eb4b835a319ac4e005a738c2e39a1527772142ec`
- `preview/shift-live-scroll.html`

The newer AI, memory, privacy, persistence, document, conversation, and prediction work should remain intact.
