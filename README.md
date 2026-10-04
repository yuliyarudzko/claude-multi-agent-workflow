# api-quality — a Claude Code plugin

A code-quality workflow for small Express APIs. One command reviews the code and maps test coverage **in parallel**, then hands both reports to a test-writer that adds the missing tests and runs the suite. A hook lints every JavaScript file Claude touches.

This repo is both the plugin and the marketplace that offers it. `course-api/` is the sample API the plugin is tested against.

## Install

```
/plugin marketplace add yuliyarudzko/claude-multi-agent-workflow
/plugin install api-quality@rudzko-tools
```

Or load it from a local checkout without installing:

```
claude --plugin-dir .
```

## What's inside

| Component | Name | What it does |
|-----------|------|--------------|
| Command | `/api-quality:audit [folder]` | Runs the whole workflow on an API folder (default `course-api`). |
| Subagent | `api-quality:code-reviewer` | Read-only review against `CLAUDE.md` and `docs/api.md`. Sonnet. |
| Subagent | `api-quality:coverage-mapper` | Read-only map of endpoint branches vs. existing tests. Haiku. |
| Subagent | `api-quality:test-writer` | Writes tests in `tests/` and runs `npm test`. Never edits app code. Sonnet. |
| Skill | `api-quality:api-test-conventions` | How tests are laid out and what every endpoint must cover. |
| Hook | `PostToolUse` on `Write\|Edit\|MultiEdit` | Runs the project's own ESLint on the edited `.js` file; errors go back to Claude. |

## The workflow

```
/api-quality:audit course-api
        │
        ├─► code-reviewer  ─┐   (parallel, read-only)
        └─► coverage-mapper ┘
                 │  both reports merged into one to-do list
                 ▼
            test-writer          (sequential — needs both reports)
                 │
                 ▼
            final report: findings · coverage · npm test result · bugs to fix
```

## Layout

```
.claude-plugin/
  plugin.json          # manifest (name, version)
  marketplace.json     # marketplace catalog listing this plugin
agents/                # code-reviewer, coverage-mapper, test-writer
commands/audit.md      # the workflow command
skills/api-test-conventions/SKILL.md
hooks/hooks.json       # uses ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/lint-on-edit.js
course-api/            # sample Express API to run the plugin against
```

## Versioning

The version lives in `.claude-plugin/plugin.json` (and is mirrored in `marketplace.json`). Bump it on every release so `/plugin` picks up the update.

See [NOTES.md](NOTES.md) for the design decisions.
