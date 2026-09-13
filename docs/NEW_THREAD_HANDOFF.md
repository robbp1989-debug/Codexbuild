# SHIFT — new-thread handoff, 2026-09-13

## Start here
Continue the existing SHIFT second-brain integration. Preserve the office visuals and scroll behavior. The owner authorized implementation and website updates, but requested this pause/savepoint because usage is nearly exhausted. Do not restart the project, merge into main blindly, or repeat the entire research audit. First resolve the missing-key fallback described below, then verify a real model conversation. Save incremental GitHub checkpoints. Never request API secrets in chat.

## Durable source of truth
- Repository: https://github.com/robbp1989-debug/Codexbuild
- Branch: `integration/second-brain-2026-09-12`
- Draft PR: https://github.com/robbp1989-debug/Codexbuild/pull/27
- Last application-code commit: `a89f9fae373837b16b7034c8c42470f8f0511332` (Node ESM runtime fix).
- This handoff is a later documentation-only savepoint on that branch. Fetch the latest branch before editing.
- Earlier detailed history: `docs/SECOND_BRAIN_CHECKPOINT.md`. Its earlier pending/deployment statements are historical; this document supersedes them.
- Original base: `preview/vercel-demo-2026-09-11`, commit `009bd6a2b04ee2defd4e3b17c1a468f86bb1f1e3`. Main is older; preserve the newer office/Keep Talking baseline.

## Immediate issue: repeated response is a missing-key fallback
The latest user screenshot shows identical replies to two different messages. The exact opening is “We can stay with this instead of moving into practice.” This matches `continueShiftConversation` in `server/aiClient.ts`, specifically `if (!process.env.OPENAI_API_KEY)`. It is deterministic fallback text, not evidence of successful live AI. The model-error catch uses different wording (“We can keep talking about this…”).

Earlier authenticated health screenshot:
```json
{"ok":true,"modelConfigured":false,"knowledgeVersion":"2026-09-12.1","sourceCheckedCards":4,"accountMemoryAvailable":false,"researchSync":"versioned_snapshot"}
```
The interface and backend runtime now work. Live AI is still unverified. No fix to fallback behavior was made at this pause.

The user's last environment screenshot showed BOTH `OPENAI_API_KEY` and `OPENAI_API_KEY_Preview` scoped only to Production. Instructions given: edit the exact `OPENAI_API_KEY`, enable Preview (Production can remain selected), save, then redeploy the actual integration preview. Preview is an environment, not a suffix in the variable name. No custom branch restriction is needed. Do not overwrite an existing valid saved secret unless replacing intentionally. Creating a second OpenAI key is valid; the friendly OpenAI key name is irrelevant. Do not revoke keys used by other apps.

## Deployment facts
- Correct Vercel project: `shift-office-workspace-preview` under the owner's team.
- GitHub commit statuses and PR deployment bot confirm automatic preview deployment for the integration branch. Find the latest preview via PR #27 and its commit checks.
- Preview requires Vercel authentication. Unauthenticated requests redirect to login; they do not establish API failure.
- Vercel connector repeatedly listed zero projects / returned 404 despite reconnection. Do not waste the next session repeating reconnection. GitHub statuses were usable; the user can open the authenticated preview.
- The user also deployed an unrelated CLI placeholder to Production showing only “SHIFT preview test”. Do not redeploy/promote that placeholder or treat its health 404 as the integration's failure. Check source branch/commit before redeploying.
- A previous `FUNCTION_INVOCATION_FAILED` was caused by extensionless Node ESM imports. It is fixed in a89f9fa; the user's health screenshot confirms runtime recovery. Keep explicit emitted `.js` imports throughout the function dependency chain.
- Private Drive and deployment URLs are intentionally omitted from this public-repository handoff. Ask the owner for the private research folder again only when needed; use PR checks for preview links.

## Implemented
- `src/second-brain/knowledge.ts`: four original NHS-source-checked educational cards, version 2026-09-12.1, with source links, limits, and clinical review pending. Covers thought record, balanced perspective, practical choice, worry plan. Bounded lexical selection, game eligibility, conservative high-risk exclusions, shared evidence instructions.
- `src/data/research-candidates.json`: 72 public bibliographic URLs, all inactive/pending verification. Full research corpus is not reviewed or ingested. No live Drive sync.
- `src/second-brain/EvidencePanel.tsx`: optional unscored exercises and visible sources/limits in Reflection and Learn. Older Learn modules labeled draft pending review.
- `server/aiClient.ts`: shared evidence instructions for reflection, Keep Talking and generated game content. Server-only key. Existing model client uses 8-second per-call timeout and 1,800 completion tokens; diagnose actual errors before tuning these.
- `server/fallbackAnalysis.ts`: neutral fallback preserves input, removes invented narrative, does not confirm feelings or needs.
- Home/Keep Talking: pre-request safety checks; suggestions are not automatically user-confirmed. Keep Talking displays per-response research context; source selection does not prove an interpretation.
- `server/previewApi.ts`, `api/shift.ts`, `vercel.json`: Vercel Node fetch handler, API routing before SPA; health, knowledge, breakdown, conversation, confirmed game-content endpoints. Bounded requests, origin/method checks, no-store, explicit unsupported account endpoints.
- Account memory is unavailable on this adapter. Existing consented device memory can supply request context. Do not claim account persistence or cloud sync.

## Verification already completed
All 13 focused tests and the Vite preview build passed at the last code checkpoint:
```sh
node --test tests/second-brain.test.mjs tests/preview-api.test.mjs tests/runtime-import.test.mjs
npx vite build --config vite.preview.config.ts
```
The runtime test compiles an unbundled NodeNext entry and calls health, catching the ESM issue missed by bundled tests. Full typecheck has pre-existing storage-check typing / missing Playwright QA dependency failures. Successful build, health, or key-presence checks are not proof of a working model or clinical efficacy. This documentation-only checkpoint did not rerun unchanged tests.

## Next actions, in order
1. Open health on the SAME current integration deployment used for conversation. Resolve Preview-scoped `OPENAI_API_KEY` and redeploy the correct branch. `modelConfigured:true` only proves key presence.
2. Test two ordinary fictional messages with distinct context. Confirm responses change and refer appropriately to latest input/history. Inspect sanitized runtime errors if fallback persists; check key validity, API billing, model access, timeout/empty-output/JSON failures. Never log keys or private narratives.
3. Make unavailable-AI behavior transparent instead of silently impersonating a contextual conversation. Consider explicit response mode/reason metadata and a user-facing unavailable state; test missing-key and provider-error paths. Merely rotating canned prompts would conceal the issue.
4. Verify the existing source panel and optional exercises on the live preview. Preserve visual baseline. Do not promote until actual behavior is checked.
5. Continue source-by-source primary-evidence review of the 72 inactive candidates, scope/limitations and independent clinical review of adaptations. The research summary reviewed earlier overclaimed support for the app's exact sequence; do not repeat that claim. Review older game answer keys and whether generated-game endpoints are mounted in the intended UI.
6. Plan authenticated research synchronization and account memory separately if still desired; neither is implemented here.

## Working-copy cautions
The previous workspace was `/workspace/scratch/31d6523761bc/shift`; it may expire. Code was saved through GitHub tools because shell push lacked credentials. Local HEAD/status may not match remote saved commits and can display already-saved code as dirty. Do not reset or force-push blindly; use a fresh checkout of the remote integration branch if needed. Prior public-repository approval rejected private links, so only sanitized code, public research sources, and operational notes were committed. No user conversation examples or secret values belong in public docs.
