# NOTES — api-quality plugin

## What it does

`api-quality` is a code-quality plugin for small Express APIs. Its main entry point is one command:

```
/api-quality:audit course-api
```

It reviews the API source, maps which endpoint branches have tests, writes the missing tests, runs the suite, and reports findings plus any bugs the new tests exposed. Around that workflow the plugin ships a skill with the test conventions (`api-test-conventions`) and a `PostToolUse` hook that runs ESLint on every `.js` file Claude writes or edits.

## How to install

From GitHub (this repo is also the marketplace):

```
/plugin marketplace add yuliyarudzko/claude-multi-agent-workflow
/plugin install api-quality@rudzko-tools
```

For local development, from the repo root:

```
cd course-api && npm install && cd ..
claude --plugin-dir .
```

then run `/api-quality:audit` and use `/reload-plugins` after edits. The lint hook needs ESLint installed in the target project (`npm install` in `course-api/`); without it the hook silently does nothing.

## Scoping decision: three agents, three different budgets

- **`code-reviewer` — `Read, Grep, Glob`, model `sonnet`.** A reviewer's job is judgement, not action. Giving it no `Write`/`Edit`/`Bash` means a review can never accidentally "fix" code the user has not agreed to change, and its output stays a report the user can trust. It gets Sonnet because spotting real bugs (e.g. a non-numeric id turning into `NaN`, contract drift from `docs/api.md`) needs reasoning across several files.
- **`coverage-mapper` — `Read, Grep, Glob`, model `haiku`.** Matching `router.get(...)` branches to `request(app).get(...)` calls in tests is a mechanical inventory. Haiku does it fast and cheaply; a stronger model would add cost without adding accuracy.
- **`test-writer` — `Read, Grep, Glob, Write, Edit, Bash`, model `sonnet`.** It is the only agent that changes files, and it needs `Bash` for one reason: to run `npm test` and check its own work. Its body restricts it further — tests only, never application code — so a test that exposes a bug is marked `todo` and reported instead of being "fixed" by bending the app.

## Orchestration decision: what runs in parallel and what waits

- **Parallel — `code-reviewer` + `coverage-mapper`.** Both only read the same code and neither needs the other's output, so running them together halves the wait. Being read-only also makes it safe: two agents reading at once cannot conflict.
- **Sequential — `test-writer` after both.** The test-writer's to-do list *is* the merge of the two reports: uncovered branches from the mapper plus "behaviours a test should pin down" from the reviewer. Starting it earlier would mean writing tests blind, and running it alongside the others would risk it editing `tests/` while the mapper is still reading them.
- **Final report in the main session.** The summary needs every result, so it comes last and calls no more agents; bug fixes are left for the user to approve rather than being applied automatically.
