# Progress — State of Development

Last updated: 2026-11-25

> What exists, what works, what's next. Update this file in the same branch as any change to product folders (enforced by the [`update-memory-bank`](../.agents/skills/update-memory-bank/SKILL.md) skill).

## Completed

| Date merged | Milestone | Deliverable | Paths |
| --- | --- | --- | --- |
| 2026-11 | M0 | Company chosen (Brasaland). `CONTEXT.md` replaced with the Brasaland context | `CONTEXT.md`, `company-choice.md` |
| 2026-11 | M1 — Web | Public website: landing, 14 locations, dietary options, Brasa Points signup with email offers, contact form (local validation only) | `uis/website` |
| 2026-11 | M2 — Programming fundamentals | Operations core for Felipe Guerrero: types, filters, search, multi-currency financials, location scoring, reports, validations, tests, test page, 14-restaurant sample data | `packages/brasaland-operations`, `BRIEFING.md` |
| 2026-11 | M3 — Frontend app | Talent Pipeline Tracker for Ashley Turner (Executive Assistant search) on the external Talent Tracker API | `uis/talent-pipeline-tracker` |
| 2026-11-17 | M4 — Agent infrastructure | Memory bank, `AGENTS.md`, scoped rules and the `update-memory-bank` skill (PR #3) | `memory-bank/`, `AGENTS.md`, `CLAUDE.md`, `.agents/` |

## In progress

| Started | Milestone | Deliverable | Paths |
| --- | --- | --- | --- |
| 2026-11-25 | M5 — Backend architecture | Backend architecture proposal for the central API: layered modular monolith in one FastAPI app, domain routers under `/api/v1`, folder structure, frontend/backend separation (CORS, env vars), risks. Documentation only, no code. Awaiting CTO review | `docs/ARCHITECTURE_PROPOSAL.md`, `docs/README.md` (+ `.es.md`) |

## What works today

- Website builds and its validation tests pass (`uis/website`: `npm test`, `npm run build`).
- Operations package typechecks and its test suite passes (`packages/brasaland-operations`: `npm run check`).
- Talent Tracker lints and builds against the public API (`uis/talent-pipeline-tracker`).

## Not built yet

- `uis/backoffice`: no internal app yet.
- `services/`: no backend. Nothing persists data, and the website forms are local-only.
- No data pipelines, agents, MCP servers, workflows, infra or root `docker-compose.yml`.

## Planned next steps (in rough priority order)

1. CTO review of [`docs/ARCHITECTURE_PROPOSAL.md`](../docs/ARCHITECTURE_PROPOSAL.md) and answers to its open questions (§10). Record accepted points as `D#` rows in `techContext.md`.
2. **Central API** in `services/api/` (FastAPI), following the accepted proposal: locations, menus and sales endpoints, with the M2 domain rules kept in sync through shared test vectors.
3. **Backoffice** in `uis/backoffice`: operations sales dashboard per location in USD + COP (Felipe), then the executive overview (Mariana).
4. Data pipeline from POS/spreadsheet exports: `data/raw` → `data/pipelines` → `data/process`.
5. Automations in `workflows/`: no-sales alert during opening hours, and the weekly report every Monday at 7am.
6. AI layer in `agents/`: executive natural-language assistant, ingredient demand forecasting, menu personalisation.

## Known problems

- See "Known issues / tech debt" in [`techContext.md`](./techContext.md).
