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
3. Choose voice and approve consent. Hear the prompt. Press **Answer by voice / Interrupt Holly**, speak, check the visible transcript, then **Use this answer**. Reject microphone permission and verify typing works.
4. Skip, repeat, back/correct, pause/end, resume, and remove at review. Keep one item, mark another historical/uncertain, confirm; only kept items should influence a new fictional reflection.
5. Save draft deliberately; refresh and resume at the same question. Remove context and confirm future requests omit it.
6. Import small TXT/DOCX and a text PDF; use scanned PDF and corrupted files to check readable errors. Approve an excerpt; no file or unapproved text should appear in outgoing requests.
7. Use fictional urgent-risk text; questionnaire must pause and existing emergency guidance must appear.
8. Run two fictional live messages against the actual preview to verify model operation and personalization. Do not use sensitive real records for this check.

## Honest limitations and production gates
- Browser visual/E2E and real microphone checks were not completed in this environment: agent-browser daemon did not start; the supported cloud browser blocked the local development URL. Unit/provider mocks are not substitutes for real-device checks.
- The Vercel connector returns no projects/project 404 despite recognizing the account. GitHub PR deployment status is the available deployment evidence; do not claim a live verified demo merely from a Ready build.
- Voice currently uses button-initiated listening and button barge-in, with transcript confirmation for each answer. It is not a hands-free realtime agent. Spoken commands work while listening. Automatic acoustic barge-in, robust silence handling, semantic normalization and conversational clarification remain future work.
- Speech output availability and female-sounding voice choice vary by browser/OS. No guarantee of offline audio processing. PDF parsing is built but still needs browser-file verification. There is no OCR, account sync, clinical report authentication, or autonomous medical-record retrieval.
- Safety uses SHIFT's existing heuristic plus a few explicit immediate-medical/danger phrases. It is not clinically validated and may over-trigger or miss risks. Production clinical review, age/under-18 policy, locale resources, retention/provider terms, final wording/usability, and future voice-owner consent/license remain open, as required by the blueprint.
- This is an isolated draft integration; no merge to main or production promotion is authorized by this handoff.
