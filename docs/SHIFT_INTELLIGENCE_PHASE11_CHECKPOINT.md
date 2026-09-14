# SHIFT Intelligence v2 — Phase 11 Provisional Checkpoint

Date: 2026-09-14

## Recovery point

- Working branch: `integration/shift-intelligence-v2-2026-09-14`
- Phase 9 fully validated checkpoint: `checkpoint/shift-intelligence-phase9-2026-09-14`
- Phase 10 provisional checkpoint: `checkpoint/shift-intelligence-phase10-provisional-2026-09-14`
- Phase 11 provisional checkpoint branch: `checkpoint/shift-intelligence-phase11-provisional-2026-09-14`
- Phase 11 code head before this documentation commit: `4c09a78f78e320fc4694ab4cc18978d27ef05e3b`

## Validation status

Phase 11 is intentionally marked **provisional**.

The user explicitly asked that no further Vercel testing or deployment activity be triggered while the 24-hour Vercel limit is exhausted. No Phase 11 validation pull request was opened and no Vercel tool or preview deployment was invoked.

The work is saved in GitHub. Full CI, complete core-test execution, and preview-build validation remain pending until the user explicitly says the Vercel limit has reset.

## Phase 11 behavior implemented

### Professional-learning review and control

A new `ProfessionalLearningPanel` is integrated into the main “What SHIFT remembers” experience.

The user can now review:

- current professional lessons;
- archived lessons;
- superseded versions;
- the attributed source type;
- trigger conditions;
- the practice/new skill;
- the updated rule;
- evidence-note count; and
- last-updated date.

The lifecycle behavior remains conservative:

- editing creates a **new user-confirmed version** rather than silently rewriting history;
- the original source attribution is immutable across revisions;
- the prior version remains visible in history;
- archiving removes the lesson from future retrieval;
- no lesson is silently saved, revised, restored, or archived by the model.

### Unified memory review surface

The main memory view now places professional learning alongside:

- durable account learning;
- device working memory; and
- private imported-source controls.

This makes storage location and epistemic category easier to distinguish without merging professional learning into generic memory.

### Confirmed-pattern wording corrected

The memory UI now defines a confirmed pattern as:

> A recurring pattern the user explicitly confirmed after reviewing the evidence.

Repeated evidence can justify asking the user whether a pattern fits, but evidence count alone does not confer `CONFIRMED_PATTERN` status.

### Breakdown-response provenance

The breakdown API now keeps public provenance categories separate:

- `memoryUsed` contains relevant historical learning only;
- `professionalLearningUsed` contains the separate professional-learning summaries;
- `memorySource` reports the durable/device source state; and
- `memoryRetrieval` reports lexical versus semantic-plus-lexical retrieval.

The saved Shift record carries those public metadata fields forward.

The breakdown transparency panel now always shows:

1. the current report as the primary input;
2. professional learning considered, when any passed relevance gating;
3. historical learning considered, when any passed relevance gating; and
4. an explicit statement when no stored learning was selected.

The panel clearly states that it displays **compact provenance, not hidden reasoning or chain-of-thought**.

### Per-response Keep Talking provenance

The conversation orchestrator now returns a compact public `influence` object containing only:

- whether the current message was the primary input;
- count/types of relevant historical learning;
- titles/source categories of relevant professional learning;
- whether user-approved personal context was selected; and
- external-research status/source count.

It does not contain hidden reasoning steps, internal evidence-map deliberation, or chain-of-thought.

Each successful Keep Talking response can display a collapsible “What influenced this response” section using this public metadata. Grounded research citations remain in their separate research section.

### Privacy-preserving transparency

The transparency implementation intentionally prefers compact provenance over raw vulnerable narrative:

- professional lessons expose title and attributed source category, not the full therapy history;
- generic memory exposes the compact durable record that actually passed relevance gating;
- personal context is represented as used/not-used in the per-response summary rather than automatically repeating sensitive profile details;
- raw imported documents are not inserted into the transparency panel;
- current user input remains authoritative over historical context.

## Main Phase 11 files

- `src/components/memory/ProfessionalLearningPanel.tsx`
- `src/components/memory/AccountMemoryPanel.tsx`
- `src/components/memory/EpistemicMemoryScreen.tsx`
- `src/components/reflect/MemoryInfluencePanel.tsx`
- `src/components/reflect/KeepTalkingScreen.tsx`
- `src/components/home/HomePage.tsx`
- `src/types/index.ts`
- `server/influenceSummary.ts`
- `server/shiftConversationOrchestrator.ts`
- `app/api/shift/breakdown/route.ts`
- `tests/phase11-transparency-memory-controls.test.mjs`
- `package.json`

## Non-Vercel test coverage added

`tests/phase11-transparency-memory-controls.test.mjs` adds contracts for:

- versioned professional-lesson revision;
- professional-lesson archive behavior;
- immutable source provenance;
- separate historical/professional breakdown influence metadata;
- current-report primacy;
- public influence summaries that exclude reasoning traces;
- explicit-confirmation wording for confirmed patterns;
- professional-learning integration into the memory review surface; and
- honest preview behavior when durable professional-learning storage is unavailable.

The non-preview `npm run validate:shift-core` command now includes this Phase 11 contract suite. Full execution remains pending while repository CI/Vercel validation is paused.

## Vercel pause rule remains active

Until the user explicitly says the Vercel limit has reset:

1. save work to GitHub;
2. do not open a validation PR that can trigger preview deployment;
3. do not invoke Vercel deployment or preview-validation tools;
4. use static/source review and targeted local smoke validation where possible;
5. label Phase 10 and Phase 11 checkpoints provisional rather than fully CI-validated.

## Phase 12 target

Phase 12 is the final integration/release-readiness phase. It should focus on:

- reconciling the intelligence branch with the current visual/deployment baseline without losing either body of work;
- auditing API/runtime differences between the intelligence branch and the deployed baseline;
- checking schema/migration readiness and deployment ordering;
- removing obsolete or duplicate paths only when a supported replacement is confirmed;
- final privacy, safety, memory, research, and recovery regressions;
- final whole-system build/test once the Vercel limit is available again;
- creating one golden recovery branch and a release handoff before any merge to `main`.

Do not merge the intelligence branch into `main` merely because Phase 11 is checkpointed. Phase 12 is the integration gate.
