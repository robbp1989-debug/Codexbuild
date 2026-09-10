# SHIFT learning-memory save point — 2026-09-10

This checkpoint records the current completed learning-memory architecture, runtime-hardening work, and approved office-workspace transition.

Known good master commit after office-workspace transition: `338f8660deeca1db899f3bdfa6095097757e2ee2`

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
- conservative consolidation of exact repeated direct remembered learning and tested helpful strategies so independent confirmations can strengthen evidence counts without collapsing distinct real-world outcomes
- relevance guard requiring an actual shared signal before past learning can enter a new reflection; recency, confidence, memory type, and evidence can rank relevant memories but cannot create relevance by themselves
- optional semantic + lexical retrieval over compact learning using account-scoped embeddings, with lexical fallback and a conservative semantic threshold
- raw imported source documents are not placed in the semantic memory index
- per-reflection transparency showing which compact past learning was considered
- reversible D1/R2 storage self-test using synthetic diagnostic records only
- `/storage-check` readiness page for live authenticated persistence verification
- CI learning-memory regression contracts plus full production build validation
- Sites sign-in compatibility using authenticated email as the required identity signal, with an optional platform user id and a SHA-256 pseudonymous fallback account key
- plain-language `/privacy` disclosure covering device memory, account learning, imported sources, AI context use, and deletion controls
- source-import privacy disclosure before private files are attached
- approved cinematic scroll-scrub landing and chair destination preserved
- cinematic chair/intake screen is the final scroll destination; deeper tools now render in a separate stationary office-backed workspace
- workspace keeps the warm office visual language with luminous glass surfaces and light-blue navigation accents
- workspace primary navigation includes Reflection, Keep Talking, Prediction Lab, Memory, and Privacy, while existing secondary tools remain available
- returning from a deep tool can return directly to the final chair arrival without forcing the intro to replay; replay remains an intentional separate action

Validation state:
- PR #8 build passed and merged
- PR #9 build passed and merged
- PR #10 build passed and merged
- PR #11 memory-contract checks and build passed and merged at `1f1698ea1c087d352b7015e2dc02b86a92fb133d`
- PR #12 memory-contract checks and build passed and merged at `98dd10ed34010407eaf2bded36d18c957398560e`
- PR #13 memory-contract checks and build passed and merged at `dbf47d3b3f6773fe95b8c87826b5eab767c8faf9`
- PR #14 memory-contract checks and build passed and merged at `2a65c75f0b476ea6f77a73072905537dac802d14`
- PR #15 memory-contract checks and build passed and merged at `b1857f2e8d507b8d8d3732f7ba7f3a0fb668e4db`
- PR #16 semantic-memory contracts and full build passed and merged at `eb771143bbe0af9375039b71364c4b400ca0352d`
- PR #17 learning-memory contracts and full production build passed and merged at `338f8660deeca1db899f3bdfa6095097757e2ee2`

Recovery rule: if later work becomes unstable, return to this master history and this checkpoint before attempting further changes. Do not regress the approved cinematic landing, chair destination, real AI endpoints, or learning-memory safeguards as part of visual refinements.

Remaining production-readiness step: deploy/save the current Sites version, open `/storage-check` while signed in with ChatGPT, run the reversible storage test, then perform a real end-to-end opt-in memory test (remember → reload → retrieve in a related reflection → delete → verify it no longer influences future reflections). Do not describe D1/R2 account persistence as live-verified until those hosted checks pass.
