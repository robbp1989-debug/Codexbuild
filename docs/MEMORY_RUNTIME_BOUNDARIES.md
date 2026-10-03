# SHIFT Memory Runtime Boundaries

## Purpose

This document prevents an easy but dangerous implementation mistake: treating the Vercel preview and the ChatGPT/Sites durable runtime as equivalent.

They are not equivalent.

## Durable account-memory runtime

The authoritative account-memory implementation is designed for the ChatGPT/Sites hosting environment.

It relies on:

- authenticated OpenAI/Sites request headers;
- D1 binding `DB`;
- R2 binding `FILES`;
- `.openai/hosting.json`;
- packaged migrations;
- server-side account identity.

Relevant code includes:

- `app/chatgpt-auth.ts`
- `server/persistence.ts`
- `server/accountMemoryControls.ts`
- `server/semanticMemory.ts`
- `server/continuityStore.ts`
- `server/therapyLessonStore.ts`
- `server/storageSelfTest.ts`

The durable account runtime is allowed to return account-backed memory only after trusted identity is resolved server-side.

## Vercel preview runtime

Vercel is currently a development preview adapter.

It builds with:

`npx vite build --config vite.preview.config.ts`

and routes API traffic to:

`api/shift.ts -> server/previewApi.ts`

The preview intentionally supports useful non-durable behavior while clearly reporting unavailable account features.

Expected preview behavior includes responses such as:

- `persisted: false`
- `accountRequired: true`
- empty account-backed collections;
- explicit unavailable endpoint responses.

This is not a bug.

## Current observed Vercel state

Project:
`shift-office-workspace-preview`

Last successfully observed deployment commit:
`7de2ef419e037e4ab14599e3aa8c0f56e20bc4e3`

Observed behavior:
- homepage: HTTP 200;
- `/api/health`: HTTP 200;
- account memory unavailable;
- continuity reports `accountRequired: true`;
- therapy lessons report `accountRequired: true`;
- no runtime error clusters were reported in the prior 7-day inspection window.

The repository branch later advanced to:
`b6d8a2bc11c83930f6bdbbfd605d0b8c49496455`

GitHub validation passed at that commit. Vercel could not build it because the Hobby account hit its build-rate limit.

## Rules for Codex

1. Do not move D1/R2 account persistence into Vercel just to make preview tests pass.
2. Do not trust user IDs from request bodies or browser storage.
3. Do not simulate account-backed persistence while presenting it as real.
4. Keep preview responses explicit about persistence limitations.
5. Keep API response shapes compatible enough that the UI can degrade honestly.
6. Cross-runtime code must not import `cloudflare:workers` into the Vercel adapter execution path.
7. If a feature requires durable identity/storage, the preview should report that requirement rather than fabricate success.
8. Full live storage verification belongs in the Sites runtime via `/storage-check`.

## Deployment hygiene

Two Vercel projects currently appear to react to the same repository, which contributes to Hobby build-rate exhaustion.

Until that project duplication is cleaned up in Vercel:
- batch changes locally;
- validate before pushing;
- avoid one-commit-per-tiny-edit workflows;
- do not interpret rate-limit failures as application failures.

## Production claim threshold

Do not state that memory persistence is production-ready until all of these have occurred:

1. Sites runtime deployed.
2. Authenticated account recognized.
3. D1 schema readiness passes.
4. D1 synthetic write/read/delete round trip passes.
5. R2 synthetic write/read/delete round trip passes.
6. A real explicit remember flow persists.
7. Reload retrieves it where relevant.
8. Archive/delete prevents later influence.
9. No unrelated memory leaks into an unrelated reflection.
