# Backend Architecture Proposal — Brasaland Central API

| Field | Value |
| --- | --- |
| Status | **Draft for CTO review.** No code written yet |
| Date | 2026-11-25 |
| Author | Brasaland Digital |
| Audience | Engineering team (backend, frontend, data) and CTO Nicolás Park |
| Scope | `services/api/` (the central FastAPI service) and how it talks to the frontends in `uis/` |
| Related | [`memory-bank/systemPatterns.md`](../memory-bank/systemPatterns.md) · [`memory-bank/techContext.md`](../memory-bank/techContext.md) (decisions D1–D8) · [`CONTEXT.md`](../CONTEXT.md) · [`BRIEFING.md`](../BRIEFING.md) |

---

## 1. Summary

We propose a **single FastAPI application organised as a modular monolith with a layered structure inside each business domain**. Each domain (locations, menus, sales, waste, suppliers, customers, telemetry, reports) owns its router, schemas, service and repository. Routers stay thin. Business rules live in services. Persistence lives in repositories. Country-specific integrations (the two POS systems) are isolated behind adapters.

This matches decision **D3** in the tech context (one centralised FastAPI backend with one router per domain). This document explains *why* that decision is the right one for Brasaland, how the code should be organised inside it, and what can go wrong.

**Decisions at a glance**

| # | Decision | Section |
| --- | --- | --- |
| A1 | Modular monolith in one deployable FastAPI app, not microservices or serverless functions | §3 |
| A2 | Layered structure per domain: router → service → repository, with schemas separate from ORM models | §3, §4 |
| A3 | Adapters at the integration edge for the two POS systems (Colombia, USA) | §3.4, §4 |
| A4 | One router per business domain, mounted under `/api/v1` with an app factory in `main.py` | §5 |
| A5 | Money is always a `Price { USD, COP }` value backed by `Decimal`, never `float` | §8 |
| A6 | Timestamps are stored in UTC; daily aggregates are computed in `America/Bogota` or `America/New_York` by location | §8 |
| A7 | Settings from environment variables via `pydantic-settings`; CORS origins are an explicit list from configuration | §7 |
| A8 | The OpenAPI document is the contract between the API and every frontend | §7 |
| A9 | Shared validation rules are expressed as **language-neutral test vectors** in `shared/`, run by both the TypeScript and Python test suites | §9 (risk 1) |

---

## 2. What the backend has to do (the facts that drive the decision)

These facts come from [`CONTEXT.md`](../CONTEXT.md), [`BRIEFING.md`](../BRIEFING.md) and [`memory-bank/productContext.md`](../memory-bank/productContext.md). Each one constrains the architecture.

| Business fact | Architectural consequence |
| --- | --- |
| **14 locations** in two countries, ~115 staff | Load is modest: a few thousand sales per day across the chain. A single well-structured service is enough. Splitting into many services would add operational cost without a scaling need. |
| **Two currencies** (USD, COP), fixed rate 1 USD = 4000 COP (D5) | Money needs a first-class type and exact arithmetic. Every money response carries both currencies. |
| **Two time zones** (`America/Bogota`, `America/New_York`) | "Today's sales" depends on the location. Timestamps must be stored unambiguously (UTC) and day boundaries computed per location. |
| **Two POS systems, no internal API, no telemetry** | Ingestion is the riskiest and most changing part. It needs its own boundary (adapters) so that a new POS does not touch domain code. |
| **Numbers must be correct** ("If the margin calculation is wrong, I'm making bad decisions") | Business logic must be pure, testable and isolated from HTTP. Rounding and currency rules must be centralised and tested. |
| **Several consumers**: the public website (later), the backoffice (`uis/backoffice`), the Talent Tracker, agents, n8n workflows | The API must be a stable, documented JSON contract, not a server-rendered app. This rules out MVC-with-views as the core pattern. |
| **Small team** led by a CTO | Few moving parts. One repository, one deployable, one language for the API, one database. |
| **Public website must not invent features** and must not send form data until an endpoint exists | The API should start with the internal domains (locations, menus, sales, reports). Customer-facing endpoints come later, behind a deliberate decision. |

