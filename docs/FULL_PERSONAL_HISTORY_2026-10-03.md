# Full personal history and one-approval import

Base publication: version 8, source `2be85b109a2fb01b21797015cc092aaab6cb4ae1`. Existing owner-private SHIFT project retained. This supersedes the earlier compact-only report workflow for users choosing full-history import.

## Resulting behavior

- Default report import has one explicit **Approve and remember full history** action for the complete text. No section-by-section approval is required. Compact learning review remains an optional mode for smaller items.
- Private R2 source text is indexed without summarizing or anonymizing. Every source character remains represented. Names, relationships, events and evidence labels survive.
- Reflections and Keep Talking automatically search approved account history. Selected quoted passages enter the model separately from compact learning and professional lessons. Public provenance identifies actual source sections.
- Sensitive history requires relevant topic cues and evidence signals. Shared dinner/function words must not retrieve trauma. Query corrections suppress stale history. Optional semantic retrieval has lexical fallback.
- Personal updates are stored verbatim, dated and attributed as direct user reports. They can be removed. Source retrieval can be disabled independently of compact learning. Source deletion removes source bytes, draft review and detailed-history index.
- The existing uploaded source was explicitly authorized by the owner in chat, so it is opted in using its exact opaque source ID. It is lazily indexed on the next authenticated request; other existing files are not silently opted in. Trusted account ownership still gates every source access.
- No personal report contents, sensitive updates, API credentials, user IDs or browser cookies were put in repository source. No API-key, access-policy or schema changes were required.

## Validation

- Base version 8 had 104 passing core tests and both builds passed.
- Eight added behavioral tests verify complete source preservation, short-message specific recall, unrelated exclusion including misleading vector similarity, current corrections, single-approval full import, account persistence across fresh reads, disable/delete/account isolation, verbatim update lifecycle, and Keep Talking's separate history input/provenance.
- A local check using the supplied report selected the adult assault/childhood powerlessness section and dog identity section for a short dog/brother/voice/drink query. An unrelated dinner query selected no history. This is local source-selection verification, not hosted model-response verification.
- Production personal-source bytes and completion metadata were observed read-only. Existing genuine learning and all six baseline records remained present. Five owner-saved compact entries also remained untouched.
- Hosted detailed indexing and a fresh related/unrelated model-response check remain pending the owner's Chrome refresh/next authenticated request. No synthetic scenarios were saved remotely.
- Pre-existing audit findings: 13 vulnerabilities (2 moderate, 11 high). Dependencies unchanged. Existing QA/Playwright and PredictionLabScreen TypeScript findings remain outside this change.
- Rollback: privately redeploy version 8 using the existing environment. Stored source text and learning survive rollback; version 8 does not use the new detailed-history index.

Changed product paths: `server/detailedHistoryContext.ts`, `server/detailedHistoryStore.ts`, `server/semanticMemory.ts`, `server/accountMemoryControls.ts`, `server/aiClient.ts`, `server/shiftConversationOrchestrator.ts`, `server/influenceSummary.ts`, `app/api/shift/source/history/route.ts`, `app/api/shift/source/upload/route.ts`, `app/api/shift/breakdown/route.ts`, `app/api/shift/conversation/route.ts`, `app/privacy/page.tsx`, `src/personalization/PersonalHistoryControls.tsx`, `src/personalization/ReportImport.tsx`, `src/components/memory/AccountMemoryPanel.tsx`, `src/components/memory/SourceImportCard.tsx`, `src/components/home/HomePage.tsx`, `src/components/reflect/KeepTalkingScreen.tsx`, `src/components/reflect/MemoryInfluencePanel.tsx`, `src/types/index.ts`. Validation/documentation: `tests/detailed-history.test.mjs`, `package.json`, `docs/LEARNING_MEMORY_ARCHITECTURE.md`, this checkpoint.
