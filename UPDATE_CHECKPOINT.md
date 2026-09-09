# GitHub update checkpoint

Source: https://github.com/robbp1989-debug/Shit-3.git
Imported commit: 9bf1d15f81bcd2a9c3ad6df4aa5bc79cd4716af5

The GitHub src and server folders are imported. The existing Sites hosting configuration and build pipeline are retained. Express endpoints are adapted to app/api route handlers. The previous practice app and on-device storage remain accessible at /previous.

Gemini personalization requires GEMINI_API_KEY. Without it, the imported server uses its supplied fallback analysis and game templates. No API key has been added.

## Saved state — September 9, 2026

Production build passed after the compatibility fixes. HTTP checks: homepage 200; health endpoint reports modelActive=false; reflection endpoint returns a structured fallback; an empty reflection returns 400; game-content returns the expected built-in fallback. Browser interaction testing has not been performed.

Type checking currently reports one remaining recommendation type mismatch in src/components/home/HomePage.tsx:119 (string[] versus ArcadeModeType[]). Unused imported src/main.tsx and legacy ReflectFlow.tsx are excluded from the hosted project's type check; ReflectFlow contains older API mismatches and is not mounted by App.tsx.

Compatibility repairs include missing context actions for boundary saving, prediction updates, pattern creation, and crisis interruption; stable practice logging; persistence hydration guard; boundary persistence; and correct therapy summary emotion fields. Prior saved data is preserved under its original storage key and accessible through /previous.

The imported update has NOT yet been published to Sites. The hosted URL still shows the preceding light version. Finish the remaining type check, verify final source, and publish when resuming.

## User's latest product direction

Preserve the first two screens: What's going on? and the editable S-H-I-F-T breakdown. Replace the disconnected downstream experience with games populated from the user's confirmed situation. The requested core loop is UNDERSTAND → PRACTICE → REINFORCE.

Next work: inspect the game content handoff; generate a single structured practice pack from confirmed observation, interpretation, emotions, needs, perspective, and choice; select a small set of relevant game engines; reuse that pack during gameplay; record skill-specific attempts tied to the source reflection; carry results to refreshers, real-world prediction/outcome review, and therapist reports. Avoid inventing facts or deciding emotions/history for the user. Reward practice rather than distress or disclosure.

The original outline is saved as ORIGINAL_VISION.txt. This redesign has been requested but is not yet implemented. Save and push checkpoints regularly because the user is nearing their usage limit.
