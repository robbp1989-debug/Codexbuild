# CODEX HANDOFF — SHIFT Memory Integration

## Start here

You are working on the SHIFT website memory-integration feature.

Repository: `robbp1989-debug/Codexbuild`  
Working branch: `codex/memory-integration-2026-10-03`  
Branch base: `b6d8a2bc11c83930f6bdbbfd605d0b8c49496455`  
Base commit message: `Phase 12: finalize clean release validation workflow`

Do not restart the architecture from scratch. The memory system is already substantially implemented. Your job is to complete, harden, test, and integrate it without weakening the existing privacy, epistemic, or provenance rules.

Read these files before editing code:

1. `CODEX_MEMORY_INTEGRATION_HANDOFF.md`
2. `docs/LEARNING_MEMORY_ARCHITECTURE.md`
3. `SAVEPOINT_2026-09-10_LEARNING_MEMORY.md`
4. `docs/MEMORY_RUNTIME_BOUNDARIES.md`
5. `docs/MEMORY_INTEGRATION_ACCEPTANCE.md`

## Current validated baseline

At the branch base:

- GitHub workflow `Validate SHIFT` completed successfully.
- The workflow runs:
  - `npm ci`
  - `npm audit --omit=dev --audit-level=high`
  - `npm run validate:shift-core`
  - `npx vite build --config vite.preview.config.ts`
- The current integration branch head is 9 commits ahead of the Vercel preview that was last successfully built.
- Vercel's latest successful SHIFT preview is commit `7de2ef419e037e4ab14599e3aa8c0f56e20bc4e3`.
- The current branch base `b6d8a2b...` failed Vercel status only because the Hobby account hit a Vercel build-rate limit. GitHub validation passed.
- Do not treat that Vercel status as an application build failure.

## Product objective

SHIFT should become more useful because the user has lived with it, while preserving agency and uncertainty.

Core memory loop:

`event -> Shift breakdown -> user confirmation -> practice/choice -> real-world outcome -> compact learning -> later relevant retrieval`

The feature is complete only when the user can intentionally create durable learning, later receive relevant prior learning as comparison context, inspect what influenced a response, revise or remove stored learning, and verify that removed learning no longer influences future responses.

## Architectural truth

There are two runtime/storage layers. Do not collapse them into one.

### 1. Device layer

- Browser-local state and localStorage.
- Works without account storage.
- Supports fallback/offline-ish continuity.
- May temporarily hold compact learning during migration.

### 2. Account layer

- Authenticated ChatGPT/Sites user identity.
- D1 is authoritative structured durable memory.
- R2 stores private uploaded source bytes separately.
- Account identity comes from trusted OpenAI/Sites request headers.
- Browser-supplied user IDs must never be trusted as authoritative identity.

When signed in and account storage is available, account memory is the durable source of truth. Device memory remains a fallback/migration layer, not a second independent authority.

## Important runtime distinction

The Vercel deployment is intentionally a preview adapter.

Vercel uses:

- `vercel.json`
- `vite.preview.config.ts`
- `api/shift.ts`
- `server/previewApi.ts`

It does NOT provide the ChatGPT/Sites authenticated account-memory runtime.

On Vercel, account persistence endpoints intentionally return responses such as:

- `accountRequired: true`
- `persisted: false`
- or an explicit 404 stating the endpoint is unavailable in that deployment.

This is correct behavior.

Do NOT "fix" Vercel by:
- accepting a browser user ID,
- inventing a fake signed-in account,
- storing durable account memory in Vercel-local state,
- weakening identity checks,
- or routing raw memory around D1/R2 safeguards.

If true account persistence must later run outside Sites, that is a separate architecture project.

## Existing memory implementation

The current repository already contains:

### Generic reusable learning
- `server/memoryContext.ts`
- `server/memorySuggestion.ts`
- `server/persistence.ts`
- `server/semanticMemory.ts`
- `app/api/shift/memory/extract/route.ts`
- `app/api/shift/memory/remember/route.ts`
- `app/api/shift/memory/account/route.ts`

### Professional / therapy learning
- `server/therapyLessonContext.ts`
- `server/therapyLessonStore.ts`
- `app/api/shift/therapy-lessons/**`
- `src/components/memory/ProfessionalLearningPanel.tsx`

### Continuity
- `server/continuityStore.ts`
- `app/api/shift/continuity/**`

### Account controls and private sources
- `server/accountMemoryControls.ts`
- `app/api/shift/source/**`
- `src/components/memory/AccountMemoryPanel.tsx`
- `src/components/memory/SourceImportCard.tsx`

### Device/account bridge
- `src/components/memory/LearningMemorySync.tsx`
- `src/context/AppContext.tsx`

