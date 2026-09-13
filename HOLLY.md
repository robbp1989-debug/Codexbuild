# Holly and report personalization — integration handoff

## Current implementation
Entry: Arrival → Personalize SHIFT; also Memory → Import reports or talk with Holly. The approved office/Keep Talking composition and cinematic assets were not edited.

Holly is an optional guided intake demo. V0 is explicit AI/browser-provider disclosure and voice consent; V1–V22 follow `src/holly/questions.ts`; V23 reviews each answer; V24 admits the explicitly kept answers. Typing and voice share `intakeReducer` inside `usePersonalization`, owned by AppProvider. Free-form answers remain verbatim; only exact offered options receive a structured value, all other normalization stays null. No inferred diagnosis or automatic profile extraction.

The replaceable interface is `src/holly/voiceProvider.ts`. Temporary English voice selection is in `browserVoiceProvider.ts`; the single provider construction is in `HollyIntake.tsx`. No new paid service or voice clone. Browser speech may use the browser vendor's remote processing. SHIFT does not record raw audio.

Report input supports TXT/Markdown/CSV/JSON, text PDFs and DOCX. Parsing is lazy-loaded, on device, plain text only. Users copy relevant text into editable excerpts and approve each one. This is deliberately manual excerpt selection, not AI report summarization. Original reports are not uploaded or durably stored. Source labels stay in local review; approved compact statements carry document-report provenance into prompts. PDF: 4 MB / 80 pages / 80,000 text characters; no OCR. DOCX: central-directory check limits expansion to 16 MB. A file may fail parsing; paste remains available.

`src/personalization/model.ts` records source, question, raw wording, reviewed wording, timestamp, status and correction linkage. Confirmed-only payload selection is repeated on the server. `server/personalContext.ts` bounds context and preserves attribution. Existing approved summary now also reaches both Reflection and Keep Talking. The two preview routes and equivalent app routes are connected. Existing model configuration and API keys were not changed.

## Persistence and deletion
Session-only by default. Two separate opt-ins: unfinished intake and approved context. Both use unencrypted localStorage, not account storage. Refresh discards session-only data; disclose this before choosing whether to save. Corrections through Back retain prior answers in draft history; Remove purges the question's draft history. Confirmed profile retains raw and reviewed wording. Historical/uncertain entries are excluded from prompts. Delete-all clears the new profile and intake keys; the existing full-data reset also clears them. Existing manually approved summary has its own removal control.

## Verification commands
```
npm ci
npm run check:memory
npx oxlint src/holly src/personalization server/personalContext.ts
node --experimental-strip-types --test tests/second-brain.test.mjs tests/preview-api.test.mjs tests/runtime-import.test.mjs tests/personalization.test.mjs tests/holly-voice.test.mjs tests/report-import.test.mjs
npx vite build --config vite.preview.config.ts
```
CI now watches main, master and integration PR targets and builds the actual Vercel preview target. Existing project-wide tsc errors in storage-check and older Playwright QA files predate this work. New modules are separately lint/type checked.

## Manual preview acceptance still required
1. Arrival/scroll/Keep Talking match the existing composition on desktop and mobile.
2. Choose typed intake, answer V1–V7, switch to Holly at V8. Check the transcript, continue, and verify all seven earlier answers remain at review.
3. Choose voice and approve consent. Hear the prompt, allow microphone access, and speak when Listening appears. Verify the next question follows without typing or pressing Use this answer. Use Speak now / Interrupt Holly to retry or interrupt. Reject microphone permission and verify the retry and typing options remain available.
4. Skip, repeat, back/correct, pause/end, resume, and remove at review. Keep one item, mark another historical/uncertain, confirm; only kept items should influence a new fictional reflection.
5. Save draft deliberately; refresh and resume at the same question. Remove context and confirm future requests omit it.
6. Import small TXT/DOCX and a text PDF; use scanned PDF and corrupted files to check readable errors. Approve an excerpt; no file or unapproved text should appear in outgoing requests.
7. Use fictional urgent-risk text; questionnaire must pause and existing emergency guidance must appear.
8. Run two fictional live messages against the actual preview to verify model operation and personalization. Do not use sensitive real records for this check.

