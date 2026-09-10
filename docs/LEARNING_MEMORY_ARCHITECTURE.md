# SHIFT Learning Memory Architecture

## Product objective

SHIFT should become more useful because the user has lived with it. It should not merely replay old stories. It should retrieve compact learning and compare that history with the present situation.

Core loop:

`event -> SHIFT breakdown -> user confirmation -> practice/choice -> real-world outcome -> compact learning -> later retrieval`

## Privacy and epistemic rules

1. Raw uploaded documents and long reflection narratives are source material, not reusable prompt memory.
2. A source document is processed once. Future reflection prompts use privacy-minimized learning records rather than the document itself.
3. AI inference never silently becomes a user fact.
4. Historical learning is comparison evidence, not proof that the current event has the same meaning.
5. Advice does not become `HELPFUL_STRATEGY` merely because SHIFT suggested it. It becomes stronger personal evidence after the user tries it and records an outcome.
6. Rejected hypotheses are useful memory. They prevent SHIFT from repeatedly offering an explanation the user already said did not fit.
7. Nothing suggested in Keep Talking is saved until the user explicitly chooses **Remember this**.
8. Raw `CONFIRMED_FACT` and `USER_INTERPRETATION` journal rows are excluded from normal long-term retrieval.

## Reusable memory categories

- `BOUNDARY`
- `USER_PREFERENCE`
- `CONFIRMED_PATTERN`
- `WORKING_HYPOTHESIS`
- `REJECTED_HYPOTHESIS`
- `UPDATED_PERSPECTIVE`
- `CURRENT_EXPERIMENT`
- `PREDICTION`
- `OUTCOME`
- `HELPFUL_STRATEGY`

## Current implementation

The application now has two layers during migration from the earlier device-only prototype:

1. **Device layer** — existing localStorage remains a fallback and keeps the current experience usable without account storage.
2. **Account layer** — when ChatGPT account identity and the Sites bindings are available, D1 becomes the authoritative reusable learning store.

The reasoning pipeline now works as follows:

1. New reflections start `session_only` instead of silently opting into memory.
2. The server resolves the authenticated ChatGPT user when available.
3. It loads account-backed learning records from D1 and may temporarily merge device-local compact memories during migration.
4. `server/memoryContext.ts` excludes raw narratives and unconfirmed interpretations, ranks reusable learning by relevance/type/recency, and sends only a small set to the model.
5. The model is explicitly told that past learning is historical evidence, not a verdict about the current event.
6. When the user explicitly saves a reflection as **Remember**, one extraction pass creates privacy-minimized learning records and persists them to D1.
7. `Keep Talking` retains the current breakdown and relevant earlier learning instead of forcing the user into the arcade.
8. New learning proposed during Keep Talking is saved only after the user clicks **Remember this**; that explicit action also persists the learning to D1 when signed in.

## OpenAI Sites bindings

`.openai/hosting.json` declares the standard Sites bindings:

- D1 binding: `DB`
- R2 binding: `FILES`

The Sites Vite plugin packages `.openai/hosting.json` and the `drizzle/**` migration directory with the deployment artifact. The production D1 schema is in `drizzle/0000_shift_learning_memory.sql`.

## D1 responsibilities

D1 stores compact structured state:

- account/user row keyed by the authenticated ChatGPT user ID
- reusable learning memories
- epistemic status and confidence
- source IDs/types
- evidence count/helpfulness fields
- source-document metadata and extraction state
- prediction/outcome evidence

D1 should never become a dumping ground for full uploaded journals simply because structured storage is available.

## R2 source-document lifecycle

The first source import path accepts TXT, Markdown, JSON, and CSV up to 4 MB.

1. Authenticated user uploads a source.
2. Server validates type and size.
3. Full bytes are stored in the private `FILES` R2 binding using a random, non-identifying object key.
4. D1 stores metadata/extraction state; the original filename is not used as the R2 object key.
5. The source text is sent through a one-time, prompt-injection-resistant extraction step.
6. The extractor removes identifying details where they are not necessary and emits compact learning candidates/tags.
7. Compact memories are persisted to D1 with `source_kind = document`.
8. Normal SHIFT reflection/Keep Talking requests retrieve D1 learning memory only; they do not retrieve or re-send the source document.

Cloudflare R2 encrypts stored objects at rest with platform-managed encryption. This is **encryption at rest**, not end-to-end encryption. SHIFT should not claim end-to-end encryption. A later customer-managed/SSE-C layer can be evaluated if the product's threat model requires it.

PDF and DOCX are deliberately rejected by the first import endpoint rather than being stored without a reliable parser/extraction path.

## Retrieval design

D1 is the source of truth. A semantic index such as Vectorize may later accelerate retrieval, but vector results should resolve back to authoritative D1 records before entering a prompt.

Current ranking combines:

- lexical similarity to the current event
- memory type value (`BOUNDARY`, `OUTCOME`, `HELPFUL_STRATEGY` rank highly)
- recency
- user confirmation/evidence status
- rejected-memory handling

Prompt context should normally contain no more than 3–6 relevant memories.

## Account identity

The account layer uses the OpenAI Sites/ChatGPT identity headers (`oai-authenticated-user-id` and related headers). Local development can use the Sites simulated sign-in flow. The server never accepts a user ID supplied by the browser as authoritative identity.

## Remaining production hardening

The core path is now implemented. Remaining work before calling the persistence layer production-complete:

1. Deploy this branch so Sites provisions/applies `DB`, `FILES`, and the packaged migration.
2. Verify migration execution and authenticated read/write behavior on the hosted environment.
3. Add source-document delete/retry controls and account-backed memory management UI.
4. Add PDF/DOCX ingestion only after a reliable Worker-compatible parser path is selected and tested.
5. Persist Prediction Lab outcomes into `learning_evidence` and promote a strategy to `HELPFUL_STRATEGY` only when lived outcomes support that promotion.
6. Remove device `memoryItems` from API request bodies after account migration is stable; server-side D1 retrieval is already preferred.
7. Optionally add Vectorize once correctness and user-control semantics are proven with D1 alone.