---

## 3. Architectural pattern

### 3.1 Options considered

| Option | What it is | Fit for Brasaland | Verdict |
| --- | --- | --- | --- |
| **MVC (server-rendered)** | Controllers return HTML views built from models | Designed for one web app rendering its own pages. Our frontends are separate systems (`uis/website`, `uis/backoffice`) and the API has non-browser clients (POS adapters, n8n, agents). | **Rejected** as the core. Views belong in the frontends. |
| **Layered (router → service → repository)** | Requests enter a thin HTTP layer, business rules run in services, data access sits in repositories | Separates HTTP from rules, which is what "numbers must be correct" needs. Testable without a server. Familiar to most engineers. | **Chosen**, applied per domain |
| **Serverless functions per endpoint** | Each route deployed as an independent function | Attractive for spiky traffic, but our traffic is steady and small. Cold starts hurt POS ingestion and telemetry. Shared domain rules would be duplicated or packaged awkwardly. Stateful connection pools to the database are harder. Adds deployment surface for a small team. | **Rejected** for now. Revisit only for an isolated, bursty job. |
| **Microservices per domain** | One deployable per domain | Premature: 14 locations and a small team do not justify independent deploys, and cross-domain reports (e.g. location margin needs sales + menu + waste) would become network calls. `techContext.md` D3 already says avoid early microservices. | **Rejected** |
| **Hexagonal (ports and adapters)** applied to the whole app | Domain core fully isolated behind interfaces everywhere | Strong, but heavy for a team that is just starting. We adopt its *principle* only at the integration edge, where it pays off (two POS systems that will change). | **Adopted partially**: adapters for POS only |

### 3.2 Decision

**Modular monolith, layered per domain, with adapters at the integration edge.**

```text
HTTP request
   │
   ▼
[ router ]        thin: parse input, call one service, return a schema.   No arithmetic, no SQL.
   │
   ▼
[ service ]       business rules: validation, currency, margins, scores, rankings. Pure where possible.
   │
   ▼
[ repository ]    data access only. Returns domain objects, never HTTP objects.
   │
   ▼
[ database ]      PostgreSQL (see §8, A-DB)

Integration edge (separate from the request path):
[ POS adapter CO ]  ─┐
[ POS adapter US ]  ─┼─> normalise into domain objects ─> service layer (same rules for both countries)
[ spreadsheet import ]┘
```

### 3.3 Why this fits Brasaland

1. **Rules are the product.** Felipe's margin and waste numbers must be right. Keeping rules in services, away from HTTP and SQL, makes them testable with plain unit tests (the same approach the Milestone 2 package already uses).
2. **Two countries are a data concern, not a code fork.** The same sales rules apply in COP and USD; only the input adapter differs. Layered code with an adapter edge keeps one rule set.
3. **Reports cross domains.** Location margin needs sales, menu costs and waste. In one process this is a function call. In microservices it would be a fragile chain of HTTP calls.
4. **Consumers need a contract, not views.** Website, backoffice, agents and n8n all read JSON. A JSON-only API with a generated OpenAPI document is the natural shape.
5. **Growth path stays open.** A domain can later be extracted into its own worker (D3 allows this) because its service layer already has no HTTP dependency.

### 3.4 Layer rules (what the team must not do)

| Rule | Why |
| --- | --- |
| Routers import **services and schemas only**, never repositories or database sessions | Otherwise HTTP code starts containing SQL and rules |
| Services never import FastAPI (`Request`, `HTTPException`, `APIRouter`) | Keeps rules testable and reusable by workers |
| Repositories never import services | Prevents dependency cycles |
| A domain may call another domain's **service**, never its repository or tables directly | Keeps ownership clear. For example, `reports` calls `sales` and `menus` services |
| Adapters translate external formats into domain objects and stop there | A POS change touches one adapter |
| No arithmetic in routers or adapters | Money logic must exist in one place |

