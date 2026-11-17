# System Patterns — Where Code Goes and How It Fits

Last updated: 2026-11-17

> Technical context: the monorepo map and placement rules. This file is enforced by [`.agents/rules/monorepo-structure.md`](../.agents/rules/monorepo-structure.md). Read the `README.md` of a folder before adding anything to it.

## Application layer (canonical paths — do not invent alternatives)

| Path | What goes here | Status | Rules |
| --- | --- | --- | --- |
| `uis/website` | **Public corporate website.** Home route `/`. Brand and copy aligned with `CONTEXT.md`/`BRIEFING.md` | **Exists** (Vite + Tailwind) | All public pages go here. Don't start a second public site |
| `uis/backoffice` | **Internal company app** with its own layout, separate from the public site. Entry view on `/`. Home for operations, procurement, HR, training and executive dashboards | **Not created yet** | Create it here when the first internal feature is requested. Add `uis/backoffice/README.md` and list it in `uis/README.md` (+ `.es.md`) |
| `services/` | **Backend APIs and services.** One centralized FastAPI app (planned `services/api/`) with domain routers. One subfolder per service | **Not created yet** | Add endpoints to the same API. A new subfolder only for a worker that must run separately. Each service gets a README |
| `uis/<other>` | Other UIs, each covering a different concern | `uis/talent-pipeline-tracker` exists (Milestone 3) | **Don't add new internal tools as siblings.** New internal features go into `uis/backoffice`. Adding a new `uis/` subfolder needs developer confirmation |

**Forbidden parallel trees.** Never create `apps/`, `frontend/`, `backend/`, `web/`, `client/`, `server/`, `api/` (at root), `src/` (at root), `uis/frontend`, `uis/admin`, `services/backend` or similar folders. Product code also never goes at the repo root.

## Rest of the monorepo

| Need | Folder |
| --- | --- |
| Shared domain logic / types used by 2+ projects | `packages/` (`brasaland-operations`, `shared` → `@repo/shared-types`) |
| Schemas, OpenAPI specs, templates, design tokens (non-code or too small for a package) | `shared/` |
| Raw → pipelines → processed data, eval sets | `data/raw`, `data/pipelines`, `data/process`, `data/eval` |
| **Product** AI agents for Brasaland (support bot, exec assistant…) | `agents/<agent-name>/`, starting from `agents/_template/` |
| **Product** reusable AI capabilities used by those agents | `skills/<skill>/SKILL.md`, starting from `skills/_template/` |
| MCP servers | `mcps/<server>/` |
| n8n / scheduled automations (e.g. Monday 7am report, no-sales alert) | `workflows/` |
| Docker, deploy, CI | `infra/` (`docker-compose.yml` goes at the repo root when created) |
| One-off scripts / internal CLIs | `scripts/` / `internal/` |
| Cross-cutting docs, ADRs | `docs/` |

## Two different kinds of "agents" and "skills"

| | Coding-agent configuration (how we **work**) | Product code (what we **ship**) |
| --- | --- | --- |
| Agents | `AGENTS.md` (root) | `agents/` |
| Rules | `.agents/rules/*.md` | — |
| Skills | `.agents/skills/<skill>/SKILL.md` | `skills/<skill>/SKILL.md` |
| Context | `memory-bank/*.md` | `CONTEXT.md`, `data/` |

Never put development rules in `agents/` or `skills/`, and never put product agents in `.agents/`.

## Data flow (target architecture)

```text
POS (CO) ─┐                                   ┌─> uis/backoffice (ops, exec, HR, procurement dashboards)
POS (US) ─┼─> data/pipelines ─> services/api ─┼─> uis/website (public: menu, locations, loyalty signup)
Sheets   ─┘        │              │           ├─> agents/ (exec assistant, forecasting, personalisation)
                   v              v           └─> workflows/ (Monday 7am report, no-sales alerts)
             data/process   packages/brasaland-operations (pure domain logic)
```

## Domain model (current contract)

Defined in `packages/brasaland-operations/src/types/models.ts`, following `BRIEFING.md`:

- `MenuItem` (`ITEM-…`), `SaleTransaction` (`TXN-YYYY-NNNNN`), `Location` (`LOC-CITY-NN`), `WasteRecord`. All money fields are `Price { USD; COP }`.
- Enum strings are exact and case-sensitive: `"Credit card"`, `"Digital wallet"`, `"Temporarily closed"`, `"Under renovation"`, `"Cooking error"`, `"Customer return"`.
- Validation rules (prices > 0 in both currencies, prepTime 1–60, openingYear 2008–current year, etc.) live in `utils/validations.ts`. The API and backoffice must **reuse** them, not re-implement them.
