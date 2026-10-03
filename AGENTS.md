# AGENTS.md

## Current task

This branch is dedicated to completing SHIFT memory integration.

Before editing code, read:

1. `CODEX_MEMORY_INTEGRATION_HANDOFF.md`
2. `docs/LEARNING_MEMORY_ARCHITECTURE.md`
3. `docs/MEMORY_RUNTIME_BOUNDARIES.md`
4. `docs/MEMORY_INTEGRATION_ACCEPTANCE.md`
5. `SAVEPOINT_2026-09-10_LEARNING_MEMORY.md`

Treat the handoff and acceptance checklist as the implementation contract for this branch.

## Guardrails

- Do not redesign the memory architecture from scratch.
- Do not weaken trusted account identity or consent requirements.
- Do not turn raw narratives or uploaded documents into ordinary reusable memory.
- Do not convert AI inference into user fact.
- Do not merge professional/therapy lessons into generic learning memory.
- Do not make Vercel pretend it has ChatGPT/Sites D1/R2 account persistence.
- Do not merge this branch to integration/main/master.
- Run the baseline and regression validations described in the handoff.
- Prefer behavioral tests over source-text-only tests when adding coverage.
- Preserve existing approved SHIFT visual behavior unless a memory control requires a UI change.
- Minimize remote push churn because the Vercel Hobby account is currently hitting build-rate limits.

When implementation is complete, report exact commits, changed files, validation results, unresolved risks, live-storage verification status, and rollback point.