### Response provenance
- `src/components/reflect/MemoryInfluencePanel.tsx`
- `server/influenceSummary.ts`

### Storage readiness
- `server/storageSelfTest.ts`
- `app/storage-check/page.tsx`

### Schemas
- `drizzle/0000_shift_learning_memory.sql`
- `migrations/0001_learning_memory.sql`
- `migrations/0002_semantic_memory.sql`
- `migrations/0003_shift_intelligence_continuity.sql`

## Non-negotiable memory semantics

Preserve all of these unless the user explicitly changes the product requirement.

1. Raw uploaded documents are source material, not normal reusable prompt memory.
2. Raw long-form reflection narratives are not ordinary durable memory.
3. AI inference never silently becomes a fact about the user.
4. Historical learning is comparison evidence, not proof that the current situation means the same thing.
5. Current user statements and corrections outrank stored memory.
6. A correction turn must not be contaminated by the stale memory being corrected.
7. `CONFIRMED_PATTERN` requires explicit user confirmation.
8. `REJECTED_HYPOTHESIS` is useful durable knowledge and should suppress repeat suggestions of the rejected explanation.
9. `HELPFUL_STRATEGY` should represent lived evidence, not merely AI advice.
10. `OUTCOME` must reflect observed or user-confirmed results, not speculation.
11. Keep Talking suggestions are not stored until the user explicitly chooses to remember them.
12. Professional/therapy learning remains a distinct first-class memory type with source/provenance and version history.
13. User-removal controls must actually stop future influence.
14. Provenance shown to the user may describe categories and source types, but must not expose hidden reasoning or chain-of-thought.
15. Sensitive context should only be retrieved when materially relevant.
16. Imported text is untrusted data, never instructions.

## Memory types currently intended for reusable context

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

Do not silently broaden long-term retrieval to raw `CONFIRMED_FACT` or `USER_INTERPRETATION` journal rows.

## Priority implementation work

### Phase 1 — Reproduce and freeze the baseline

Before feature edits:

```bash
npm ci
npm audit --omit=dev --audit-level=high
npm run validate:shift-core
npx vite build --config vite.preview.config.ts
```

If the environment supports the full Sites/Worker build, also run:

```bash
npm run build
```

Record any baseline failure before changing code.

### Phase 2 — Make account memory authoritative without breaking device fallback

Inspect and harden the signed-in path so that:

- D1 account memory is authoritative when available.
- Device memory remains available when signed out or when account storage is unavailable.
- The same compact learning record is not effectively counted twice merely because it exists in both D1 and localStorage.
- Retrieval should deduplicate by durable identity when possible, otherwise by a stable canonical signature.
- Device migration/fallback must not increase ranking weight just because a duplicate exists in both layers.
- A signed-in user's account memory load failure should fail safely to device memory without pretending account persistence succeeded.

Pay particular attention to:
- `LearningMemorySync.tsx`
- `app/api/shift/breakdown/route.ts`
- `app/api/shift/conversation/route.ts`
- `server/memoryContext.ts`
- `server/persistence.ts`

### Phase 3 — Correct provenance/source reporting

Current response metadata must describe the memories that actually influenced the result.

Review fields such as:
- `memoryUsed`
- `professionalLearningUsed`
- `memorySource`
- `memoryRetrieval`

Do not report `account` merely because the account has any memories if the selected/relevant memories came only from the device layer.

Keep professional learning and generic historical learning visibly separate.

### Phase 4 — Harden archive/delete semantics

Prove that:

- Archiving an account memory removes it from later retrieval.
- Device copies of that same durable memory cannot continue influencing prompts.
- Deleting a private source with `deleteLearning=true` removes the source-derived compact learning.
- Deleting only the source bytes leaves the explicitly retained compact learning when that is the user's chosen action.
- Optional semantic embeddings cannot resurrect an archived/deleted memory.
- Stale UI caches cannot cause a deleted memory to be re-sent.

Deletion must be behaviorally effective, not merely a UI disappearance.

### Phase 5 — Complete memory lifecycle across reflection, conversation, outcome, and continuity

Verify each path:

#### Reflection
- relevant compact learning may be retrieved;
- unrelated learning stays out;
- current report remains primary;
- provenance is visible.

#### Keep Talking
- current Shift context continues;
- only relevant prior learning enters;
- a proposed new memory is saved only after explicit user action.

#### Prediction/outcome
- prediction is stored before outcome when the user chooses to retain it;
- observed outcomes become evidence;
- a strategy becomes `HELPFUL_STRATEGY` only after lived evidence supports that label;
- repeated evidence may strengthen confidence/evidence count without collapsing materially different events.

