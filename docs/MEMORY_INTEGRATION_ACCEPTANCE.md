# SHIFT Memory Integration Acceptance Checklist

Use this as the behavioral release gate.

## A. Baseline and builds

- [ ] `npm ci` succeeds.
- [ ] `npm audit --omit=dev --audit-level=high` succeeds or any exception is documented.
- [ ] `npm run validate:shift-core` succeeds.
- [ ] `npx vite build --config vite.preview.config.ts` succeeds.
- [ ] `npm run build` succeeds when the Sites/Worker environment supports it.
- [ ] No existing SHIFT core test is disabled merely to make the feature pass.

## B. Explicit memory creation

- [ ] A new reflection defaults to session-only behavior.
- [ ] No durable memory is created merely because an AI response mentions a possible pattern.
- [ ] Explicit Remember action can persist a compact learning record when account storage is available.
- [ ] Signed-out users remain functional with device-local behavior.
- [ ] A proposed Keep Talking memory is not saved until the user explicitly confirms Remember this.

## C. Epistemic type rules

- [ ] CONFIRMED_PATTERN requires explicit user confirmation.
- [ ] WORKING_HYPOTHESIS remains labeled as uncertain.
- [ ] REJECTED_HYPOTHESIS is retained as negative evidence and can suppress repeat suggestions.
- [ ] OUTCOME requires observed or user-confirmed outcome evidence.
- [ ] HELPFUL_STRATEGY is not created solely from AI advice; lived evidence is required.
- [ ] Raw CONFIRMED_FACT and USER_INTERPRETATION journal rows are excluded from normal durable retrieval.

## D. Account/device authority

- [ ] Signed-in account memory is authoritative when available.
- [ ] Device fallback works when account storage is unavailable.
- [ ] The same logical memory existing in D1 and localStorage is not double-counted in ranking.
- [ ] Duplicate device/account copies do not appear twice in visible provenance.
- [ ] Account retrieval failure safely falls back without claiming persistence succeeded.

## E. Relevant retrieval

Create at least these behavior tests:

### Related memory
Given:
- remembered boundary: "I do not answer non-emergency work messages after 7:30 PM."

When:
- current reflection concerns late-night work messages.

Then:
- the boundary may be retrieved;
- provenance identifies historical learning;
- the current event remains primary.

### Unrelated memory
Given the same remembered boundary.

When:
- current reflection concerns choosing what to cook for dinner.

Then:
- the boundary is not retrieved merely because it is recent, confirmed, or high-value.

### Correction
Given:
- old memory says the user prefers option A.

When:
- current user says "Correction, I do not prefer A anymore; I prefer B."

Then:
- stale A is not injected into the correction turn;
- current statement wins;
- future persistence requires the normal explicit memory flow.

### Rejected hypothesis
Given:
- user previously rejected the hypothesis that a friend's slow reply means rejection.

When:
- a related future event occurs.

Then:
- the rejected hypothesis can influence the response as negative evidence;
- SHIFT does not present that rejected explanation as a fresh fact.

## F. Semantic retrieval

- [ ] Semantic retrieval can find a relevant compact memory when wording differs materially.
- [ ] Semantic similarity cannot make an unrelated memory relevant by itself below the configured threshold.
- [ ] If embedding generation fails, lexical retrieval still works.
- [ ] Account memory rows remain authoritative over vector data.
- [ ] Raw imported documents are never embedded as ordinary reusable memory.

## G. Professional / therapy learning

- [ ] Professional learning remains stored separately from generic learning memory.
- [ ] Source type remains visible.
- [ ] User confirmation remains visible.
- [ ] Sensitivity metadata is preserved.
- [ ] Revision creates/preserves lineage; old provenance is not silently rewritten.
- [ ] Archived professional learning stops influencing future responses.
- [ ] Generic memory UI does not mislabel professional learning as ordinary AI-generated memory.

## H. Delete/archive behavior

### Archive one memory
- [ ] Archive from account memory UI.
- [ ] It disappears from account memory view.
- [ ] Matching device duplicate is removed or otherwise excluded from retrieval.
- [ ] A later related reflection does not retrieve it.
- [ ] Optional embedding data cannot cause it to reappear.

### Delete imported source only
- [ ] Source bytes are removed from R2.
- [ ] Source metadata reflects deletion.
- [ ] Previously extracted compact learning remains if the user chose to retain it.

### Delete imported source + learning
- [ ] Source bytes are removed.
- [ ] Source-derived compact learning is removed.
- [ ] Device copies tied to that source are removed/excluded.
- [ ] Future related reflection does not retrieve the deleted learning.

## I. Prediction/outcome learning

- [ ] A prediction can be recorded before outcome.
- [ ] Outcome is recorded separately as observed evidence.
- [ ] Repeated evidence can increase evidence count/confidence conservatively.
- [ ] Distinct events are not incorrectly collapsed into one record merely because wording is similar.
- [ ] Strategy promotion to HELPFUL_STRATEGY requires the user's real-world outcome.

## J. Continuity

- [ ] Continuity artifact is saved only by explicit user action.
- [ ] Continuity does not silently become a generic profile fact.
- [ ] If continuity enters a later response, relevance rules apply.
- [ ] Its source/provenance remains distinguishable.
- [ ] Archive/delete semantics prevent future influence.

## K. Public provenance

- [ ] User can see whether current report, historical learning, professional learning, personal context, or research influenced a response.
- [ ] Public provenance matches what actually passed the relevance gate.
- [ ] `memorySource` is not labeled account merely because unrelated account memory exists.
- [ ] Device-only selected memory is not mislabeled account memory.
- [ ] No hidden reasoning or chain-of-thought is exposed.

## L. Vercel preview contract

- [ ] Homepage works.
- [ ] Health endpoint works.
- [ ] Reflection/conversation fallback works.
- [ ] Unsupported account-memory endpoints remain explicit about unavailability.
- [ ] Preview does not fabricate persistence.
- [ ] Preview does not accept browser-supplied identity as authoritative.
- [ ] No `cloudflare:workers` durable-storage imports leak into the Vercel adapter runtime.

## M. Live Sites storage verification

This section cannot be checked off from local tests alone.

While signed in on the hosted Sites runtime:

- [ ] `/storage-check` sees authenticated user.
- [ ] D1 binding exists.
- [ ] Required D1 tables exist.
- [ ] D1 reversible write/read/delete passes.
- [ ] R2 binding exists.
- [ ] R2 reversible write/read/delete passes.
- [ ] Synthetic cleanup succeeds.
- [ ] `ready: true`.

Then perform a real memory round trip:

1. [ ] Remember one harmless test learning explicitly.
2. [ ] Reload.
3. [ ] Ask a related reflection and verify retrieval.
4. [ ] Ask an unrelated reflection and verify no leakage.
5. [ ] Delete/archive the test memory.
6. [ ] Repeat the related reflection and verify it no longer influences the response.

## N. Review gate

- [ ] Codex provides exact commits and changed files.
- [ ] Codex states whether live Sites storage was actually tested.
- [ ] Codex states whether Vercel validation was blocked by Hobby rate limits.
- [ ] No direct merge to integration/main/master.
- [ ] Human/assistant review completed before merge.
