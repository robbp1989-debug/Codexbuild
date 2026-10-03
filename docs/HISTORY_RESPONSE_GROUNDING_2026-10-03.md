# Retrieved history must inform the actual reply

Base publication: version 11, source `0a2ec830543c136896dc8702311c866fcb48af61`.
Project: `appgprj_6aa0ac360e408191adb888e038295a44`. Owner-only audience, design, secret, bindings and approved source/learning records preserved.

## Confirmed problem

The owner supplied screenshots showing a generic childhood/family answer. Expanded provenance listed the relevant sections from both approved private reports. This establishes that relevant history was supplied to the conversation engine; the reply did not use its specific reported details. Local retrieval with the same short question also selected the relevant source sections. This is a response-use failure, not evidence that the report failed to upload.

Code inspection also showed that the existing quality-revision call dropped much of the original conversation, approved context, reflection and compact learning. The revision now retains the complete original input and system contract. This is a confirmed context-loss path; whether it generated the specific screenshot's answer was not independently observable.

## Behavior

- Personal-history reply instructions explicitly distinguish acknowledging existing attributed reports from recovering an unknown memory or proving a clinical cause. Generic uncertainty must not replace the concrete associations the user has already reported.
- Selected source data includes stable passage IDs. The model supplies short exact source and reply excerpts for the connections it actually uses.
- The server verifies each source/passage ID against the selected passages, verifies excerpts occur in the source and displayed reply, and requires specific detail overlap beyond generic emotion/uncertainty words. No fabricated quote or another source ID is accepted.
- If a relevant history answer lacks valid references, one revision is requested with the full original context. If it still fails, the user receives a transparent history-use failure with the existing retry control. It is not mislabeled as a lost connection. Other response-quality safeguards remain enforced.
- Witness mode, an explicit history opt-out, absent relevant history and sources containing only abstract emotional context are not forced into autobiographical fact lists.
- Expanded response provenance distinguishes **history provided to the AI** from **report passages connected in this reply**, with source excerpts and the corresponding reply excerpts. These are evidence references, not hidden reasoning.
- No new account memory is automatically created and no existing source/learning record is edited or deleted.

## Validation and limits

Architecture validation and 130 core tests passed. Eight new behavioral tests cover specific versus generic history use, ordinary pet-name/birth-year recall, fabricated/absent-source references, witness/opt-out/no-history behavior, revision with complete original context, valid first-answer efficiency, transparent repeated grounding failure and unchanged diagnostic-certainty safeguards. Fictional local fixtures and mocked model responses only; no hypothetical test events were stored as genuine account history.

TypeScript check found no errors in changed product files; the existing unrelated QA/Playwright and PredictionLabScreen findings remain. Dependencies, lockfile, schema, API credentials and access settings are unchanged. Previously recorded dependency audit findings remain outside this repair. Both preview and production Worker builds are required by the publication workflow; their final results are reported in the handoff.

Grounding validation verifies references and lexical specificity; it is not a complete semantic entailment proof or a clinical finding. It may request revision for a useful paraphrase without matching details. Actual live provider output after deployment has not been verified by the agent. The owner must refresh their authenticated Chrome page and ask the same question, then expand provenance to verify the report-specific answer and source/reply excerpts. No second account or authentication bypass was used.

## Changed files and rollback

Product: `server/historyGrounding.ts`, `server/detailedHistoryContext.ts`, `server/shiftConversationOrchestrator.ts`, `app/api/shift/conversation/route.ts`, `src/components/reflect/KeepTalkingScreen.tsx`.
Validation: `tests/history-grounded-response.test.mjs`, `package.json` (test command only).
Checkpoint: this file.

Rollback: privately redeploy version 11:
`appgprj_6aa0ac360e408191adb888e038295a44~appgver_82bf71b0e7d48191972a128f7e2a7ac1`.
It retains large-report upload support and conversation recovery while reverting the new grounding checks. Account sources, approved learning and retrieval controls survive.
