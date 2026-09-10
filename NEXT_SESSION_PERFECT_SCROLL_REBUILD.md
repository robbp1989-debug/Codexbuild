# SHIFT next-session recovery plan — perfect live-scroll baseline

## Golden visual reference
Use this exact standalone preview as the canonical visual/scroll baseline:

https://raw.githack.com/robbp1989-debug/Codexbuild/preview-live-scroll/preview/shift-live-scroll.html

Pinned branch/commit:
- branch: `backup/perfect-live-scroll-2026-09-10`
- commit: `eb4b835a319ac4e005a738c2e39a1527772142ec`

This preview is the approved scroll behavior. Do not improvise a new scrolling system until this behavior has first been reproduced in the real app.

## Golden workspace visual reference — `Office perfect.png`
The user also supplied a final approved screenshot named `Office perfect.png` in the project chat on 2026-09-10 and said this was the finished workspace they were happy with and wanted to build back to. Treat this screenshot as the canonical visual target for the stationary Keep Talking workspace after the cinematic arrival.

Desktop composition from the approved image:
- warm photorealistic office remains clearly visible and is part of the interface;
- chair remains visible in the lower-left/center-left foreground;
- the left wall/painting zone is occupied by a tall translucent glass `Perspective Shift` panel, positioned high enough to fully cover the painting;
- the Perspective Shift panel uses an uppercase light-blue eyebrow, a large dark-navy serif insight headline, supporting text, divider, and a small closing learning statement/icon near the bottom;
- the main workspace is a large translucent glass panel on the right/center-right, aligned with the window side of the room rather than centered across the entire viewport;
- top row inside the main glass shell: `SHIFT` wordmark, then pill navigation `Reflection`, `Keep Talking`, `Prediction Lab`, `Memory`, `Privacy`, with `Keep Talking` active in light blue, and a dark rounded `← Arrival` control on the far right;
- conversation title: `Stay with this before solving it` with a softer explanatory subtitle;
- user messages use pale light-blue cards;
- SHIFT messages use soft white/neutral cards;
- labels `You` and `SHIFT` are dark and readable;
- composer sits at the bottom with a white/light input field and a light-blue `Send` button;
- secondary actions appear beneath/near the composer as understated white pill buttons: `Practice this`, `Test a prediction`, and `Save for therapy`;
- glass surfaces are translucent enough to see the office, trees, furniture, and warm lighting through them, but opaque enough for comfortable text contrast;
- overall visual language is bright, premium, calm, architectural, and light-blue accented — never purple, never a dark admin dashboard, never a giant opaque white sheet.

Do not substitute the washed-out full-width white breakdown/workspace look for this approved composition. The room must remain visually present.

## Critical rule
DO NOT roll the whole repository back to this old preview commit. The current `master` contains later AI, learning-memory, semantic retrieval, D1/R2, safety, Keep Talking, Prediction Lab, and privacy work that must be preserved.

Instead:
1. Start from current `master` on a new integration branch.
2. Treat the standalone preview's scroll transport as the visual golden master.
3. Recreate only the cinematic landing/scroll behavior from the preview inside the current React app.
4. Do not modify the video asset unless required. The approved movie remains `public/landing-sequence/shift-office-entry.mp4`.
5. Preserve the final chair as the end of the scroll.
6. Preserve the final arrival UI: `Where would you like to begin?`, Life Context, and `What's going on?`.
7. After the user submits a reflection, transition to the stationary office-backed workspace instead of continuing the cinematic scroll.

## Approved later workspace design to reapply after scroll is stable
Keep Talking should use the approved immersive desktop composition:
- warm office remains clearly visible;
- main interactive conversation area on the right;
- dedicated glass `Perspective shift` panel on the left;
- left panel sits high enough to fully cover/replace the painting area;
- user messages use pale light blue;
- SHIFT responses use soft white/neutral;
- Send button uses the same light-blue accent family;
- top workspace navigation: Reflection / Keep Talking / Prediction Lab / Memory / Privacy / Arrival;
- responsive layouts stack vertically on smaller screens.

## Memory architecture to preserve
Do not regress or delete:
- one-time source/document extraction;
- compact reusable thematic learning instead of resending raw narratives;
- semantic retrieval of relevant compact memory;
- explicit `Remember this learning` consent;
- D1/R2 account persistence architecture;
- source upload/privacy controls;
- memory influence transparency;
- Keep Talking real conversation endpoint;
- Prediction Lab evidence;
- safety interruption logic.

The full source document should not be resent wholesale on every interaction. Long-term context should favor neutral reusable learning/tags/summaries, with raw source content remaining separately stored and protected.

## Breakdown experience
Preserve the compact SHIFT structure:
- Situation
- Human Response
- Interpretation
- Function
- Today

Keep hypotheses labeled as hypotheses, editable/confirmable by the user. Preserve actions such as Remember this learning, Keep Talking, Test a prediction, practice, and therapy prep. Do not make the 3D game the dominant primary reflection path.

## Implementation sequence
Phase 1 — restore exact scroll feel first.
- Use the golden preview's simple scroll-driven video seeking behavior as the reference: 210vh desktop, 190vh mobile, requestAnimationFrame interpolation, approximately `display += (target - display) * .22`, 24fps frame quantization, arrival reveal beginning around 78% and substantially complete around 94%.
- Verify forward and reverse scrubbing, stopping mid-scroll, chair landing, and arrival reveal before touching deeper workspace styling.

Phase 2 — reconnect current arrival screen.
- The scroll ends at the chair.
- Life Context / What's going on? render at the final chair position.
- No giant centered modal.

Phase 3 — preserve current AI/memory path.
- Submitting `What's going on?` still uses the current breakdown/memory architecture.
- Do not reintroduce raw-document memoryContext behavior.

Phase 4 — reapply approved office workspace.
- Stationary office-backed shell after arrival.
- Reproduce the `Office perfect.png` composition closely on desktop.
- Keep Talking left Perspective Shift panel fully covering painting zone.
- Main conversation panel remains right/center-right so the chair and office stay visible.
- Alternating user/SHIFT surface colors and light-blue Send button.

Phase 5 — validate before merge.
- Compare the cinematic scroll side-by-side with the golden preview.
- Compare the Keep Talking workspace against `Office perfect.png`.
- Run learning-memory checks and production build.
- Only merge when the scroll visually matches the golden reference, the workspace matches the approved image, and the memory/AI architecture is unchanged.

## Recovery priority
If any new change breaks the cinematic feel, revert only the landing/scroll implementation on the integration branch and return to the golden preview behavior. Do not roll back the memory/backend system to repair a visual problem.
