# SHIFT next-session recovery plan — perfect live-scroll baseline

## Golden visual reference
Use this exact standalone preview as the canonical visual/scroll baseline:

https://raw.githack.com/robbp1989-debug/Codexbuild/preview-live-scroll/preview/shift-live-scroll.html

Pinned branch/commit:
- branch: `backup/perfect-live-scroll-2026-09-10`
- commit: `eb4b835a319ac4e005a738c2e39a1527772142ec`

This preview is the approved scroll behavior. Do not improvise a new scrolling system until this behavior has first been reproduced in the real app.

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
- Keep Talking left Perspective Shift panel fully covering painting zone.
- Alternating user/SHIFT surface colors and light-blue Send button.

Phase 5 — validate before merge.
- Compare the cinematic scroll side-by-side with the golden preview.
- Run learning-memory checks and production build.
- Only merge when the scroll visually matches the golden reference and the memory/AI architecture is unchanged.

## Recovery priority
If any new change breaks the cinematic feel, revert only the landing/scroll implementation on the integration branch and return to the golden preview behavior. Do not roll back the memory/backend system to repair a visual problem.
