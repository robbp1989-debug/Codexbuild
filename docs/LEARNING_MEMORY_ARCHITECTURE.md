# SHIFT Learning Memory Architecture

## Product objective

SHIFT should become more useful because the user has lived with it. It should not merely replay old stories. It should retrieve compact, user-confirmed learning and compare that history with the present situation.

Core loop:

`event -> SHIFT breakdown -> user confirmation -> practice/choice -> real-world outcome -> compact learning -> later retrieval`

## Privacy and epistemic rules

1. Raw uploaded documents and long reflection narratives are source material, not reusable prompt memory.
2. A source document is processed once. The reusable product stores privacy-minimized themes and learning records.
3. AI inference never silently becomes a user fact.
4. Historical learning is comparison evidence, not proof that the current event has the same meaning.
5. Advice does not become `HELPFUL_STRATEGY` merely because SHIFT suggested it. It becomes stronger personal evidence after the user tries it and records an outcome.
6. Rejected hypotheses are useful memory. They prevent SHIFT from repeatedly offering an explanation the user already said did not fit.
7. Users must be able to archive/delete memories and choose session-only use.

## Memory categories

High-value reusable categories:

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

Raw `CONFIRMED_FACT` and `USER_INTERPRETATION` journal rows are intentionally excluded from normal long-term context retrieval.

## Current implementation

The current browser prototype still keeps user data device-local in `AppContext`. This branch changes the reasoning pipeline so:

1. New reflections are session-only by default.
2. The breakdown request sends the device's memory collection to the server.
3. `server/memoryContext.ts` filters out raw narratives and ranks only compact learning records.
4. The selected 3-6 memories become `memoryContext` for the model.
5. When a user explicitly saves a reflection to their profile, `LearningMemorySync` runs one extraction pass and replaces per-reflection raw memory rows with privacy-minimized learning records.
6. `Keep Talking` mode retains the current breakdown, retrieves relevant prior learning, and allows the user to continue reflecting instead of automatically entering the arcade.
7. A new learning suggested during conversation is never saved automatically. The user must press **Remember this**.

## Production persistence target

Use Cloudflare D1 as the authoritative structured store and R2 for encrypted source documents.

Suggested bindings:

- D1: `SHIFT_DB`
- R2: `SHIFT_SOURCE_DOCS`
- server secret: `SHIFT_DOCUMENT_ENCRYPTION_KEY`

The initial D1 schema lives at `migrations/0001_learning_memory.sql`.

### R2 document lifecycle

1. Authenticated user uploads a document.
2. Server validates type/size and encrypts bytes before durable storage.
3. Ciphertext is written to R2 under a non-identifying object key.
4. D1 stores object metadata and extraction status only.
5. The extraction worker decrypts the source, extracts compact learning candidates, and writes approved/working candidates to D1.
6. Normal SHIFT requests query D1 learning memory only; they do not re-fetch or re-send the source document.
7. User can delete the source object independently of keeping approved learning memories, subject to explicit UI wording.

Do not claim end-to-end encryption unless the implemented key-management design actually provides it. Application-layer encryption at rest should use a vetted authenticated-encryption primitive and a server-side key that is never exposed to the browser bundle.

## Retrieval design

D1 is the source of truth. A semantic index (Cloudflare Vectorize or another vector store) may later accelerate retrieval, but vector results should resolve back to authoritative D1 records before entering a prompt.

Ranking should combine:

- semantic/lexical similarity to the current event
- memory type value (`BOUNDARY`, `OUTCOME`, `HELPFUL_STRATEGY` rank highly)
- recency
- confirmation/evidence strength
- rejected-memory suppression

Prompt context should normally contain no more than 3-6 relevant memories.

## Account migration

The existing device-local data is useful for prototyping, but production accounts should move memory and outcomes to authenticated server storage. After authentication exists:

- browser sends only the new user message/current action
- server resolves user identity
- server retrieves memory from D1
- server constructs `memoryContext`
- model receives only current input plus the few relevant compact memories

At that point `memoryItems` should be removed from public request bodies.

## Next infrastructure tasks

1. Provision `SHIFT_DB` D1 database.
2. Apply `migrations/0001_learning_memory.sql`.
3. Provision private R2 bucket `SHIFT_SOURCE_DOCS`.
4. Add authentication and stable user IDs.
5. Implement D1 repository adapter for learning memories/conversation turns.
6. Implement encrypted upload + one-time document extraction endpoint.
7. Optionally add semantic embeddings/Vectorize after the D1 path is correct.
8. Add migration from device-local memory into authenticated account storage with explicit user approval.
