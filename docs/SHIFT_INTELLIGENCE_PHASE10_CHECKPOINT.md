# SHIFT Intelligence v2 — Phase 10 Provisional Checkpoint

Date: 2026-09-14

## Recovery point

- Working branch: `integration/shift-intelligence-v2-2026-09-14`
- Phase 9 validated checkpoint: `checkpoint/shift-intelligence-phase9-2026-09-14`
- Phase 10 provisional checkpoint branch: `checkpoint/shift-intelligence-phase10-provisional-2026-09-14`
- Phase 10 code head before this documentation commit: `461fb4defd067983c6073e2e7100f3ff7c539702`

## Validation status

Phase 10 is intentionally marked **provisional** rather than fully validated.

The user explicitly requested that no additional Vercel testing or deployment activity be triggered while the 24-hour Vercel limit is exhausted. No Phase 10 pull request was opened and no Vercel validation was intentionally triggered after that instruction.

The following non-Vercel checks were completed during development:

- targeted local Node smoke checks for the expanded diagnosis/motive/body-claim/trauma-procedure/medication guard patterns;
- targeted local Node smoke checks for current-turn-first personal-context retrieval, correction suppression, and explicit conversation carryover;
- source-level invariant tests were added for Phase 10 routing, response guards, research handling, and the post-revision quality gate;
- a new `npm run validate:shift-core` command was added so the full intelligence test suite and memory architecture checks can be run without a preview build once a suitable runner is available.

Full repository CI and preview-build validation remain pending until Vercel testing is explicitly resumed.

## Phase 10 behavior implemented

### Adversarial response guard expansion

The display-time guard now detects or escalates:

- unsupported diagnostic declarations;
- certain motive, deception, retaliation, or manipulation claims about another person;
- overconfident subjective-state claims;
- trauma-causation certainty from a present reaction;
- attempts to use dreams, intuitions, sensations, or reactions as proof of an unverified past event;
- literal claims that trauma is stored in or physically released from specific body tissue;
- self-directed intensive trauma-processing instructions;
- prescriptive medication or dose changes;
- alcohol or drugs presented as the recommended state-change solution;
- emotional invalidation;
- explanation being used to override a boundary;
- casual replacement or dismissal of professional care;
- fabricated or unapproved source URLs.

Warnings are no longer allowed to survive the single revision pass and still be displayed. If a revised response continues to trigger a quality warning or critical failure, SHIFT returns the transparent unavailable state rather than showing the unsafe or miscalibrated response.

### Current-turn-first personalization

Personal-context retrieval now gives substantially greater weight to the current message than to recent conversation. Stored context from a prior topic cannot become relevant merely because that topic appeared in the recent thread.

Explicit correction turns suppress stored context for that turn so the model is not simultaneously shown the stale claim the user is correcting. Explicit refer-back language such as “that same issue” or “again” can still carry genuinely relevant recent context forward.

### Factual routing hardening

Declarative factual requests no longer require a question mark to enter RESEARCH mode. Phrases such as “Tell me whether…” or “I want to know how…” can trigger grounded external research when an external factual domain is present.

Explicit WITNESS and THERAPY_PREP intent still outrank research routing.

### Research-source hardening

Grounded-research source handling now:

- accepts only public HTTPS citations;
- rejects localhost, local-domain, credential-bearing, and common private-network URLs;
- treats research synthesis and source content as untrusted evidence rather than instructions;
- tells the downstream model never to follow prompt-like commands embedded in source material.

### Behavior-policy reinforcement

The central behavior policy now explicitly states that:

- a dream, intuition, sensation, reaction, or familiarity signal does not prove a specific past event;
- emotions can be valid information without making every interpretation accurate;
- SHIFT does not tell users to replace or ignore professional supports;
- SHIFT does not prescribe medication changes;
- SHIFT does not instruct forced memory retrieval or self-directed intensive trauma procedures;
- SHIFT does not claim trauma is literally stored in or released from body tissue.

## New or materially changed files

- `lib/shift-behavior-policy.ts`
- `server/qualityGuard.ts`
- `server/responseOrchestration.ts`
- `server/shiftConversationOrchestrator.ts`
- `server/personalContext.ts`
- `server/researchEngine.ts`
- `tests/personalization.test.mjs`
- `tests/phase10-routing-and-invariants.test.mjs`
- `package.json`

## Vercel pause rule

Until the user explicitly says the Vercel limit has reset:

1. continue saving work to GitHub on the intelligence branch;
2. do not open a validation PR that could trigger preview deployment;
3. do not invoke Vercel deployment or preview-validation tools;
4. use source review, targeted local smoke checks, and the non-preview core validation command where possible;
5. do not label Phase 10 or later phases as fully CI-validated until the complete validation path is actually run.

## Next phase

Phase 11 should focus on user-facing transparency and memory control:

- show, in concise non-chain-of-thought form, what kinds of current facts, historical learning, professional lessons, or research materially influenced a response;
- make professional lessons reviewable, editable through supersession, and archivable without silently rewriting history;
- distinguish current learning, professional learning, working hypotheses, rejected hypotheses, and confirmed patterns in one coherent review surface;
- preserve privacy by showing compact provenance rather than raw sensitive narrative;
- ensure memory controls accurately reflect whether storage is device-only, account-backed, archived, superseded, or unavailable.

Do not merge the intelligence branch into `main` solely because this provisional checkpoint exists. Final integration with the visual/deployment baseline remains a Phase 12 task.
