# SHIFT follow-up repair and verification — 2026-10-03

## Outcome

Version 13 is published privately in the existing SHIFT project. Its source is mirrored exactly to GitHub and the existing Vercel preview project. Version 12 remains an independent immutable recovery checkpoint. The earlier paused repair patch remains unapplied in this checkpoint branch.

The owner screenshot showed report passages were retrieved but the answer failed the specific-history check. Existing logs did not contain rejected draft text, so the exact original failed citation rule could not be recovered. Local behavioral tests reproduced three related failure paths: malformed/missing citation metadata, one-name factual answers, and honest missing-detail replies. A fourth regression reproduced the sensitive-history exclusion of the wording “accidently shot.”

## Exact source and deployments

| Item | Reference |
| --- | --- |
| Sites project | appgprj_6aa0ac360e408191adb888e038295a44 |
| Live site | https://shift-reflection-arcade.robbpc.chatgpt.site/ |
| Sites version 13 source | b8e1c1bfe439e59aa0c07fd7639d68be16f57904 |
| Exact source tree | 871eafd4594d16ac4c2ad5c33f4830c959365019 |
| Saved version 13 | appgprj_6aa0ac360e408191adb888e038295a44~appgver_38eaa442587081918e67d01ef1034182 |
| Successful Sites deployment | appgdep_6ac1654113d081918b89a61bba58e511 |
| GitHub mirror commit | ec6867a5061b46aa9e3213987af95d46e354eab8 |
| GitHub repair branch | codex/shift-followup-grounding-2026-10-03 |
| Vercel existing project | prj_CcrDGGWAIpAbdWbXjoVxWoqsIKl8 / shift-office-workspace-preview |
| Vercel READY deployment | dpl_BcJfzomeuNg8hxC8xrEWqzyPpuiR |
| Vercel preview URL | https://shift-office-workspace-preview-qtmry4y4u-patrick-robbs-projects.vercel.app/ |

GitHub and Sites commit IDs differ because the repository histories differ. The GitHub and Sites tree IDs match exactly. The deployment’s GitHub commit SHA was independently checked. Both existing Vercel project status checks reported success. No main/master/integration merge or rewrite.

## Files changed

- server/historyGrounding.ts
- server/shiftConversationOrchestrator.ts
- server/detailedHistoryContext.ts
- tests/history-grounded-response.test.mjs
- tests/detailed-history.test.mjs

The server recovers bounded source references from actual selected passages and displayed answer text when model citation metadata is malformed. It retains the existing distinctive-detail overlap requirement. A one-detail exception applies only to an explicit factual name/date lookup whose full reply has one distinctive detail. A missing-detail answer must be explicitly marked not_found and scoped to retrieved passages; it does not invent a name, claim the entire report was searched, offer new durable learning, or claim history was used.

Response-quality checks against unsupported diagnosis, motive/causal certainty, unsafe instructions and substance-as-solution remain active. A not-found flag cannot bypass them. Validation logs now include enumerated reason codes without raw private content. Source references remain evidence pointers rather than semantic proof or clinical findings.

Retrieval normalizes friend/accident/shooting variants and recognizes accidental-event context. Unrelated photographic “shot” requests and unrelated dinner requests remain excluded in regression tests. No design, schema, dependencies, consent, identity, database records or private source files were changed.

## Verification

- Baseline architecture + 130 core tests: passed.
- Three answer/citation regressions and one accident-query regression: reproduced against prior behavior before their fixes.
- Final npm run validate:shift-core: architecture passed; 137/137 tests passed, none skipped.
- Added coverage includes four consecutive mock turns, exact selected-source excerpts, short factual recall, missing facts, guessed-name rejection, diagnosis rejection, and unrelated exclusion.
- npx vite build --config vite.preview.config.ts: passed.
- Sites production Worker build and archive validation: passed.
- Final npx tsc --noEmit: existing baseline failures remain; diagnostics match the version 12 baseline exactly.
- Working source checkout clean after publication.
- Protected Vercel /api/health: HTTP 200, ok:true, modelConfigured:true, accountMemoryAvailable:false.
- Sites owner-only access policy revision 1 unchanged; production environment revision 2 unchanged.
- Native dispatch GET storage inspection reached the live Worker: D1/R2 bindings and required schema available. The test request had authenticatedUser:false. A schema inspection is not a new authenticated storage round-trip result.
- Four sequential live /api/shift/conversation requests: HTTP 200, responseMode:model, no unavailableReason, including third and fourth turns. These general greeting/explanation/dinner test turns had accountMemoryAvailable:false and retrieved no private history. They were not saved as durable events.
- Recent five-minute Worker error query after these calls: no events.

Live continuity request references:
1. 6773fa33-ffba-422e-9003-33d5ba7e2f0f — 8.47 seconds
2. 419de66a-c580-45d6-952b-cfd22986e018 — 6.68 seconds
3. 28ebbf39-4e9e-4572-a0e8-595bc1ce9e45 — 6.89 seconds
4. 4c0eda42-900a-4a45-9a3d-92249232a1d1 — 6.66 seconds

## Remaining account-session check

The native dispatch test session does not carry the owner’s Sites account identity. Do not describe these live general-chat calls as proof of account-history recall. The owner should reload the actual Sites URL in their signed-in full Chrome tab and retry the two original follow-up questions. Inspect returned source excerpts and uncertainty qualifications; confirm the correct friend detail if present and that unrelated topics exclude private history.

Account memory persisted and was owner-verified before this repair. This repair does not add or remove account entries. No synthetic memories or imported duplicate sources were created. Vercel remains a preview adapter without Sites account identity or D1/R2 memory.

## Unresolved baseline limits

Dependency lockfile unchanged. The prior production audit reported 13 vulnerabilities (2 moderate, 11 high). Pre-existing TypeScript QA/PredictionLab diagnostics remain. A second physical device and automated local-file-picker selection remain unverified. The original rejected drafts were not logged. The evidence-pointer heuristic does not establish complete semantic correctness of model assertions.

## Rollback and preservation

Restore existing saved Sites version 12 privately in the same project:
appgprj_6aa0ac360e408191adb888e038295a44~appgver_a7acbbdf7cec819189508cfaffacd8fb
Sites source: c36982b0f63ac0ba73af9e9be295e0f91bdda1e8
Exact GitHub mirror: 0ed913f34ef05a12fdedcdcf2028c1afbca91e4c
Branch: codex/shift-sites-v12-2026-10-03
Vercel version 12 preview: https://shift-office-workspace-preview-5jjskormk-patrick-robbs-projects.vercel.app/

Code rollback does not erase account memories. Preserve owner-only access and server-side secrets. The public GitHub repository contains code/checkpoint notes, not private reports, memory records, credentials or account-data exports. Raw reports and genuine memories remain in private Sites storage. Do not automatically apply checkpoints/shift-paused-repairs-2026-10-03.patch.
