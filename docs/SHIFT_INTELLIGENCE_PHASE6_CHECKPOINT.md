# SHIFT Intelligence v2 — Phase 6 Checkpoint

Date: 2026-09-14

## Recovery point

- Working branch: `integration/shift-intelligence-v2-2026-09-14`
- Validated code SHA: `e0fececd74f9726e19f9c5b4f2336770f43ed796`
- Frozen checkpoint branch: `checkpoint/shift-intelligence-phase6-2026-09-14`
- Earlier pre-Phase-6 checkpoint remains available at `checkpoint/shift-intelligence-v2-2026-09-14-0637z`.

The temporary validation PR #30 was used only to trigger GitHub Actions and was closed without merge after validation.

## Validation status

GitHub Actions run 99 completed successfully for the validated code SHA. The following all passed:

1. dependency installation;
2. learning-memory architecture checks;
3. focused runtime and regression tests;
4. SHIFT intelligence behavioral regression tests;
5. preview continuity tests;
6. Vercel preview build.

A prior validation run exposed two stale test assumptions about personalization context. Those tests were corrected to reflect the intended relevance-gated behavior rather than weakening the implementation.

A local pure-logic test also exposed a motive-certainty regex gap for phrasing such as “reacted that way because.” The guard was corrected before the successful CI run.

## Phase 6 behavior now implemented

### Response orchestration

SHIFT routes a request into one of six modes:

- WITNESS
- UNDERSTAND
- RESEARCH
- PROCESS
- PRACTICE
- THERAPY_PREP

Explicit witness requests outrank research and problem-solving. Processing and therapy-prep requests receive distinct instructions rather than generic chat behavior.

### Evidence discipline

The AI is instructed and tested to separate:

- current direct user report;
- observed/current event description;
- user interpretation;
- working hypothesis;
- historical stored learning;
- external/scientific evidence;
- unknown information.

Behavior creates hypotheses, not verdicts. Motive certainty, unsupported diagnosis, fabricated citations, and subjective-state overcertainty are guarded before display.

### Feel before explain

When explanatory or motive-focused language appears before a named emotion, the orchestration layer can gently return attention to the user's internal experience without treating intellectualization as pathology.

### Professional / therapy learning

Professional learning is a first-class memory type rather than ordinary generic memory.

- Relevant lessons are retrieved only when active, user-confirmed, and semantically/lexically relevant.
- Source type is preserved: therapist, counselor, recovery support, or medical professional.
- A new professional lesson is offered for storage only when the user's current message explicitly attributes a lesson to a professional and contains learning/practice language.
- The model cannot silently store the lesson.
- The user must explicitly choose `Remember lesson`.
- When a professional lesson suggestion is valid, it wins over generic memory so the same statement is not stored in two epistemically different places.

### Generic learning-memory validation

Model-proposed generic memories are now server-sanitized before display.

- memory type is allowlisted;
- labels, summaries, and tags are bounded and normalized;
- untested advice cannot be labeled `HELPFUL_STRATEGY`;
- a `CONFIRMED_PATTERN` without user-confirmed confidence is rejected;
- professional learning is kept out of this generic channel.

### Personal-context retrieval

Confirmed personal context is relevance-gated. The app no longer injects a full approved profile into every prompt merely because it exists.

Current statements and corrections outrank stored context. Pending, historical, invented-source, or oversized context is not promoted into the active prompt.

### External research

External factual research is separated from personal reflection.

The search planner sends only:

- a broad public topic; and
- generalized factual propositions.

It does not send raw names, workplaces, case numbers, street addresses, private quotations, or private narrative to web search. A controlled jurisdiction such as Ohio may be retained when it is materially required for a legal question.

The research layer prioritizes peer-reviewed research, systematic reviews, clinical guidelines, government sources, academic institutions, professional organizations, and high-quality secondary material. If grounded research is unavailable, SHIFT is instructed not to invent support.

### Continuity with professional care

Keep Talking can create a user-controlled continuity artifact containing:

- what happened;
- what the user noticed;
- fact versus interpretation;
- possible pattern or rejected explanation;
- relevant prior professional lesson;
- experiment tried or planned;
- observed result;
- what remains unknown; and
- questions for the next session.

Continuity can be retained locally and, where account storage is available, in durable account storage. Therapy Prep loads the newest available saved continuity note.

### Preview honesty

The Vercel preview runtime does not pretend it has account persistence. Professional lesson and continuity endpoints explicitly report `accountRequired` rather than falsely reporting a successful durable save.

## Important files

- `lib/shift-behavior-policy.ts`
- `lib/shift-intelligence-types.ts`
- `lib/continuity-artifact.ts`
- `server/responseOrchestration.ts`
- `server/shiftConversationOrchestrator.ts`
- `server/researchEngine.ts`
- `server/qualityGuard.ts`
- `server/therapyLessonContext.ts`
- `server/therapyLessonStore.ts`
- `server/memorySuggestion.ts`
- `server/continuityStore.ts`
- `server/personalContext.ts`
- `app/api/shift/conversation/route.ts`
- `app/api/shift/breakdown/route.ts`
- `app/api/shift/therapy-lessons/remember/route.ts`
- `app/api/shift/continuity/remember/route.ts`
- `app/api/shift/continuity/latest/route.ts`
- `src/components/reflect/KeepTalkingScreen.tsx`
- `src/components/therapy/TherapyPrepScreen.tsx`
- `tests/shift-intelligence.test.mjs`
- `tests/preview-api.test.mjs`
- `tests/preview-continuity.test.mjs`

## Next recommended phase

Phase 7 should focus on evidence accumulation rather than adding more prompt text:

1. promote a repeated working hypothesis to a user-confirmed pattern only through explicit user confirmation and evidence;
2. connect predictions to real-world outcomes and let outcomes update confidence;
3. allow professional lessons to be edited, superseded, archived, and reviewed by the user;
4. rank helpful strategies by user-reported outcomes rather than model preference;
5. expose a concise transparency view showing which current facts, prior learning, and professional lessons influenced a response without exposing hidden chain-of-thought;
6. add adversarial regression cases for overpersonalization, stale memory, motive certainty, boundary invalidation, substance-use framing, and research/source failures.

Do not merge the intelligence branch into `main` solely because this checkpoint is green. The branch is validated as an isolated intelligence upgrade; integration with the current visual/deployment baseline should be reviewed separately.
