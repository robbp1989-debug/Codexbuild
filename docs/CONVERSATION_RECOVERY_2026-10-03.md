# Conversation delivery recovery

Base publication: version 10, source `ecd24247706f608219f048553bfa6b4fea65b83b`.
Existing owner-private project: `appgprj_6aa0ac360e408191adb888e038295a44`.

## Observed failure and limits of diagnosis

The owner reported that chat worked for two turns, then displayed the browser's message: "The live conversation could not be reached...". That message comes from a failed HTTP request, response decoding or browser processing, rather than the server's separate provider-unavailable reply.

Native logs showed a successful private source upload at 2026-10-03T15:14:35.468Z (HTTP 200), followed by source-history read (HTTP 200). Conversation requests at 15:16:19.390Z and 15:17:18.868Z also completed HTTP 200. The inspected logs did not establish the failing third request's cause. HTTP 200 alone does not prove a successful AI reply. No key, quota, moderation, sharing or memory-loss cause was established, and no claim should be made that the root cause was confirmed.

## Changes

- Automatically retry transient connection, server, timeout or invalid-response failures once. Do not automatically repeat sign-in failures, rejected requests or rate limits.
- Provide **Retry message** for remaining transport failures and explicit provider-unavailable replies. Reuse the original message/context; do not append a duplicate user turn. Replace the failed status with the actual returned answer after recovery.
- Distinguish sign-in, rate limit, request rejection, timeout, invalid response and connection failures. Show bounded status/request-reference details without exposing error bodies, user content or secrets.
- Send only the Shift snapshot fields actually used by the conversation engine, plus bounded text history. Exclude raw-source/provenance metadata and failed assistant status banners from later conversational input. Server filtering also protects older clients.
- Lock concurrent submissions while a request is in flight. Requests are bounded; no unlimited retry loop or invented fallback interpretation is added.
- Return private/no-store conversation responses with an opaque request reference. Server exception logs expose only the request reference, processing stage and sanitized error name.

Existing full-history source retrieval, single bulk approval, genuine learning, therapy lessons, provider configuration, private audience and current design remain. No account memory or source was written/deleted as a repair/test side effect.

## Verification

Architecture validation and all 122 core tests passed. Eight new behavioral tests cover a failing third request after two successes, bounded retry, network/invalid JSON responses, sign-in/rejected/rate-limit distinctions, manual retry without duplicate user turns, minimal request payload and status exclusion, transparent provider/safety responses, production route history filtering, private response headers and non-sensitive error correlation. New test fixtures are fictional and local only.

TypeScript check produced no findings in changed product files; existing QA/Playwright and PredictionLabScreen findings remain. Dependency inputs were unchanged, so the previously recorded 13 audit vulnerabilities remain outside this repair. Preview and production Worker builds are required by the publishing workflow; results are reported in the handoff.

No authenticated browser reproduction of the original failure or live retry has been completed. The owner is using their own signed-in Chrome; the agent did not substitute another identity or bypass authentication. A post-publication live message/retry is still needed to establish recovery in that browser. An old loaded page must refresh to use the new client; its in-progress conversation exists in component state, so copy any needed message before that first refresh. Already saved sources/learning persist independently.

## Changed files and rollback

Product: `src/components/reflect/conversationRequest.ts`, `src/components/reflect/KeepTalkingScreen.tsx`, `app/api/shift/conversation/route.ts`.
Validation: `tests/conversation-recovery.test.mjs`, `package.json` (test command only).
Checkpoint: this file.

Rollback: privately redeploy saved version 10:
`appgprj_6aa0ac360e408191adb888e038295a44~appgver_952a127fccf081918e5520be806e1b7f`.
That restores the prior conversation client/route while retaining account sources, learning, and the version-10 large-report repair.