## Honest limitations and production gates
- Browser visual/E2E and real microphone checks were not completed in this environment: agent-browser daemon did not start; the supported cloud browser blocked the local development URL. Unit/provider mocks are not substitutes for real-device checks.
- The Vercel connector returns no projects/project 404 despite recognizing the account. GitHub PR deployment status is the available deployment evidence; do not claim a live verified demo merely from a Ready build.
- Voice now automatically starts listening after each spoken question. A final spoken answer advances the shared intake without typing or pressing Use this answer. Say go back to correct an answer; final profile review is still required. Speak now / Interrupt Holly remains available to interrupt or retry. Stop cancels queued listening. Spoken commands work while listening. Simultaneous acoustic barge-in, robust silence handling, semantic normalization and conversational clarification remain future work.
- Speech output availability and female-sounding voice choice vary by browser/OS. No guarantee of offline audio processing. PDF parsing is built but still needs browser-file verification. There is no OCR, account sync, clinical report authentication, or autonomous medical-record retrieval.
- Safety uses SHIFT's existing heuristic plus a few explicit immediate-medical/danger phrases. It is not clinically validated and may over-trigger or miss risks. Production clinical review, age/under-18 policy, locale resources, retention/provider terms, final wording/usability, and future voice-owner consent/license remain open, as required by the blueprint.
- This is an isolated draft integration; no merge to main or production promotion is authorized by this handoff.

## Verified remote checkpoint — 2026-09-13
- Draft PR: https://github.com/robbp1989-debug/Codexbuild/pull/28
- Branch: integration/holly-report-import-2026-09-13
- Tested application commit: bd1366c341ba311ead989654c19f4b2decabc1de
- Exact tree match between tested local code and GitHub: 89d161a0c432f9aaccc4f1c19e4fa08ac14675ae.
- GitHub Validate SHIFT run 34774037999 completed successfully.
- Both Vercel projects reported successful deployment: shift-office-workspace-preview and shift-approved-keep-talking-preview. The primary office deployment ID is AhoYH7PSowdAfts1B559JxJmH1ss.
- Primary preview: https://shift-office-workspace-previe-git-194874-patrick-robbs-projects.vercel.app
- Direct browser inspection reached Vercel sign-in, not the app. The connector could not generate temporary access. Do not disable deployment protection to complete QA.
- No production promotion or main merge occurred. Do not change API keys or model routing just to test these UI upgrades.
- Terminal Git push lacked credentials; the authenticated GitHub connector saved the exact tested tree atomically. Local history was aligned with that remote commit while preserving local/holly-tested-307057a.

## Next implementation increments after preview review
1. Verify automatic spoken-answer turn-taking with real device audio and fix observed usability errors.
2. Add optional automatic turn-taking and constrained clarification; retain a visible microphone state and immediate stop. Do not claim acoustic barge-in without testing echo behavior on real hardware.
3. Add a consented, bounded AI-assisted report-candidate extraction route, if desired; candidates must retain source excerpts and remain inactive until review. This is distinct from the currently implemented manual excerpt selection.
4. Finish production clinical/age/privacy decisions from the blueprint before real-user release.

## Spoken-answer follow-up
The owner clarified that answering aloud must be the normal voice flow. Implemented automatic question → microphone → spoken answer → next question. The microphone is off during Holly playback to avoid transcribing her own voice. End-of-intake review remains explicit. Microphone-denied/unsupported browsers show a clear error and keep retry and typing options available. Real-device audio verification remains required.

## Intake reference choices
Added visible example choices above the answer field, with explicit permission to answer freely, combine ideas, or skip. Holly reads up to three examples after the question; say “hear options” or press Hear all examples for the complete list. Examples are drawn from the supplied blueprint where enumerated; identity, relationship, accommodation, recurring-pattern and interaction-preference examples are adapted starting points, not exact transcriptions of the original photos (those photos were not available in this workspace). Raw spoken/typed answers remain unchanged and free-form wording is not forced into an example label.
