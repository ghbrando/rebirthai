---
pr: 58
issues: []
date: 2026-11-19
branch: ci/workflow-sync
merge_commit: d6d0e69
author: lead-chief-of-staff (record backfilled at release v0.2.0)
ids: []
areas: [.claude/hooks/guard.check.mjs]
type: infra
status: merged
---

# Guard tests now fail CI when a case is wrong

## Summary
The agent safety-guard test script printed wrong cases but always exited 0, so the CI step could
never fail. It now exits 1 when any case is wrong.

## Context
The guard (`.claude/hooks/guard.mjs`) blocks agents from pushing to `staging`/`main` and reading
secret files; its tests run in CI since #56.

## What changed
- `.claude/hooks/guard.check.mjs`: sets a failing exit code when any case is wrong (one line).

## Decisions and alternatives
None beyond the fix.

## Assumptions and open questions
None.

## Interfaces, data and configuration
None.

## Verification
An older guard fails the check; the current guard passes all 29 cases. CI green on the PR.

## Known limitations and follow-ups
None.

## Risks and rollback
Revert the one line.

## Notes for future agents
When you change `guard.mjs`, add a case to `guard.check.mjs`.

## Related
[#56](2026-11-17-pr-56-agent-roles.md), [#32](2026-10-27-pr-32-review-findings.md).