### 3.5 Tension with the existing TypeScript domain package (decision to confirm)

`packages/brasaland-operations` (Milestone 2) already implements the business rules in TypeScript (D4), and `systemPatterns.md` says the API "must **reuse** them, not re-implement them". The API is Python (FastAPI). We cannot literally reuse TypeScript from Python without running Node next to the API, which we do not want.

**Proposal:** the Python service implements its own rules, and both implementations are held to the **same language-neutral test vectors** stored in `shared/` (see §9, risk 1 and decision A9). This turns "reuse" into "one agreed specification, checked by two test suites". **This changes the wording of `systemPatterns.md` and needs CTO confirmation.**

---

## 4. Folder and module structure

### 4.1 Proposed tree (`services/api/`)

```text
services/api/
├── README.md                    # what the service is, how to run, test, migrate (+ README.es.md)
├── pyproject.toml               # dependencies managed with uv (needs confirmation, see §10)
├── alembic.ini                  # migrations config
├── migrations/                  # Alembic revisions (schema history)
├── app/
│   ├── main.py                  # app factory: create_app(), CORS, include routers, health route
│   ├── config.py                # Settings(BaseSettings): env vars, see §7.3
│   ├── dependencies.py          # shared Depends(): db session, settings, current location/user (later)
│   ├── db.py                    # engine, session factory, Base (SQLAlchemy 2.0)
│   ├── core/                    # cross-cutting, domain-agnostic building blocks
│   │   ├── money.py             # Price, convert_currency, rounding to 2 decimals (Decimal)
│   │   ├── time.py              # UTC helpers, per-location day boundaries (zoneinfo)
│   │   ├── errors.py            # DomainError types and the mapping to HTTP responses
│   │   └── pagination.py        # shared limit/offset parameters and response envelope
│   ├── domains/
│   │   ├── locations/           # router.py · schemas.py · models.py · service.py · repository.py
│   │   ├── menus/               # same five files
│   │   ├── sales/               # same five files
│   │   ├── waste/               # same five files
│   │   ├── suppliers/           # same five files (price history)
│   │   ├── customers/           # placeholder: Brasa Points / CRM, not built in phase 1
│   │   ├── telemetry/           # heartbeat and sales events per location
│   │   └── reports/             # read-only aggregations: service.py + router.py, no models
│   └── adapters/
│       └── pos/
│           ├── base.py          # the port: a Protocol every POS adapter implements
│           ├── colombia.py      # adapter for the Colombian POS export/feed
│           └── usa.py           # adapter for the Florida POS export/feed
└── tests/
    ├── unit/                    # services and core, no database, no HTTP
    ├── contract/                # runs the shared test vectors from shared/
    ├── api/                     # routers via FastAPI TestClient, validates HTTP behaviour
    └── integration/             # repositories against a real PostgreSQL (docker, later)
```

### 4.2 Separation criteria

| Criterion | Applied as |
| --- | --- |
| **By business domain first** | The top-level grouping inside `domains/` is the business concept (locations, sales…), because that is how Brasaland's departments ask for things (`productContext.md`). |
| **By layer second** | Inside each domain, the five files have fixed roles (router / schemas / models / service / repository). The same file names everywhere so any engineer can navigate any domain. |
| **Shared code only in `core/`** | If two domains need the same thing, it goes into `core/` only when it is domain-agnostic (money, time, errors). Domain-specific shared logic is imported from the owning service, not copied. |
| **Integrations isolated in `adapters/`** | External systems never leak into domains. |
| **Read-only reports separated** | `reports/` has no tables of its own. It composes services and is easy to cache or move later. |

### 4.3 Why `schemas.py` and `models.py` are separate

