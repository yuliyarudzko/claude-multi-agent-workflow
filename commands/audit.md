---
description: Run the full quality workflow on an Express API — parallel review + coverage map, then write the missing tests, then report.
argument-hint: "[api-folder] (default: course-api)"
---

Run the api-quality workflow on the API in `$ARGUMENTS` (if empty, use `course-api`). Call that folder TARGET. Every subagent must work inside TARGET; tell each one the path explicitly.

## Step 1 — Inspect in parallel

Launch these two subagents **at the same time, in a single message** — they only read code and do not depend on each other:

- `code-reviewer` — review `TARGET/server.js`, `TARGET/routes/` and `TARGET/db/` against `TARGET/CLAUDE.md` and `TARGET/docs/api.md`.
- `coverage-mapper` — map which endpoint branches in TARGET are covered by `TARGET/tests/`.

Wait until **both** have returned before going on.

## Step 2 — Write tests (depends on Step 1)

Merge the two reports into one to-do list: every `missing` row from the coverage map plus every line under "Behaviours a test should pin down" from the review. Drop duplicates.

If the list is empty, skip to Step 3. Otherwise launch the `test-writer` subagent once, passing it TARGET and the full merged list. It must not touch application code.

## Step 3 — Report

Do not call any more subagents. Reply to the user with:

1. **Review findings** — the reviewer's table, unchanged.
2. **Coverage** — total before (from the coverage map) and the tests the test-writer added.
3. **Suite result** — the test-writer's `npm test` summary.
4. **Bugs to fix** — reviewer findings of high severity and any bugs the test-writer marked `todo`, each with a one-line suggested fix. Do not fix them yourself; leave that decision to the user.
