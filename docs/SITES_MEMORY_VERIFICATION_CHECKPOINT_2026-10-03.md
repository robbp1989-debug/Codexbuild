# SHIFT Sites memory verification checkpoint — 2026-10-03

## Source and release boundary

Reviewed source: `robbp1989-debug/Codexbuild`, branch `codex/memory-integration-2026-10-03`, merge commit `cb2c42feb386c2531a85623607980e8bdde5abc6` (PR #36).
The recovered local tree matched GitHub tree `bbfef759a4439a8924118ade8dc731311d3fb8db` before any edits.
Do not merge this work to main/master/integration. Do not describe account persistence as live-verified yet.

## Verified deployment observations

- Vercel project: `shift-office-workspace-preview` (`prj_CcrDGGWAIpAbdWbXjoVxWoqsIKl8`).
- The reviewed merge commit deployed READY at `https://shift-office-workspace-preview-2ulfsqkv7-patrick-robbs-projects.vercel.app`.
- Its `/api/health` returned HTTP 200, `modelConfigured:true`, `accountMemoryAvailable:false`. The latter is the intended Vercel-preview contract.
- The repository manifest links the existing owner-private Sites project `appgprj_6aa0ac360e408191adb888e038295a44`.
- Existing Sites URL: `https://shift-reflection-arcade.robbpc.chatgpt.site`.
- Existing saved Sites version 5 uses source `f2efadf2a2396dafb67d07fd460e886e92debcd8`, not the reviewed merge.
- Sites runtime environment-variable entries were empty, and the live database overview returned no D1 bindings or tables. R2 availability was not independently established.
- The existing Sites source was restored read-only to `.sites-checkout`; it was not overwritten or republished.
- OpenAI Developers installation is confirmed. Its API-key skill/tools are not exposed in this active session, so no key was created or copied.

## Corrections prepared in this checkpoint

1. Append journaled Sites migrations for semantic-memory embeddings and professional learning/pattern/continuity tables. The Sites build plugin packages `drizzle`, while the earlier checker only examined SQL under `migrations`. Consequently, the reviewed build would omit four required tables.
2. Preserve the original `0000` migration and journal entry. Only append new SQL and metadata; no stored-learning backfill or destructive schema change.
3. Make GET inspection report `ready:false`: bindings/schema alone cannot prove reversible writes and cleanup. Only a successful POST self-test may report readiness.
4. Correct the readiness-page TypeScript response narrowing.
5. Add four behavioral tests that execute the journal SQL against SQLite, preserve existing learning during upgrade, enforce professional-lesson lineage/ownership constraints, and exercise actual diagnostic logic with local D1/R2 fixtures. These fixtures do not count as hosted verification.

## Validation

- `npm ci --no-fund --no-audit`: passed.
- Baseline `npm run validate:shift-core`: 89/89 passed.
- Updated `npm run validate:shift-core`: 93/93 passed, none skipped.
- Baseline and updated Vercel-compatible Vite builds: passed.
- Baseline and updated full Sites/Worker builds: passed.
- Built `dist/.openai/drizzle` contains all three SQL files and the appended journal entries.
- `git diff --check`: passed.
- `npx tsc --noEmit`: repository remains failing on pre-existing QA/Playwright typing errors and the existing PredictionLab identifier diagnostic. The storage-check diagnostic was removed; no new diagnostic was introduced.
- `npm audit --omit=dev --audit-level=high`: successfully contacted the registry and reported 13 vulnerabilities (11 high, 2 moderate), all on the untouched baseline lockfile. Earlier HTTP 403 observations do not apply to this run. Dependency remediation remains a separate release gate; do not blindly use `npm audit fix --force`.
- Neither the authenticated hosted reversible storage test nor the account memory round trip has run.

## Resume in order

1. Load the installed OpenAI Developers API-key skill in a fresh session and follow its account-selection, approval, and secret-handling rules. Configure the key as a secret in the existing private Sites project; never paste a key into chat, command arguments, or committed files.
2. Inspect and preserve the existing Sites access policy. Keep owner-only access.
3. Open the existing Sites source through the native workflow and port the reviewed GitHub tree plus this checkpoint's corrections, preserving Sites `.git` and project ID. Do not deploy the old source tree by mistake.
4. Use the Sites build/packaging/source workflow and save/deploy the corrected private version. Record both the GitHub source checkpoint and the Sites source commit/version; these are distinct repositories.
5. Confirm the live database has all required tables and `/storage-check` recognizes authenticated identity.
6. Run the reversible D1/R2 self-test. Confirm write/read/delete, cleanup, and `ready:true`.
7. Explicitly save one harmless synthetic learning, reload, verify related retrieval and unrelated exclusion, archive/delete, then verify no further influence even with stale device memory. Do not put real personal history into a diagnostic.
8. Record exact results and clean up the synthetic memory. Resolve the dependency audit before a broader production release.

## Rollback references

- Reviewed GitHub checkpoint before these corrections: `cb2c42feb386c2531a85623607980e8bdde5abc6`.
- Existing private Sites saved version: `appgprj_6aa0ac360e408191adb888e038295a44~appgver_d2f01e8ae064819187158fea9a8ba96c`.
- Sites migration application may precede Worker upload; a version rollback does not undo schema changes. Do not rewrite applied migration history.
