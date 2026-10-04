---
name: api-test-conventions
description: Conventions for writing tests for small Express APIs that use node:test and supertest with an in-memory store. Use when adding or reviewing endpoint tests, e.g. "write a test for POST /users", "how should tests be structured here?", "cover the 400 case".
---

# API test conventions

Apply these rules whenever you write or review tests for an Express API like `course-api`.

## File layout
- One test file per resource: `tests/<resource>.test.js` (e.g. `tests/users.test.js`).
- Tests run with `npm test` (`node --test`), which picks up every `*.test.js` file.

## Skeleton
```js
const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../server');
const store = require('../db/store');

test.beforeEach(() => store.reset());
```
- Import the app from `../server` — it does not call `listen()` when required, so no port is opened.
- Always `store.reset()` in `beforeEach` so every test starts from the seed data (users 1 and 2).

## One behaviour per test
- Name the test after the request and the outcome: `'POST /users returns 400 when email is missing'`.
- Assert the **status first**, then the body: `assert.equal(res.status, 400)` then `assert.ok(res.body.error)`.
- Error bodies have the shape `{ "error": "message" }` — assert that `error` is a string, not the exact wording, unless the wording is part of the contract.

## What every endpoint needs
For each route cover at least:
| Branch | Example |
|--------|---------|
| happy path | `GET /users/1` → 200 with the user |
| missing record | `GET /users/999` → 404 |
| invalid input | `POST /users` without `email` → 400 |
| state change visible | after `POST /users`, `GET /users` has 3 items |

## Known bugs
If a test reveals a bug in application code, do not fix the app from a test task. Keep the test and mark it:
```js
test('GET /users/abc returns 404', { todo: 'bug: non-numeric id' }, async () => { ... });
```