- `schemas.py` (Pydantic) defines what goes over HTTP. It is the public contract.
- `models.py` (SQLAlchemy) defines what is stored. It can change without changing the API.
- The service converts between them. This avoids leaking database columns (IDs, internal flags) into responses, and it lets us evolve storage independently.

---

## 5. Routes and endpoints

### 5.1 Grouping criteria

1. **One router file per domain**, never one big file. Each router sets its own `prefix` and `tags`, so Swagger UI groups endpoints by domain.
2. **Resource-oriented paths** (nouns, plural). Actions that are not CRUD use a verb sub-path only when no noun fits (e.g. `POST /sales/batches`).
3. **Reports are read-only routes** grouped under `/reports`, because they compose several domains and do not own data.
4. **The API is versioned from day one**: every path starts with `/api/v1`. Breaking changes go to `/api/v2`, not into existing clients (the website and backoffice release at different paces).

### 5.2 Proposed routes (phase 1 unless marked)

| Domain (router) | Prefix | Routes | Notes |
| --- | --- | --- | --- |
| **Locations** | `/api/v1/locations` | `GET /` list (filter `country`, `status`) · `GET /{location_id}` · `PATCH /{location_id}` (status, phase 2) | Source of truth for `LOC-CITY-NN` IDs and opening hours |
| **Menus** | `/api/v1/menu-items` | `GET /` list (filter `category`, `country`, `status`; sort by price in `currency`) · `GET /{item_id}` | Prices are `Price{USD,COP}`. Availability per country |
| **Sales** | `/api/v1/sales` | `POST /batches` (bulk ingest from POS adapters) · `GET /` list (filter `location_id`, `from`, `to`, `payment_method`) · `GET /{transaction_id}` | Batch ingest is idempotent on `TXN-…` IDs |
| **Waste** | `/api/v1/waste` | `POST /` · `GET /` (filter `location_id`, `from`, `to`) | Mirrors `WasteRecord` |
| **Suppliers** | `/api/v1/suppliers` | `GET /` · `GET /{supplier_id}` · `GET /{supplier_id}/price-history` · `POST /{supplier_id}/prices` | Price history feeds procurement alerts (phase 2) |
| **Telemetry** | `/api/v1/telemetry` | `POST /heartbeats` (location is alive) · `GET /locations/{location_id}/status` | Source for the "no sales during opening hours" alert |
| **Reports** | `/api/v1/reports` | `GET /daily-revenue?location_id=&date=&currency=` · `GET /location-margin?location_id=&from=&to=&currency=` · `GET /performance-ranking?from=&to=` · `GET /payment-methods?from=&to=` · `GET /chain-summary?currency=` (executive) | All read-only. Money responses include **both** currencies, with the requested one marked |
| **Customers** *(phase 3)* | `/api/v1/customers` | `POST /loyalty-signups` · `GET /{customer_id}` | Only after the website wiring is approved (see §7.5) |
| **Health** | `/api/v1/health` (and `/health` at root for infra) | `GET /` | Used by Docker and uptime checks |

### 5.3 Endpoint conventions every router follows

| Convention | Rule |
| --- | --- |
| Money | Always `{ "USD": 12.50, "COP": 50000.00 }` as strings or fixed-precision decimals in JSON, never a single number |
| Currency query param | Where a result is one amount, `currency` is required or explicitly defaulted, and never assumed |
| Dates | ISO 8601 with offset in input and output (`2026-11-25T14:00:00Z`). Date-only parameters (`date=2026-11-25`) are interpreted in the location's time zone |
| Pagination | `limit` (default 50, max 200) and `offset`, with a response envelope `{ items, total, limit, offset }` |
| Errors | One error shape `{ code, message, details }`. Validation errors return `422` from FastAPI, domain errors return `400`/`404`/`409` through `core/errors.py` |
| IDs | Keep the business IDs from `BRIEFING.md` (`ITEM-…`, `TXN-…`, `LOC-…`) as the public IDs. Internal primary keys stay private |
| Enums | Exact strings from `BRIEFING.md` and `models.ts` (e.g. `"Credit card"`, `"Temporarily closed"`). Case-sensitive |

