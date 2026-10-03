# Private report import and explicit account learning review

Base: published version 7, source `6a875c659ffb1c23a29bf4e00bc5243ab9c5abb7`, existing SHIFT project `appgprj_6aa0ac360e408191adb888e038295a44`.

The report screen now offers a separate private account import alongside the existing visit/device excerpt path. Approved full report text is stored privately in R2, processed once, and used to propose compact learning drafts. Drafts stay in R2 and are never active retrieval memory. Only a separate Remember this action saves each reviewed entry to D1. Drafts can be reopened under Memory after reload. Source deletion also removes its draft review; saved learning deletion remains separately selectable.

All identity checks remain server-side. Document memory approval requires ownership of a non-deleted source. Working hypotheses remain uncertain; outcomes and helpful strategies require explicit lived-result confirmation. The extractor preserves reported-history attribution, historical diagnostic-label qualifications, dated safety statements and uncertainty about causes/motives. Professional lessons remain separate. No personal report contents or credentials were embedded in source.

Keep Talking now checks the account save result before displaying success. Signed-out device saves are labeled device-only; failed account saves preserve the suggestion for retry.

## Changed files

- `app/api/shift/memory/remember/route.ts`
- `app/api/shift/source/upload/route.ts`
- `app/api/shift/source/review/route.ts`
- `app/privacy/page.tsx`
- `server/persistence.ts`
- `server/accountMemoryControls.ts`
- `server/documentExtraction.ts`
- `src/personalization/ReportImport.tsx`
- `src/personalization/SourceMemoryReview.tsx`
- `src/personalization/PersonalizationScreen.tsx`
- `src/components/memory/AccountMemoryPanel.tsx`
- `src/components/memory/SourceImportCard.tsx`
- `src/components/reflect/KeepTalkingScreen.tsx`
- `tests/source-memory-review.test.mjs`
- `package.json` (test command only)
- `docs/LEARNING_MEMORY_ARCHITECTURE.md`
- this checkpoint

## Validation and limits

- Fresh dependency installation succeeded; dependency versions and lockfile unchanged.
- Baseline architecture validation, all 94 tests, preview build and Worker build passed.
- Ten additional behavioral tests cover upload consent, full-text processing, drafts without active learning, storage/extraction failure, source ownership, explicit approval, epistemic safeguards, account-read persistence, relevant retrieval/unrelated exclusion, and source/draft/learning deletion. All 104 core tests passed before publication.
- The production audit remains at 13 vulnerabilities (2 moderate, 11 high); no dependency changes were made.
- TypeScript still reports unchanged QA/Playwright dependency/type findings and the existing `didFearedOutcomeHappen` identifier in PredictionLabScreen. Changed product files had no TypeScript findings after correction.
- The preview adapter remains honest about unavailable account persistence. No Vercel deployment or GitHub integration-branch merge was attempted.
- No schema migrations, access-policy changes or secret changes were made.
- This change's hosted personal-report upload, actual memory approval, reload and fresh related/unrelated conversation checks remain pending the owner's signed-in browser. Local fixture checks are not hosted verification. Existing genuine account learning and baseline records remain untouched by this task.
- Full text is processed within the extraction limit; compact themes are selected rather than a complete biography. Processing beyond the limit is disclosed. The current browser report reader limits text to 80,000 characters.
- Rollback: privately deploy saved version 7 with existing environment revision 2. Rolling back source does not erase account learning. Unchanged source/archive provenance is recorded above; earlier version 6 would also restore the older common-word retrieval behavior.
