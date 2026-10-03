# SHIFT version 12 recovery checkpoint — 2026-10-03

## Approved product source

- Sites project: appgprj_6aa0ac360e408191adb888e038295a44
- Live URL: https://shift-reflection-arcade.robbpc.chatgpt.site/
- Saved version: appgprj_6aa0ac360e408191adb888e038295a44~appgver_a7acbbdf7cec819189508cfaffacd8fb
- Sites source commit: c36982b0f63ac0ba73af9e9be295e0f91bdda1e8
- Exact source tree: 6b5c4ed7216c6166fcef978d90622e3feb1d52bb (301 tracked files)
- Sites deployment: appgdep_6ac1289115f48191818fd04223c72bb3
- GitHub mirror commit: 0ed913f34ef05a12fdedcdcf2028c1afbca91e4c
- GitHub release branch: codex/shift-sites-v12-2026-10-03

The GitHub mirror has a different commit ID because GitHub and Sites have distinct repository histories. Its tree ID matches the Sites commit exactly. No product files were changed for this backup. Main/master/integration branches were not merged or rewritten.

## Vercel code checkpoint

- Existing project: shift-office-workspace-preview (prj_CcrDGGWAIpAbdWbXjoVxWoqsIKl8)
- Team: team_ONez1PuJYiWWH9XPI1IlgH50
- Deployment: dpl_2dzMUZ8sMyQd4gEEDecR9Aiq54Hp
- URL: https://shift-office-workspace-preview-5jjskormk-patrick-robbs-projects.vercel.app/
- Source: GitHub mirror commit above; deployment state READY.
- Authorized HTTP checks on 2026-10-03: homepage 200; /api/health 200, ok:true, modelConfigured:true, accountMemoryAvailable:false.
- Existing Vercel authentication protection preserved.

Vercel is the existing preview adapter. Account-backed detailed history, D1 learning, R2 source files, and trusted Sites identity remain on Sites. This code backup is not an export of private user records or a migration of account storage to Vercel.

## Access and secrets

Sites access remains owner-only: custom policy revision 1, owner as sole allowed account, no editors, groups, or external visitors. Production secret configuration remains server-side at environment revision 2. No secret values, private reports, account memory contents, screenshots, or sign-in credentials are included in this checkpoint.

## Verified behavior and known incident

The approved version previously passed architecture validation, all 130 core tests, the Vercel preview build, and the Sites Worker build. The owner verified detailed personal recall in a full Chrome tab; the sidebar preview did not behave equivalently.

A later owner screenshot at approximately 19:58 UTC reported follow-up replies blocked by the history-grounding check. Production logs show /api/shift/conversation returned HTTP 200 with response-unavailable warnings at 19:56:44, 19:57:05, and 19:57:43 UTC. The screenshot specifically states report passages were retrieved but the reply failed the specific-history check. This is a reply-validation failure, not evidence of an API credential outage. The exact rejected model output is not present in existing logs, so the individual failing rule is not yet established.

Do not describe this checkpoint as fully reliable across consecutive turns. Preserve it as the user-selected recovery point while investigating a focused fix.

Pre-existing limitations remain: 13 production dependency vulnerabilities (2 moderate, 11 high); earlier TypeScript QA/PredictionLab findings are not fixed in this backup. A second physical device and automated local-file-picker selection have not been independently verified.

## Paused work

shift-paused-repairs-2026-10-03.patch captures the tracked edits and two new helpers from the interrupted repair attempt. It is UNTESTED, UNPUBLISHED, and excluded from the approved source tree and Vercel checkpoint. It touches initial reflection grounding/error display, opening-conversation provenance, provider diagnostics, and short-follow-up retrieval. Do not apply it automatically or deploy it as version 12.

To review it, create an isolated checkout at the Sites version 12 source or matching GitHub mirror, then run:
    git apply --check checkpoints/shift-paused-repairs-2026-10-03.patch
Review the diff before applying; rerun all required checks and behavior tests after any selected changes.

## Recovery

Restore the exact release branch/GitHub mirror above for code. For live Sites rollback, deploy the existing saved version 12 privately in the same project. Code rollback does not erase account memories. Do not create a replacement site, change the audience, duplicate approved reports, or treat test scenarios as genuine history.