---

## 6. FastAPI conventions and how they shaped this proposal

Research sources are listed in §11. The official tutorial for larger applications describes an `app/` package with `main.py`, a `dependencies.py` module, a `routers/` package with one module per resource, and an `internal/` package for restricted routes. Our tree keeps those ideas and extends them for a layered, multi-domain service.

| FastAPI convention (source) | What it says | How we apply it |
| --- | --- | --- |
| **Package layout for bigger applications** ([Bigger Applications](https://fastapi.tiangolo.com/tutorial/bigger-applications/)) | Split the app into a package with `main.py`, shared `dependencies.py`, and routers per resource | `app/main.py`, `app/dependencies.py`, `app/domains/<domain>/router.py`. We group routers by **domain** and not only by file, because our business areas are the real boundary. |
| **APIRouter per module** ([APIRouter reference](https://fastapi.tiangolo.com/reference/apirouter/)) | `APIRouter` groups path operations and can carry `prefix`, `tags`, `dependencies`, `responses` | Each domain router sets its `prefix` and `tags`. Common protection (later: authentication per location) is declared once as a router dependency. |
| **`include_router` in the main app** ([Bigger Applications](https://fastapi.tiangolo.com/tutorial/bigger-applications/)) | The main app mounts routers and can add a prefix or dependencies at include time | `create_app()` in `main.py` mounts every domain router under `/api/v1`. Adding a domain means one line here, not editing other routers. |
| **Router-level dependencies** ([Dependencies in path operation decorators](https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-in-path-operation-decorators/)) | Dependencies can be declared once for every route in a router | Used for the database session and, later, the location-scoped permission check. |
| **CORS middleware** ([CORS tutorial](https://fastapi.tiangolo.com/tutorial/cors/)) | `CORSMiddleware` with an explicit `allow_origins` list; `*` cannot be combined with credentials | Origins come from configuration (§7.4). We never use `["*"]` in any environment that has credentials. |
| **Settings with environment variables** ([Settings and Environment Variables](https://fastapi.tiangolo.com/advanced/settings/)) | Use a `BaseSettings` class (pydantic-settings), read env vars case-insensitively, optionally from `.env`, cache the settings object | `app/config.py` holds `Settings`. Only `.env.example` is committed. Settings are injected through a dependency and cached once per process, which also makes tests easy to override. |
| **Behind a proxy** ([Behind a Proxy](https://fastapi.tiangolo.com/advanced/behind-a-proxy/)) | When the app runs behind a reverse proxy, the public root path must be configured | Relevant once the API is deployed in `infra/`. Noted here, configured later. |

**Influence on decisions.** These conventions directly produced: the `app/` package with an app factory (testable: tests can create an app with overridden settings), one router per domain (the course requirement that routes are not all in one file), router-level prefixes and tags (so the OpenAPI document is readable by the frontend teams), and the settings-as-dependency pattern (so no module reads `os.environ` directly).

---

## 7. Frontend and backend as separate systems

### 7.1 Repository layout

- **One repository (monorepo), one folder per system** (D1, D7). `services/api` (Python), `uis/website` and `uis/talent-pipeline-tracker` (JavaScript) and the future `uis/backoffice` each have their own `package.json` or `pyproject.toml`, their own README, and their own verify commands.
- **Why not separate repositories?** One team, one CTO, one sprint cadence, and shared specs (`shared/`, `packages/`). Separate repositories would add coordination cost without a benefit at this size.
- **Why not one shared root workspace yet?** D7 keeps per-project installs. Python and Node tooling differ anyway, so a root workspace would mix two toolchains. Revisit with the CTO (open question 3 in `activeContext.md`).

### 7.2 API communication

- **Protocol:** HTTPS + JSON, under `/api/v1`.
- **Contract:** the OpenAPI document generated by FastAPI is the source of truth (A8). It is committed to `shared/` as `shared/api/openapi.json` on every change to a route, so frontends can see changes in review.
- **Client generation (later):** frontends can generate typed clients from that file rather than hand-writing types. This removes a class of mismatch bugs.
- **Authentication (later, decision needed):** tokens in an `Authorization` header. Not built in phase 1; endpoints are internal and not exposed to the public until the auth decision is made (§10).
- **Frontends never talk to the database or to POS systems directly.**

### 7.3 Environment variables

Rule: **only non-secret configuration reaches the browser.** Frontend variables are compiled into the JavaScript bundle and are public.

| Project | Variable | Example (dev) | Who reads it | Notes |
| --- | --- | --- | --- | --- |
| `services/api` | `DATABASE_URL` | `postgresql+psycopg://…` | `config.py` | Secret in production. Never committed |
| `services/api` | `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | `config.py` | Comma-separated explicit list |
| `services/api` | `FX_RATE_USD_COP` | `4000` | `core/money.py` | Fixed rate from D5. Changing it requires a recorded decision |
| `services/api` | `APP_ENV` | `development` | `config.py` | Controls docs exposure and CORS strictness |
| `uis/website` | `VITE_API_URL` | `http://localhost:8000/api/v1` | Vite (`import.meta.env`) | Public. Not used until the API has the endpoints it needs |
| `uis/talent-pipeline-tracker` | `NEXT_PUBLIC_API_URL` | `https://playground.4geeks.com/tracker/api/v1` | Next.js (browser) | Public. The Talent Tracker keeps its external API for now |
| `uis/backoffice` (future) | `NEXT_PUBLIC_API_URL` or `VITE_API_URL` | `http://localhost:8000/api/v1` | Its framework | Depends on the backoffice stack decision |

Ports from `techContext.md`: API **8000**, Vite **5173**, Next.js **3000**.

### 7.4 CORS

- **Why it exists:** browsers block a page on one origin (e.g. `localhost:5173`) from reading responses from another origin (`localhost:8000`) unless the API allows it.
- **What we configure:** `CORSMiddleware` with `allow_origins` set from `CORS_ORIGINS`, `allow_methods` limited to what is used (`GET`, `POST`, `PATCH`), and `allow_headers` limited to `Content-Type` and `Authorization`.
- **What we forbid:** `allow_origins=["*"]` together with `allow_credentials=True` (the framework rejects it for good reason). Also, no production origin may appear in the development configuration.
- **Custom response headers** (for example a request ID for support) are exposed only through `expose_headers`; otherwise the browser cannot read them.

### 7.5 Coexistence rules with the public website

- `uis/website` **has no backend** today (`techContext.md`). Its forms validate locally and store nothing.
- The website must not call the API until: (1) the endpoint exists, (2) the developer approves the wiring, and (3) the copy is reviewed for honesty (no promises of online ordering that do not exist yet).
- The internal backoffice (`uis/backoffice`) is the first real consumer. Its CORS origin is added to `CORS_ORIGINS`, not to the code.

---

## 8. Initial technical decisions

| # | Decision | Justification | Status |
| --- | --- | --- | --- |
| A1 | **Python 3.12+**, managed with **uv** and a `pyproject.toml` | The devcontainer already installs `uv` and `post-create.sh` expects a `pyproject.toml`. | Proposed |
| A-DB | **PostgreSQL** with **SQLAlchemy 2.0** (ORM and core) and **Alembic** migrations | Relational data (locations, sales, menus, waste) with joins for reports. Migrations give a reviewable schema history. | Proposed. Needs CTO confirmation |
| A5 | **Money as `Decimal`** (never `float`), `NUMERIC(14, 2)` columns per currency, rounding `ROUND_HALF_UP` at the end of each calculation | Floats cause rounding drift (`0.1 + 0.2`). Two decimals at the end matches the rule in `techContext.md`. | Proposed |
| A6 | **Timestamps stored as `timestamptz` (UTC)**. Daily aggregates use the location's zone (`zoneinfo`: `America/Bogota`, `America/New_York`) | Fixes the current TypeScript behaviour of using the runtime's local zone (`techContext.md`). That change must be recorded as a decision first. | Proposed. Changes an existing rule |
| A7 | **Pydantic v2** for schemas and **pydantic-settings** for configuration | Official FastAPI stack (§6). Validation rules (prices > 0, `prepTimeMinutes` 1–60, `openingYear` 2008–current year) are expressed once per schema. | Proposed |
| A9 | **Shared test vectors** in `shared/validation/*.json` (inputs and expected outputs for money conversion, margin, validation) | Keeps the TypeScript package and the Python service aligned without a runtime dependency between them (§3.5, §9 risk 1) | Proposed |
| A10 | **Tests:** `pytest` for the Python service; `ruff` for lint and format | Same role as `node --test` in the JS projects. Services are unit-tested without HTTP | Proposed |
| A11 | **Versioned path `/api/v1`** | Protects the website and backoffice from breaking changes | Proposed |
| A12 | **Batch ingestion for sales** (`POST /sales/batches`), idempotent by transaction ID | POS exports arrive in batches, and retries must not duplicate sales | Proposed |
| A13 | **No background worker yet.** Scheduled jobs (Monday 7am report, no-sales alert) live in `workflows/` (n8n) and call the API | Keeps the API a single process. Matches the folder map in `systemPatterns.md` | Accepted by existing structure |
| A14 | **Authentication deferred** | Phase 1 endpoints are internal. Auth needs a decision on identity provider and roles per location | Open |

---

## 9. Risks and points of attention

Each risk states what goes wrong if the team does not follow the proposed structure.

1. **The Python and TypeScript rules drift apart.** The Milestone 2 package and the new API both implement money, margin and validation rules. If each team tweaks its own copy, the website's dashboard and the API's report could show different margins for the same sales, which is exactly what Felipe said he cannot accept. **Mitigation:** shared test vectors in `shared/` (A9) executed by both suites, and a rule that changing a formula changes the vectors first.

2. **Business logic leaks into routers.** Without the layer rule, the quickest way to add a report is an `if` statement in a route. Then the rule exists in one HTTP endpoint and nowhere else, and it cannot be unit tested. **Mitigation:** §3.4 rules, enforced in review. Routers are reviewed for "no arithmetic".

3. **Floating-point money.** If amounts are stored or computed as `float`, totals per location will differ by cents from the same data summed in another order, and the rounding will not match the spec. **Mitigation:** A5, with tests on both currencies and rounding edge cases.

4. **Time zone bugs.** If "today" is computed on the server clock (UTC in a container), a Florida sale at 9 p.m. Eastern lands in the next day's report. The current TypeScript code uses the runtime's local zone, which has the same risk. **Mitigation:** A6, and tests with a sale near midnight for each location.

5. **Everything in one file again.** The course requirement and the FastAPI convention both say routes must be grouped by domain. A single `main.py` with all routes works for a week and becomes unreviewable in a month. **Mitigation:** one router per domain (§5), `create_app()` only mounts routers.

6. **CORS misconfiguration breaks the frontends in confusing ways.** If `allow_origins` is `*` with credentials, or the production origin is missing, the browser reports a network error and the team assumes the API is down. If a development origin leaks into production, the API accepts requests from any `localhost`. **Mitigation:** `CORS_ORIGINS` per environment (§7.4), and a smoke test that calls the API from the real frontend origin.

7. **Secrets reach the browser.** A `VITE_` or `NEXT_PUBLIC_` variable is embedded in public JavaScript. If someone puts a database URL or an API key there, it is public. **Mitigation:** the table in §7.3 and a rule that frontend variables are configuration only.

8. **Premature wiring of the public website.** The website currently stores nothing and promises nothing it cannot deliver. Connecting its forms to an API before the auth, privacy and copy decisions are made creates real customer data with no consent process and invites false claims (for example, "order online"). **Mitigation:** §7.5 gate.

9. **Folder sprawl.** Creating `services/api/src/`, `services/backend/`, or a second `api/` at the root would create a parallel tree that `monorepo-structure.md` forbids and that would split the team's knowledge. **Mitigation:** the tree in §4 is the only place for backend code.

10. **Splitting into services too early.** When a report becomes slow, the reflex is to extract a microservice. Most slowness is a missing index or an N+1 query. **Mitigation:** measure first, add indexes in a migration, and only extract a worker when it must run outside the API process (D3).

11. **Repository and service depending on each other in both directions.** Once `sales` imports `menus` and `menus` imports `sales`, the team cannot test either alone. **Mitigation:** §3.4 rule that domains call each other's services only, and a check in review for cycles.

---

## 10. Open questions for the CTO

1. **Database:** confirm PostgreSQL (A-DB), or name another option.
2. **Python project:** approve `services/api/pyproject.toml` with uv. Adding dependencies is a protected action under `AGENTS.md`.
3. **Domain logic duplication (§3.5):** confirm that the Python service re-implements the rules and that `systemPatterns.md` is updated to say "shared specification with test vectors" instead of "reuse".
4. **Timezone rule (A6):** approve changing the TypeScript runtime-local behaviour to per-location zones. This changes an existing rule.
5. **Authentication:** which identity provider, and whether roles are per location or per country.
6. **Public website wiring:** when, and what privacy and consent process applies before Brasa Points signups are stored.
7. **Backoffice stack (A-open question 2 in `activeContext.md`):** determines the frontend variable name in §7.3.

---

## 11. Sources

**FastAPI official documentation** (consulted for conventions in §6 and §7; check the live site for the current version before implementing):

- [Bigger Applications — Multiple Files](https://fastapi.tiangolo.com/tutorial/bigger-applications/): package layout, `APIRouter`, `include_router`, router dependencies
- [APIRouter class](https://fastapi.tiangolo.com/reference/apirouter/): `prefix`, `tags`, `dependencies`, `responses`
- [FastAPI class](https://fastapi.tiangolo.com/reference/fastapi/): application configuration
- [Dependencies in path operation decorators](https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-in-path-operation-decorators/): shared protection per route
- [CORS (Cross-Origin Resource Sharing)](https://fastapi.tiangolo.com/tutorial/cors/): `CORSMiddleware`, `allow_origins`, credentials restriction
- [Middleware reference](https://fastapi.tiangolo.com/reference/middleware/): `CORSMiddleware` defaults
- [Response Headers](https://fastapi.tiangolo.com/advanced/response-headers/): `expose_headers`
- [Settings and Environment Variables](https://fastapi.tiangolo.com/advanced/settings/): `BaseSettings`, `.env`, cached settings
- [Behind a Proxy](https://fastapi.tiangolo.com/advanced/behind-a-proxy/): root path behind a reverse proxy

**Repository sources:**

- [`CONTEXT.md`](../CONTEXT.md), [`BRIEFING.md`](../BRIEFING.md): business facts and the domain entities
- [`memory-bank/techContext.md`](../memory-bank/techContext.md): decisions D1–D8, ports, constraints
- [`memory-bank/systemPatterns.md`](../memory-bank/systemPatterns.md): placement rules and the data-flow target
- [`memory-bank/productContext.md`](../memory-bank/productContext.md): department needs and where each lives
- [`.agents/rules/monorepo-structure.md`](../.agents/rules/monorepo-structure.md): forbidden parallel trees
- [`services/README.md`](../services/README.md): one folder per service
