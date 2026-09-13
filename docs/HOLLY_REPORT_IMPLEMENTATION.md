# Holly and report import implementation — 2026-09-13

## Baseline and scope
Branch: integration/holly-report-import-2026-09-13, based on 9c0ca0b (integration/second-brain-2026-09-12 / PR 27). Main is older. Preserve the approved office, scroll, live conversation, and provider configuration. User reports AI is working; this environment cannot independently verify that yet. Vercel connector recognizes the team but lists no projects and returns project 404. GitHub PR 27 reports a Ready deployment.

The supplied HOLLY.md and coding brief reference starter TS/TSX files that were not attached or present in this branch. Implement against the existing React/Vite preview application, not the assumed Next-only stack. Blueprint V0–V24 governs intake. Report imports are separately authorized by the current request even though Holly alone does not retrieve medical records.

## Milestones
1. Checkpoint this plan before code edits.
2. Shared reviewed personal-context records: explicit source, raw excerpt/answer, current status, time, correction linkage. Nothing activates without approval; session default, optional unencrypted device persistence. Connect approved context to preview and app reflection/conversation handlers. Keep current request above past context.
3. Local report parsing: TXT, Markdown, CSV, JSON, text PDFs and DOCX. No raw-file server storage or automatic account-import calls. Review excerpt, edit, approve, remove, mark historical/uncertain. Reject unsupported, oversized, unreadable and scanned documents with copy/paste alternative. Bound active prompt size without silent truncation.
4. Holly V0 disclosure/consent, V1–V22 questions, V23 review, V24 explicit admission. One shared reducer for voice and typing, replaceable browser adapter, captions, skip/back/repeat/correct/pause/end, explicit speech input gesture, failure fallback. Preserve correction history until removal. Optional device draft saving; no raw audio recording by SHIFT. Explain browser provider processing.
5. Test state/consent/deletion/limits and API propagation; build actual Vercel target; browser-check real app desktop/mobile and mocked speech lifecycle. Document real microphone and deployment verification limits honestly. Push isolated branch and draft PR; no production promotion.

## Planned files
New: src/holly/{questions,intakeReducer,voiceProvider,browserVoiceProvider,HollyIntake}.*; src/personalization/{model,usePersonalization,ReportImport,PersonalizationScreen,readReport}.*; tests for reducer, import, API and browser flows; handoff.
Modify: src/context/AppContext.tsx; src/App.tsx; HomePage; PersonalSummary; SourceImportCard; KeepTalkingScreen; server/previewApi.ts; server/aiClient.ts and relevant app routes; package files; CI validation.

## Release decisions still open
Production age policy, clinical safety review, locale guidance, retention terms, final voice vendor and voice-owner license remain open as the blueprint requires. The generic voice is a demo; browser recognition can use remote services and must not be described as guaranteed local/private. Existing safety heuristic is not clinically validated. This branch is a review/demo integration, not production approval.
