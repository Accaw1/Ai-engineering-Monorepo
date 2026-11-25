# Tech Context — Stack, Decisions and Constraints

Last updated: 2026-11-25

> Technical context. Where code goes is defined in [`systemPatterns.md`](./systemPatterns.md). Business context is in [`projectbrief.md`](./projectbrief.md).

## Repository

- A **monorepo** created from the 4Geeks AI Engineering company-project template. GitHub: `Accaw1/Ai-engineering-Monorepo`. Default branch: `main`.
- **No root workspace runner.** There is no root `package.json`, no pnpm/turbo workspace and no `docker-compose.yml` yet. **Each project is installed and run from its own folder** with its own `package.json` and `package-lock.json` (npm).
- Dev environment: `.devcontainer/` (Codespaces). Image `universal:2`, Node **22**, Python with `uv`. pnpm is enabled through corepack but unused. Forwarded ports: **3000** (Next.js / test pages), **5173** (Vite), **8000** (reserved for the FastAPI API), **5678** (reserved for n8n).
- Most template folders have bilingual READMEs: `README.md` (EN) + `README.es.md` (ES).

## Existing projects (what is already in the repo)

| Path | What it is | Stack | Verify commands (run inside the folder) |
| --- | --- | --- | --- |
| `uis/website` | Public Brasaland site: landing `/`, Brasa Points signup `/application.html`, contact `/contact.html` (Milestone 1) | Vite 7, Tailwind CSS 4, semantic HTML, vanilla JS. **No backend**. Forms validate and confirm locally and store nothing | `npm install` · `npm test` (node --test) · `npm run build` |
| `packages/brasaland-operations` | `@repo/brasaland-operations`: domain types + sales/waste/margin/scoring/validation logic (Milestone 2) | TypeScript 5.7 (strict), tsx, `node:test`, http-server test page | `npm install` · `npm run check` (typecheck + tests) |
| `uis/talent-pipeline-tracker` | People & Culture candidate tracker for the Executive Assistant search (Milestone 3) | **Next.js 16.4** (App Router), React 19.3, TypeScript, Tailwind 4. Consumes the external Talent Tracker API (`NEXT_PUBLIC_API_URL`) | `npm install` · `npm run lint` · `npm run build` |
| `packages/shared` | `@repo/shared-types`: shared type placeholder (`Id`, `BaseEntity`) | TypeScript (no build) | — |
| `skills/data-analysis` | Product skill: pandas cleaning script + metrics reference | Python | — |

## Architectural decisions (ADR-lite)

| # | Decision | Why | Status |
| --- | --- | --- | --- |
| D1 | **One monorepo, one folder per responsibility** (see `README.md` folder guide) | Agents and humans can find things without ambiguity | Accepted |
| D2 | **Public site and internal app are separate frontends**: `uis/website` and `uis/backoffice` | Different users, auth, layout and release pace | Accepted. Backoffice not created yet |
| D3 | **One centralized FastAPI backend** under `services/` (planned `services/api/`) with one router per domain (locations, menus, sales, customers, suppliers, telemetry). Extract a separate worker only when it really has to run outside the API | Template guidance: keep complexity low, avoid early microservices | Accepted. Not created yet. Internal structure proposed in [`docs/ARCHITECTURE_PROPOSAL.md`](../docs/ARCHITECTURE_PROPOSAL.md) (pending CTO review) |
| D4 | **Domain logic is pure TypeScript in `packages/`**, separate from UI and transport | Testable and reusable by the backoffice and other consumers | Accepted (`packages/brasaland-operations`) |
| D5 | **Money is always a `Price { USD, COP }`**, not a single number. Conversion uses a **fixed rate of 1 USD = 4000 COP** through `convertCurrency` | Two-currency business; the briefing fixes the rate | Accepted. Revisit when a real FX source exists |
| D6 | **Date-dependent functions take an injectable date** (`referenceDate`, `currentYear`) that defaults to today | Deterministic tests, pure functions | Accepted |
| D7 | **Per-project npm**, with no root workspace for now | The template ships without one. Adding one is a cross-cutting change | Accepted. Changing it needs confirmation |
| D8 | **Agent configuration lives in `AGENTS.md`, `.agents/` and `memory-bank/`.** It is kept separate from product AI code in `agents/`, `skills/` and `mcps/` | Don't mix tooling config with product code | Accepted (Milestone 4) |

## Technical constraints

- **Node 22+** for every JS/TS project. **TypeScript strict**. ES modules (`"type": "module"`).
- **Pure functions, no mutation** in domain logic: sorts copy before sorting, and nothing reads global state.
- **Rounding:** financial results are rounded to **2 decimals** at the end of a calculation, not at each step.
- **Time zones:** locations run in `America/Bogota` (Colombia) and `America/New_York` (Florida). Today, `calculateDailyRevenue` matches calendar days in the **runtime's local time zone**. Don't change that behaviour without a decision recorded here.
- **The website has no backend.** It must not send or store form data until a `services/` endpoint exists and the developer approves wiring it.
- **The Talent Tracker uses Next.js 16 with breaking changes.** Read `uis/talent-pipeline-tracker/node_modules/next/dist/docs/` before changing it. Its `AGENTS.md` block is regenerated by `next dev`.
- **Secrets:** never commit `.env*` files except `.env.example`. `node_modules/` and `dist/` are git-ignored per project. **The root `.gitignore` is empty**, so check `git status` before committing.
- **External dependencies:** Tailwind CDN on the operations test page (needs internet). The Talent Tracker API is at `https://playground.4geeks.com/tracker/api/v1`.

## Known issues / tech debt

- `.devcontainer/post-create.sh` runs `uv sync`, but there is no `pyproject.toml` yet. It may fail until the Python API is created.
- `packages/shared` has no `README.md` and is still a placeholder. Domain types live in `packages/brasaland-operations/src/types/models.ts`. Move them into shared types only when a second consumer (backoffice or API client) needs them.
- `uis/talent-pipeline-tracker` is an internal tool that sits outside `uis/backoffice`. Whether to merge it into the backoffice is an open question (see [`activeContext.md`](./activeContext.md)).
