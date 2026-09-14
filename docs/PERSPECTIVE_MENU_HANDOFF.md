# Perspective menu and motion review — September 14, 2026

Continue from `integration/perspective-menu-motion-2026-09-14`. Parent is the
latest Holly/report branch at `b17dea75cda7ab04bc08dfb8d6480e6e00b5a16d`.
This change is a separate review branch, not a production promotion.

## Requested behavior

Patrick supplied the image named “WHat is looks like after you press explore
my sistuation(2).png”: a frosted window-side menu with navy text, pale blue
conversation bubbles and an angled smaller perspective card over the painting.
He wants a literal leftward shift into that card. The supplied image is a design
reference; its sample conversation is not inserted into real user sessions.

## Implementation

- `src/perspective-reference.css` is the final shared CSS import for both
  entry points. It adjusts the glass, typography, desktop proportions, wall-card
  angle, laptop navigation, and stacked tablet/phone layout.
- `perspectiveTransition.ts` progressively enhances existing tab navigation
  using native View Transitions and synchronous React updates. The arrival
  reflection card and breakdown perspective share the destination wall card's
  transition name. Reduced motion and unsupported browsers navigate immediately.
  Interrupted transitions still execute their state updates.
- Keep Talking has “Shift left” on model-generated replies. The selected reply
  moves into the wall card verbatim; “Original perspective” restores the original.
  This selection is temporary display state and does not admit it to memory.
  Failed/unavailable responses have no Shift left control.
- New turns keep the conversation scrolled to its latest message. The composer
  has an accessible label, and the conversation is an announcing log.
- The outer glass uses a pseudo-element, keeping the fixed wall card free of an
  ancestor backdrop-filter's containing block. The static room fallback remains
  visible underneath the held video.
- Existing office assets, scroll sequence, Holly, report import, model routing,
  API keys, and memory consent logic are inherited.

## Verification and remaining review

- Actual Vercel target build passed (`npx vite build --config vite.preview.config.ts`).
- The new transition helper, HomePage and next-step bar pass targeted lint.
- Whole changed-file lint reports existing violations (legacy effects, any
  types, privacy anchor, and status markup). No claim of a clean global lint.
- TypeScript reports the previously documented storage-check error and missing
  Playwright types in old QA files; no new changed-file type errors were reported.
- Cloud Browser rejected localhost with `ERR_BLOCKED_BY_CLIENT`. Visual matching,
  native animation, keyboard flow and mobile geometry remain browser-unverified.
- Vite dev's dependency scanner warns about existing `@/components` aliases;
  the actual production build resolves them. Use the built preview for review.

Manual acceptance: at 1672×941, enter a fictional reflection and press Explore
my situation; watch the card move left onto the painting and the glass dialogue
appear at the right. Send a fictional follow-up; Shift left must retain the
exact reply and Original perspective must restore it. Review Reflection → Keep
Talking in both directions; verify 1280px laptop navigation, 412px phone layout,
long responses, keyboard focus, reduced motion, and an unsupported-browser
fallback. Do not call it pixel-exact until this comparison has been performed.
