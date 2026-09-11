# GitHub update checkpoint

Source: https://github.com/robbp1989-debug/Shit-3.git
Imported commit: 9bf1d15f81bcd2a9c3ad6df4aa5bc79cd4716af5

The GitHub src and server folders are imported. The existing Sites hosting configuration and build pipeline are retained. Express endpoints are adapted to app/api route handlers. The previous practice app and on-device storage remain accessible at /previous.

Gemini personalization requires GEMINI_API_KEY. Without it, the imported server uses its supplied fallback analysis and game templates. No API key has been added.

## Saved state — September 9, 2026

Production build passed after the compatibility fixes. HTTP checks: homepage 200; health endpoint reports modelActive=false; reflection endpoint returns a structured fallback; an empty reflection returns 400; game-content returns the expected built-in fallback. Browser interaction testing has not been performed.

Type checking now passes: the fallback recommendation output uses ArcadeModeType[]. Unused imported src/main.tsx and legacy ReflectFlow.tsx remain excluded from the hosted project's type check; ReflectFlow contains older API mismatches and is not mounted by App.tsx.

Compatibility repairs include missing context actions for boundary saving, prediction updates, pattern creation, and crisis interruption; stable practice logging; persistence hydration guard; boundary persistence; and correct therapy summary emotion fields. Prior saved data is preserved under its original storage key and accessible through /previous.

The imported update is being prepared for private publication. Check Sites deployment status for the latest published version; do not assume publication succeeded from this checkpoint alone.

## User's latest product direction

Preserve the first two screens: What's going on? and the editable S-H-I-F-T breakdown. Replace the disconnected downstream experience with games populated from the user's confirmed situation. The requested core loop is UNDERSTAND → PRACTICE → REINFORCE.

Next work: inspect the game content handoff; generate a single structured practice pack from confirmed observation, interpretation, emotions, needs, perspective, and choice; select a small set of relevant game engines; reuse that pack during gameplay; record skill-specific attempts tied to the source reflection; carry results to refreshers, real-world prediction/outcome review, and therapist reports. Avoid inventing facts or deciding emotions/history for the user. Reward practice rather than distress or disclosure.

The original outline is saved as ORIGINAL_VISION.txt. Save and push checkpoints regularly.

## Light theme and navigation checkpoint

Applied a shared white / pale-blue theme, navy readable text, blue primary action, larger small labels, keyboard focus treatment, and reduced-motion support. Simplified primary navigation to Reflect → Practice → Therapy Prep; other existing tools remain under More. Practice now defaults to recommended games from the active reflection, with the full catalog available. The first form now explains that review comes before gameplay and has an accessible input label.

The approved light-theme revision was merged into GitHub main at 9a51f64, preserving both histories.

## Life-context modes — September 9, 2026

Life context is now an inline radio-card section on the home screen above the reflection input, with automatic saving and a plain-language explanation. The header shortcut remains on other screens only. User-facing wording is Life context, not Practice context. Legacy teal/green/emerald/cyan/lime utilities now resolve to blue tokens, and game accent materials are being aligned to blue. Grass/environment scenery is not a UI accent and is preserved. Context content and personal reflection behavior are unchanged.

The update adds nine device-local life-context choices (Everyday life is default), an accessible dialog with radio cards, live question preview, Apply/Cancel, and reset to everyday. Preference is included in existing storage/export/import/reset paths; old or invalid values default safely. No personal title, medical history, or other sensitive profile data is requested or sent to an AI service.

Authored fictional content replaces the office-heavy static banks for Fact/Story, Known/Possible/Assumed, Perspective Flip, Both Can Be True, Emotion Decoder, Responsibility Split, Choose Your Lane, Boundary Builder, Me First, Evidence Sort, Cue Response Match, Scenario Replay, and Rapid Blitz. Pause has a contextual example. Prediction Check substitutes clearly labeled fictional practice for unmodified demo records but preserves real or edited records. 3D engines use a context example when there is no personal reflection. The personal source takes precedence and is never rewritten by the preference. General sample decks and 3D sources are captured at game mount so changes do not alter an active round; return to the arcade and launch a game to apply a new context.

Validation: scripts/check-life-contexts.mjs covers all nine modes, thirteen banks, answer keys, unique IDs, neutral default, preference JSON round-trip, and nonmutation. Type checking passed before final copy adjustments. Browser interaction testing was not requested/performed. Remaining broader limitations: imported 3D game pedagogy and question-level therapist metrics still need a separate review; this feature does not claim comprehensive cultural or clinical validation. The previous app at /previous is preserved unchanged.

## Core learning-memory architecture — September 10, 2026

PR #8 was merged into master earlier today, establishing the main memory-learning architecture: authenticated account memory in Cloudflare D1, private source-document storage in R2, compact one-time learning extraction, server-side relevant-memory retrieval for new breakdowns and Keep Talking, explicit Remember controls, and the Keep Talking conversation branch. The landing-page cinematic work remains separate and unchanged.

PR #9 was subsequently merged into master at commit 9880c5fc8dfcba75983ef5db0e7fe6cc6fd574a2. GitHub Actions build validation passed before merge. This completed the user-facing account-learning control layer and real-world evidence loop: account memory listing/removal, private-source listing, delete-source-only vs delete-source-plus-learning, cleanup of stale device copies when account/source learning is removed, evidence-aware memory ranking, preservation of rejected hypotheses as active negative evidence, and a rebuilt Prediction Lab outcome flow.

Prediction Lab now asks what actually happened, whether the feared outcome happened, how the result compared with the prediction, and what the user learned. Account learning is OFF by default. Only explicit opt-in can persist an outcome across devices. A strategy is only promoted to HELPFUL_STRATEGY when the user explicitly reports that the response they tried was helpful. Advice is never upgraded to personal evidence merely because SHIFT previously suggested it.

Historical memory retrieval now carries epistemic metadata such as memory type, confidence, and evidence count. OUTCOME, HELPFUL_STRATEGY, BOUNDARY, and confirmed/repeated learning outrank a working hypothesis when they are relevant, but current observable facts remain primary. REJECTED_HYPOTHESIS stays retrievable so SHIFT can avoid repeatedly imposing an explanation the user has already rejected.

## Current in-progress transparency pass — SAFE SAVE POINT

Branch: codex/learning-memory-transparency

This branch is based on the latest master after PR #9. It contains additional work not yet merged into master:

1. ShiftBreakdown now supports memoryUsed and memorySource fields so each reflection can retain which compact historical learning was considered.
2. HomePage now captures the server-returned memoryUsed/memorySource values when creating a breakdown. This enables the UI to explain, later in the breakdown, what past learning influenced personalization instead of making memory use invisible.
3. No cinematic landing-page behavior was changed in this transparency pass.

Latest save-point commit created by this checkpoint update. All work above is committed to GitHub on codex/learning-memory-transparency; it is not dependent on unsaved local state. If work must resume after interruption, start from this branch and continue with the breakdown UI that displays the relevant historical learning as comparison evidence, then run build validation before merging.