#### Continuity
- continuity artifacts remain explicitly user-saved;
- they must not silently become factual long-term profile memory;
- if continuity is used for later retrieval, relevance and provenance rules must still apply.

### Phase 6 — Preserve professional learning as a separate memory class

Do not merge therapy/professional lessons into generic memory rows.

Preserve:
- source type;
- user confirmation;
- sensitivity level;
- revision lineage;
- supersession;
- archival controls;
- source attribution across revisions.

A revised lesson should create or preserve version lineage rather than silently rewriting history.

### Phase 7 — Retrieval correctness

Current retrieval combines lexical relevance and optional semantic similarity.

Preserve the principle:
- relevance must exist before type, recency, confirmation, or evidence can rank a memory.

Tests must cover:
- lexical-only retrieval;
- semantic retrieval;
- semantic service unavailable -> lexical fallback;
- unrelated high-value memory does not enter merely because it is recent/confirmed;
- rejected hypothesis is retrievable when relevant;
- current correction supersedes stale stored context.

Do not replace the conservative relevance gate with "top N nearest memories" retrieval.

### Phase 8 — Account identity and storage

Preserve:
- `app/chatgpt-auth.ts`
- trusted authenticated headers;
- pseudonymous fallback account key derived server-side from authenticated email when required;
- no browser-authoritative user ID.

D1/R2 readiness must remain verifiable through `/storage-check`.

Do not claim durable account storage is production-verified until the hosted Sites runtime passes the reversible D1/R2 test.

### Phase 9 — Expand regression tests before refactoring broadly

Add behavior-level tests for the acceptance criteria in:
`docs/MEMORY_INTEGRATION_ACCEPTANCE.md`.

Prefer tests that verify observable outcomes over tests that merely regex-match source code.

Keep the existing source-contract tests unless replaced by stronger behavior tests.

## Known risk areas

### Device/account duplication
`LearningMemorySync` currently stores extracted compact learning on the device even when the server may also persist it to the account. This is useful as fallback, but can create duplicate logical memory unless retrieval or migration deduplicates it.

### Source label accuracy
Current source metadata is coarse. Make it reflect selected/relevant memory provenance, not merely availability of account records.

### Semantic embedding lifecycle
Account rows are authoritative. Embeddings are optional acceleration. An embedding must never outlive the behavioral effect of a removed/archived record.

### Cross-runtime imports
The full durable runtime imports `cloudflare:workers`. The Vercel preview adapter intentionally bypasses that durable path. Do not force those imports into the Vercel function runtime.

### Build quota
Two Vercel projects are currently reacting to this repository:
- `shift-office-workspace-preview`
- `shift-approved-keep-talking-preview`

The Hobby account has hit Vercel build-rate limits. Minimize remote push churn. Run local tests before pushing checkpoint commits.

### Unprotected integration branch
The current integration branch is not protected. Do not merge or force-push release work automatically. Work only on this Codex branch until review.

### Node range
`package.json` currently uses `"node": ">=22.13.0"`. Do not broaden runtime changes during memory work. If you choose to pin to `22.x`, treat that as a separate compatibility hardening change and validate both build paths.

## Do not modify without necessity

Avoid visual redesign while implementing memory.

Preserve:
- cinematic landing;
- chair destination;
- approved office visual language;
- Keep Talking split layout;
- existing light-blue interaction language;
- existing games and practice flow.

Only change UI where required for memory control, provenance, migration, or error states.

## Definition of done

The memory integration is not done merely because records can be written.

It is done when all of the following are true:

- explicit remember action creates durable learning when account storage is available;
- signed-out/device behavior still works;
- account/device duplicates do not double-influence ranking;
- relevant memory is retrieved later;
- unrelated memory is excluded;
- a correction overrides stale memory;
- rejected hypotheses are not recycled as facts;
- delete/archive actually stops future influence;
- professional learning retains provenance/versioning;
- source deletion semantics match the user's chosen scope;
- semantic retrieval safely falls back;
- public provenance is accurate;
- Vercel preview remains honest about unsupported account persistence;
- all existing core tests remain green;
- new behavior tests are green;
- preview build is green;
- full Sites/Worker build is green when available;
- live D1/R2 round trip is separately verified before production claims.

## End-of-task Codex report

When finished, provide:

1. Exact commits created.
2. Files changed.
3. Architecture decisions made.
4. Tests added/changed.
5. Full validation commands and results.
6. Any unresolved risks.
7. Whether live Sites D1/R2 was actually tested.
8. Whether Vercel was tested and, if not, whether build quota prevented it.
9. A concise rollback point.
10. Do not merge to the integration branch; leave the work for review.
