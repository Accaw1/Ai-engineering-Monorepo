# Active Context — What We're Working On Now

Last updated: 2026-11-25

> Short-lived context: current focus, recent decisions and open questions. Rewrite this file whenever the focus changes. Long-term history goes in [`progress.md`](./progress.md).

## Current focus

**Milestone 5: Backend architecture proposal** (branch `feature/architecture-proposal`). Before anyone builds the central API, the CTO asked for a written proposal on how to structure the backend:

- [`docs/ARCHITECTURE_PROPOSAL.md`](../docs/ARCHITECTURE_PROPOSAL.md): pattern, folder and module structure for `services/api/`, FastAPI routers per domain, frontend/backend separation (API contract, environment variables, CORS), initial technical decisions and risks
- Listed in `docs/README.md` and `docs/README.es.md`

No application code in this milestone. `services/api/` is still not created.

## What the proposal says (pending CTO review, not accepted decisions yet)

- **Pattern:** a modular monolith in one FastAPI app, layered per domain (router → service → repository), with adapters only for the two POS systems. Consistent with D3 in [`techContext.md`](./techContext.md).
- **Domains / routers** under `/api/v1`: locations, menu-items, sales, waste, suppliers, telemetry, reports. Customers come later.
- **Proposed technical choices:** Python 3.12 + uv, PostgreSQL + SQLAlchemy 2 + Alembic, Pydantic v2 + pydantic-settings, money as `Decimal`, UTC timestamps with per-location day boundaries, explicit CORS origins from `CORS_ORIGINS`.

Treat these as proposals. Record a point as a `D#` row in `techContext.md` only after the CTO accepts it.

## Recent decisions

- Coding-agent config (`AGENTS.md`, `.agents/`, `memory-bank/`) is kept separate from product AI folders (`agents/`, `skills/`, `mcps/`). See D8 in [`techContext.md`](./techContext.md).
- Application placement is fixed: public site → `uis/website`, internal app → `uis/backoffice`, APIs → `services/`. See [`systemPatterns.md`](./systemPatterns.md).
- `CLAUDE.md` only imports `AGENTS.md`, so every tool reads the same protocol.
- Cross-cutting architecture documents live in `docs/`.

## Open questions (ask the developer; don't decide alone)

1. Should `uis/talent-pipeline-tracker` move into `uis/backoffice` once the backoffice exists?
2. Which backoffice stack? The Next.js used by the Talent Tracker is the likely candidate, but it is not decided.
3. When do we add a root workspace (pnpm/npm workspaces) and `docker-compose.yml`?
4. When should the fixed 1 USD = 4000 COP rate be replaced by a real FX source?
5. **API vs TypeScript domain rules:** `systemPatterns.md` says the API must reuse the validation rules in `packages/brasaland-operations`, but the API is Python. The proposal suggests a Python re-implementation checked against shared test vectors in `shared/`. Needs CTO confirmation.
6. **Time zones:** the proposal moves daily aggregates from the runtime's local zone to per-location zones. That changes an existing rule.
7. **Database, Python project file and authentication** for `services/api` (see §10 of the proposal).

## Next immediate step

Merge this PR, get the CTO's answers to the proposal's open questions, then record the accepted decisions and create `services/api/` from an up-to-date `main`.
