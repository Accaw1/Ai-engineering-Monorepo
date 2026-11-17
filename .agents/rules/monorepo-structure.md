---
name: monorepo-structure
description: Where every kind of code belongs in the Brasaland monorepo; forbids parallel app trees.
scope: always
alwaysApply: true
globs: []
---

# Rule: Monorepo structure and placement

**Scope: always active.** Applies to every session and every change, including docs.

## Canonical application paths

| Kind of code | Path | Notes |
| --- | --- | --- |
| Public corporate website (home `/`) | `uis/website` | Exists. Extend it; never start a second public site |
| Internal company app (own layout, entry `/`) | `uis/backoffice` | Create it **here** when the first internal feature arrives |
| Backend APIs / services | `services/<service>` | One centralized FastAPI app, planned `services/api/`, with domain routers |
| Shared domain logic / types | `packages/<package>` | E.g. `packages/brasaland-operations`, `packages/shared` |

## Must

1. **Read the folder's `README.md` before creating or editing anything in it.** If you create a subfolder, read the parent README too, and follow it.
2. Put each new app, service, package, agent or pipeline in **its own subfolder with its own `README.md`** (purpose, stack, how to run, how to test).
3. List new projects in the parent folder README (`uis/README.md`, `services/README.md`, …) and its `.es.md` mirror.
4. Extend the existing project before creating a new one. New internal features → `uis/backoffice`. New endpoints → the existing API in `services/`.
5. Use [`memory-bank/systemPatterns.md`](../../memory-bank/systemPatterns.md) as the decision table when you're unsure.

## Must not

- Create parallel trees: `apps/`, `frontend/`, `backend/`, `web/`, `client/`, `server/`, `src/` at root, `api/` at root, `uis/admin`, `uis/frontend`, `uis/dashboard` (when it belongs in backoffice), `services/backend`, or any duplicate of an existing project.
- Put product code at the repo root.
- Create a new top-level folder, or a new `uis/` or `services/` subfolder, without developer confirmation.
- Confuse the two meanings of "agents/skills": `.agents/` is **coding-agent config**, while `agents/`, `skills/` and `mcps/` are **product code** for Brasaland.

## How to verify

```sh
# No forbidden parallel trees at the root
ls -d apps frontend backend web client server src api 2>/dev/null && echo "VIOLATION" || echo "ok"
# Every project folder has a README
for d in uis/*/ services/*/ packages/*/; do [ -d "$d" ] && [ ! -f "$d/README.md" ] && echo "missing README: $d"; done
# Known pre-existing exception: packages/shared (protected; tracked in memory-bank/techContext.md)
```
