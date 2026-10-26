---
pr: 22
issues: []
date: 2026-10-26
branch: docs/changelog
merge_commit: 081edcc
author: Lead agent
ids: []
areas: [CHANGELOG.md]
type: docs
status: merged
---

# Release changelog (CHANGELOG.md)

## Summary
Added a release-level changelog: version 0.1.0 for the MVP and an Unreleased section for work on
`dev` that has not reached `main`.

## Context
Owner wanted a readable "what's new per release" in addition to git history.

## What changed
`CHANGELOG.md` in Keep a Changelog format with Semantic Versioning; 0.1.0 dated 2026-10-24 and
linked to the closed Issues; Unreleased lists the Lab 3 work.

## Decisions and alternatives
- **Feature PRs add Unreleased lines; promotion stamps the version** (`release-candidate` skill),
  instead of writing the changelog only at release time from memory.
- **0.1.0 rather than 1.0.0**: the MVP's acceptance checks are unverified; 1.0.0 is the owner's call.

## Assumptions and open questions
None.

## Interfaces, data and configuration
None.

## Verification
Docs only; reviewed in the PR diff. Links were not separately checked.

## Known limitations and follow-ups
Superseded in part by per-PR change records (this folder): release lines now link here.

## Risks and rollback
Docs only.

## Notes for future agents
CHANGELOG.md is the short, user-facing summary; the detail lives in `docs/changelog/`.

## Related
[Lab 3 planning](2026-10-26-pr-21-lab3-planning.md)
