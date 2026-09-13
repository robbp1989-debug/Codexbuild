# SHIFT — resume here (2026-09-13)

## Copy into the next conversation
Continue robbp1989-debug/Codexbuild from branch `integration/holly-report-import-2026-09-13`, draft PR #28. Read `docs/NEW_THREAD_HANDOFF.md` and `HOLLY.md` first. Preserve the working office/scroll, AI configuration, automatic spoken-answer intake, reference choices, and reviewed report context. Begin with real-device voice/visual verification if access permits, then improve observed issues. Do not rebuild from main, repeat the API-key investigation, or implement every suggestion at once. Fetch the branch's latest commit before changes. Save small checkpoints and report actual verification limits. Patrick requested this handoff because usage was nearly exhausted.

## Verified save point
- Repository: https://github.com/robbp1989-debug/Codexbuild
- Working branch: `integration/holly-report-import-2026-09-13`
- Draft PR: https://github.com/robbp1989-debug/Codexbuild/pull/28
- Latest application commit: `2503fc2ce33b79880be558f9e3a065b4600b2973`
- Application tree: `d862ab43cc75e90b599f3a2aac18256b728f03c9`
- This handoff is a later documentation-only commit on the same branch.
- Recovery branch: `backup/holly-reports-working-2026-09-13`, pinned to the application commit above.
- PR base: `integration/second-brain-2026-09-12` (PR #27), commit `9c0ca0bff682f6ad677f6342933438a7e43c0dfb`. Main is older. Neither PR was merged or promoted to production in this work.
- Primary preview: https://shift-office-workspace-previe-git-194874-patrick-robbs-projects.vercel.app

## Latest verification
At the pause, GitHub Validate SHIFT run **34774701182**, run number 75, succeeded for application commit 2503fc2. Both Vercel deployments succeeded:
- shift-office-workspace-preview: 68kan39pHVftc8ryXJxrYmyhUrKm
- shift-approved-keep-talking-preview: 5RJQSRL17ddXanmxFhx7joSVnkCx

Initial integration passed 26 focused tests. The voice follow-up added an automatic-turn-taking test; nine intake/provider tests passed after the latest reference-choice change. Targeted lint and the actual Vercel build passed. The CI workflow runs the combined suite, architecture check and preview build. Project-wide TypeScript has pre-existing errors in storage-check and old QA files missing Playwright types; do not present that as clean.

Real microphone tests, desktop/mobile visual inspection and PDF import in a browser remain unverified. The cloud browser reached Vercel sign-in; connector temporary access failed. Local browser utility failed to start, and the supported cloud browser blocked localhost. Do not disable protection or repeatedly reconnect Vercel. Patrick said the result looked great; that is user feedback, not independent browser QA.

## What is implemented
1. **Report context:** PDF, DOCX, TXT, Markdown, CSV and JSON read in browser; manual excerpt selection and approval. No raw-file upload/storage or AI summarization. Files up to 4 MB, PDFs up to 80 pages, extracted text up to 80,000 characters; no OCR. DOCX expansion bounded. Source attribution is retained.
2. **Holly voice intake:** AI/browser-service consent, shared V1–V22 questions, automatic question → listening → spoken answer → next question. Users do not need to type or press Use this answer between spoken turns. Voice and typing share one reducer. Final review/approval is still required. Microphone is off while Holly speaks; Speak now / Interrupt Holly permits a manual interruption or retry. This is not simultaneous acoustic barge-in.
3. **Reference choices:** Visible examples before the answer field. Holly reads up to three; “hear options” or Hear all examples reads the full list. Users can answer freely, combine ideas, or skip. Original intake photos were not available: options use blueprint choices plus clearly documented adapted examples, not an exact photo transcription.
4. **Personalization:** Only confirmed current context reaches Reflection and Keep Talking; original personal summary is now connected too. Uncertain/historical items are excluded. Raw wording and reviewed wording stay distinct. Context is session-only by default, with separate opt-ins for unfinished intake and approved context in unencrypted device storage. No account/cloud synchronization claim.
5. **Entry:** Arrival → Personalize SHIFT, or Memory → Import reports or talk with Holly. Existing office/cinematic assets were preserved.

## Code map
- `src/holly/questions.ts`: shared prompts, reference options, spokenQuestion helper.
- `src/holly/intakeReducer.ts`: progress, skip/back, correction history, review, commands.
- `src/holly/HollyIntake.tsx`: interface, automatic spoken-answer submission, review admission.
- `src/holly/{voiceProvider,browserVoiceProvider}.ts`: replaceable speech contract and current browser implementation. Provider construction is in HollyIntake.tsx.
- `src/holly/safetyInterrupt.ts`: existing safety checks plus limited immediate-risk patterns; not clinically validated.
- `src/personalization/`: report parsing, local state, context records, review screen and styles.
- `src/context/AppContext.tsx`: owns shared intake/profile state and deletion integration.
- `server/personalContext.ts`: bounded confirmed-only prompt construction and source rules.
- `server/previewApi.ts`, `server/aiClient.ts`, corresponding `app/api/shift` routes: approved context delivery.
- `HOLLY.md`: detailed behavior, limits and manual acceptance steps.
- `docs/HOLLY_REPORT_IMPLEMENTATION.md`: original plan; this handoff supersedes stale progress statements.

## Next priorities discussed — proposed, not yet implemented
Work incrementally; confirm scope from Patrick's next request.
1. Verify voice permissions, automatic turns, pause/stop, corrections, mobile layout, report parsing, and draft resume using fictional data. Fix observed failures first.
2. Smooth Holly: pause tolerance, concise uncertainty clarification, clearer turn indicators and retry messaging. Preserve free answers and final consent; do not treat a recognition confidence score as factual certainty.
3. Optional consent-based AI report suggestions: show a proposed preference/goal/context beside its supporting excerpt; require approval. Add a bounded extraction route rather than activating old unsupported upload/account APIs.
4. Offer short intake versus complete intake, prioritizing entry reason, preferred support and response style.
5. Add “What SHIFT kept in mind” with correction and exclude-for-this-conversation controls.
6. Improve session/device save clarity and export/deletion UX. Final age policy, clinical safety review, locale resources and voice-provider retention terms remain open before real-user production release.

## Preserve the working AI setup
Patrick previously reported live AI working. This work did not modify API keys, model selection or provider routing. `server/config.ts` remains inherited. Model success was not independently reverified during this task; do not invent a working-model diagnosis or replace configuration based on model-name assumptions. Never ask Patrick to paste secrets into chat or commit secrets. Health/key presence and deployment success do not prove actual model output.

## Resume commands
```sh
git fetch origin
git switch integration/holly-report-import-2026-09-13
npm ci
npm run check:memory
npx oxlint src/holly src/personalization server/personalContext.ts
node --experimental-strip-types --test tests/second-brain.test.mjs tests/preview-api.test.mjs tests/runtime-import.test.mjs tests/personalization.test.mjs tests/holly-voice.test.mjs tests/report-import.test.mjs
npx vite build --config vite.preview.config.ts
```
Run only checks justified by the next changes; do not spend the new session repeating settled work. Terminal Git fetch worked but push lacked credentials. The authenticated GitHub connector successfully created trees/commits and advanced refs without force. Compare remote tree SHA to local tree before claiming exact preservation. No private reports or personal narratives were committed; the DOCX fixture is fictional.
