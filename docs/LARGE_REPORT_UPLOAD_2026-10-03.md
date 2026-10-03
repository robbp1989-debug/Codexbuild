# Large PDF report upload repair

Base: published version 9, source `62ce3ac815093204f027da88e22604995e486943`.
Project: `appgprj_6aa0ac360e408191adb888e038295a44`. Same design, owner-only audience, existing production secret and DB/FILES bindings.

## Problem and behavior

The selected 70-page text PDF is 737,248 bytes. Its extracted text is approximately 107,000 characters. The browser rejected it above 80,000 characters even though the account full-history upload and index already allowed 120,000.

The browser reader and report editor now share the 120,000-character limit. The existing 4 MB and 80-page limits remain. The screen displays the text count. Reports over the limit are rejected explicitly rather than shortened. PDF text is read in the browser and saved privately as extracted plain text only after the existing single full-history approval.

Detailed retrieval normalizes common mother possessives and nightmare plural/misspelling variants. PDF form-feed section boundaries are recognized without dropping source characters. Generic question words no longer dominate ranking. A nightmare query requires nightmare evidence in the actual passage, so other passages cannot qualify solely through an inherited chapter title. Existing attribution, uncertainty, historical-label qualifications, current-correction priority and account ownership requirements remain.

## Verification

- Architecture validation and all 114 core tests passed.
- Added a report-reader boundary test covering complete text above the old limit and at 120,000 characters, with explicit rejection at 120,001.
- Added a large fictional PDF-style source retrieval test covering page breaks, possessives, a common spelling error, specific autobiographical detail, uncertainty and unrelated exclusion.
- Extended the existing single-approval account-upload test to retain a complete source over 80,000 characters.
- The actual supplied PDF was read locally through the application reader using PDF.js's Node-compatible legacy build and a Node worker path solely in the verification harness. The deployed browser parser configuration was unchanged. Result: 106,769 characters after the reader's normal whitespace cleanup; 141 indexed passages; complete extracted text retained.
- Three short nightmare questions selected the relevant source section and its detailed history. An unrelated dinner question selected no history. No personal contents were copied into repository fixtures. These were local source-selection checks, not hosted AI-response checks.
- Preview and production Worker builds are required by the publishing workflow; final deployment and build results are reported in the handoff.

## Remaining live check

The owner must refresh SHIFT in signed-in Chrome, select this PDF, and choose **Approve and remember full history** once. This new PDF has not been saved to the account by the agent. Then reload, open a fresh related conversation, inspect personal-history provenance, and try an unrelated question. No synthetic scenarios should be remembered as genuine events. Existing sources and genuine learning records remain untouched.

## Changed files and limits

Product: `src/personalization/reportLimits.ts`, `src/personalization/readReport.ts`, `src/personalization/ReportImport.tsx`, `server/detailedHistoryContext.ts`.
Tests: `tests/report-import.test.mjs`, `tests/detailed-history.test.mjs`.
Checkpoint: this file.

Dependencies, lockfile, schema, secret and sharing settings were not changed. The previously recorded 13 audit vulnerabilities and unrelated TypeScript findings were outside this repair. Scanned PDFs still require text/OCR outside this reader. Retrieval is relevant passage selection, not the entire report in every prompt, and does not establish clinical causes or guarantee a model's answer.

Rollback: privately redeploy version 9:
`appgprj_6aa0ac360e408191adb888e038295a44~appgver_8e12eea0ca6881919710d9027163878b`.
It restores the earlier browser limit and ranking behavior without erasing stored account sources or learning.
