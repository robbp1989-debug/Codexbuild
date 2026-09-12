# SHIFT second-brain integration checkpoint — 2026-09-12

## Authorization and preservation
The project owner authorized implementation, testing, and website update in the current conversation. Preserve the existing office visuals and scroll behavior. Save incremental commits to GitHub because usage is limited.

## Current state
- Working branch: integration/second-brain-2026-09-12.
- Provisional base: preview/vercel-demo-2026-09-11 at 009bd6a. This contains the latest dated preview/Keep Talking layout commits discovered. It is NOT yet verified as the user's deployment source.
- GitHub main is older than the newer visual/integration branches. Do not overwrite main or merge blindly.
- This base uses a static Vite Vercel preview with an all-path SPA rewrite. Check backend availability before implementing API-dependent integration.

## Research collection
Register and one summary were reviewed in conversation. Full corpus has NOT been verified or ingested. Do not treat summaries as primary research. The Crum summary overstates support for SHIFT's exact sequence; keep design interpretations distinct from study findings.

## Implementation sequence
1. Inspect this branch's reflection, practice, evidence, memory and server routes; reuse existing architecture.
2. Add a bounded, versioned source register and original evidence cards with precise source support and explicit review status. Keep unverified sources out of active retrieval.
3. Retrieve appropriate cards for user-confirmed needs; preserve uncertainty, boundaries and user correction. Never force a benign interpretation or diagnose.
4. Apply the same evidence and safety instructions to reflection and practice generation. Include provenance in user-visible explanations.
5. Preserve personal-memory consent and separation from shared research. No private reflections or credentials in GitHub.
6. Test source selection, restrictions, missing evidence, game consistency, and build compatibility.
7. Commit/push each coherent checkpoint. Resolve correct deployment source/access before publishing; otherwise leave an explicit resumable handoff.

## Completed / pending
Completed: repository clone, branch discovery, preliminary architecture review on main, deployment access checks, checkpoint.
Pending: current-branch inspection, evidence verification, implementation, tests, deployment.
No application code changes or clinical validation have occurred at this checkpoint.

## Implementation checkpoint
- Imported 72 public bibliographic URLs into an inactive verification queue. No private research links or narratives included.
- Four original, source-checked NHS self-help cards; independent clinical review explicitly pending. The larger research corpus is not clinically verified.
- Added inspectable sources and voluntary, unscored step-by-step practice on Reflection and Learn screens; works in static preview.
- Added bounded lexical evidence selection and shared restrictions for server reflection, Keep Talking, and generated game content. Unsupported game requests return the existing fallback signal.
- Removed automatic confirmation of suggested emotions/needs and replaced invented fallback narratives with neutral reflection prompts.
- No live Drive sync, account backend migration, or deployment is completed. Static preview does not execute app/api handlers.
- Full typecheck currently reports existing storage-check typing and missing Playwright QA dependency errors; no errors reported in edited files. Preview build verification in progress.

## Verified savepoint
- Preview production build PASSED. Six focused second-brain tests PASSED (`node --test tests/second-brain.test.mjs`, Node 24).
- Added the existing safety check before the browser makes a reflection request, so static/offline fallback does not skip that check. This is not a comprehensive clinical risk assessment.
- Existing older Learn modules explicitly marked as draft pending source/clinical review.
- Deployment connector also could not access the user-provided preview through its authenticated fetch. No live update claimed.
- Remaining: verify exact target deployment/branch, enable a real backend on that deployment, complete primary-source review of 72 candidates and independent review of adapted exercises, assess existing game answer keys, and add real authenticated source synchronization if desired. Current import is a versioned snapshot, not live Drive synchronization.
- Saved implementation at b63b3fc before final test/handoff commit. Resume from the integration branch, not main.
