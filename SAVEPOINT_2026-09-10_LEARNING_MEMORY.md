# SHIFT learning-memory save point — 2026-09-10

This checkpoint records the completed learning-memory architecture before additional runtime-hardening work.

Known good master commit: `1fb84627f652ba3e499f46a77180e8edfdad0cc4`

Included and already merged:
- compact reusable learning memory instead of replaying raw narratives
- authenticated D1-backed account learning memory with device fallback
- private R2 source import for text/Markdown/JSON/CSV with one-time learning extraction
- Keep Talking conversation branch after a SHIFT breakdown
- explicit Remember-this consent before AI-suggested learning becomes durable
- account memory and private-source deletion controls
- rejected hypotheses preserved as negative evidence rather than silently retried
- Prediction Lab real-world outcome capture and opt-in account evidence
- strategies promoted to HELPFUL_STRATEGY only when the user reports that the strategy helped
- evidence-aware memory ranking
- per-reflection transparency showing which compact past learning was considered
- cinematic landing preserved

Validation state at save point:
- PR #8 build passed and merged
- PR #9 build passed and merged
- PR #10 build passed and merged

Next work after this save point: runtime readiness diagnostics, automated learning-memory contract checks, and end-to-end verification of authenticated D1/R2 persistence on the deployed Sites environment.
