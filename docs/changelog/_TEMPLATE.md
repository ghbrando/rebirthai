---
pr: <number>                 # GitHub PR number
issues: [<numbers>]          # Issues this PR closes or advances
date: <YYYY-MM-DD>           # merge date (opening date until merged)
branch: <feature/...>
merge_commit: <sha or "pending">
author: <agent role(s) and/or human>
ids: [<design IDs, e.g. US-07, RC-09, DD-04>]
areas: [<components/paths touched, e.g. lib/media, app/api/upload-url>]
type: feature | fix | refactor | docs | infra | security
status: merged | open | reverted
---

# <Title: what changed, in plain words>

## Summary
<2-4 sentences: what a user or reviewer can now do or see, and why it mattered.>

## Context
<The problem or Issue this answers, the acceptance criteria it targeted, and what existed before.>

## What changed
<By area. Name the key files, functions, routes, components and tables, and what each now does.
Enough that a future agent can find the code without re-reading the whole diff.>

## Decisions and alternatives
<Each meaningful choice, the alternatives considered, and why this one won. This is the most
valuable section for future agents: it stops them from "fixing" a deliberate decision.>

## Assumptions and open questions
<What was assumed without confirmation, and anything left for the owner (with decision IDs).>

## Interfaces, data and configuration
<Schema/migrations, API shapes, types, env vars, feature flags, permissions, dependencies added or
removed. "None" if none.>

## Verification
<Commands run and results, tests added (paths), manual and device checks, screenshots/GIF.>
![Demo](<commit-pinned link to docs/changelog/assets/<entry-stem>/demo.gif>)

## Known limitations and follow-ups
<What this does not do yet, with linked Issues.>

## Risks and rollback
<What could break, how it would show up, and how to undo it.>

## Notes for future agents
<Gotchas and invariants: "if you change X, also update Y"; non-obvious coupling; things that look
wrong but are intentional; where tests for this live.>

## Related
<Links to earlier changelog entries, design sections, ARCHITECTURE/POLICY rules.>
