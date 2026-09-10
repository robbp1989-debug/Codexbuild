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

The original outline is saved as ORIGINAL_VISION.txt. This redesign has been requested but is not yet implemented. Save and push checkpoints regularly because the user is nearing their usage limit.

## Light theme and navigation checkpoint

Applied a shared white / pale-blue theme, navy readable text, blue primary action, larger small labels, keyboard focus treatment, and reduced-motion support. Simplified primary navigation to Reflect → Practice → Therapy Prep; other existing tools remain under More. Practice now defaults to recommended games from the active reflection, with the full catalog available. The first form now explains that review comes before gameplay and has an accessible input label.

GitHub backup branch: codex/shift-sites-sync (main was not changed). The earlier c8beb02 checkpoint was successfully pushed; push the final light-theme commit as well. No new API key or fabricated live AI integration. No browser interaction QA performed. Deeper personalized practice-pack generation and reflection-linked performance reporting remain future work, not completed features of this visual update.

## Life-context modes — September 9, 2026

The approved light-theme revision was merged into GitHub main at 9a51f64, preserving both histories. This update adds nine device-local life-context choices (Everyday life is default), an accessible dialog with radio cards, live question preview, Apply/Cancel, and reset to everyday. Preference is included in existing storage/export/import/reset paths; old or invalid values default safely. No personal title, medical history, or other sensitive profile data is requested or sent to an AI service.

Authored fictional content replaces the office-heavy static banks for Fact/Story, Known/Possible/Assumed, Perspective Flip, Both Can Be True, Emotion Decoder, Responsibility Split, Choose Your Lane, Boundary Builder, Me First, Evidence Sort, Cue Response Match, Scenario Replay, and Rapid Blitz. Pause has a contextual example. Prediction Check substitutes clearly labeled fictional practice for unmodified demo records but preserves real or edited records. 3D engines use a context example when there is no personal reflection. The personal source takes precedence and is never rewritten by the preference. General sample decks and 3D sources are captured at game mount so changes do not alter an active round; return to the arcade and launch a game to apply a new context.

Validation: scripts/check-life-contexts.mjs covers all nine modes, thirteen banks, answer keys, unique IDs, neutral default, preference JSON round-trip, and nonmutation. Type checking passed before final copy adjustments. Browser interaction testing was not requested/performed. Remaining broader limitations: imported 3D game pedagogy and question-level therapist metrics still need a separate review; this feature does not claim comprehensive cultural or clinical validation. The previous app at /previous is preserved unchanged.
