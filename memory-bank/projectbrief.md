# Project Brief — Brasaland Digital

Last updated: 2026-11-17

> Business context. Source of truth: [`CONTEXT.md`](../CONTEXT.md) (company) and [`BRIEFING.md`](../BRIEFING.md) (current milestone brief). If this file and those disagree, those win — then fix this file.

## The company

**Brasaland** is a grilled-food restaurant chain founded in **2008 in Medellín, Colombia**.

| Fact | Value |
| --- | --- |
| Locations | **14 company-owned restaurants** in **Colombia** and the **United States (Florida)** |
| People | ~115 employees |
| Revenue | ~USD 6M per year |
| HQ | Medellín. Commercial/operations office in Miami for the Florida locations |
| CEO | Mariana Restrepo (daughter of the founder, CEO since 2019) |
| Brand promise | Same taste in Medellín and Miami · warm, consistent service · fast kitchen |

## The problem we are solving

Brasaland runs a two-country, two-currency, two-language operation on tools built for one local restaurant:

- No real-time view of any location. Leadership relies on phone calls and **weekly PDF reports that arrive on Tuesdays**.
- Ingredient orders go out **by WhatsApp or phone** with no inventory data, which causes overstock in some locations and stockouts in others.
- The **Brasa Points** loyalty programme runs on **physical stamp cards**. 60% of customers don't use them and they produce no data.
- Each country has a **different POS**, with no integration, no internal API and no telemetry. Spreadsheets do the work of management systems.
- The website is from 2019, takes no online orders, and the app has a 2.8 store rating.

Newer competitors are winning with digital ordering, data-driven marketing and operational dashboards.

## Who we are

**Brasaland Digital** is the internal team Mariana created to build the tools, systems and automations that let Brasaland run like a modern company **"without losing the soul of what it has always been."** Technology is led by **CTO Nicolás Park** (Medellín). We are building the platform from near zero.

## Objectives (what "done" looks like for the company)

1. **One source of truth for operations.** A central Brasaland API (locations, menus, sales, customers, suppliers) that replaces spreadsheets and unconnected POS exports.
2. **Visibility in both currencies.** Sales and performance dashboards per location in **COP and USD**, for operations and executives.
3. **Smarter supply.** Ingredient ordering and supplier price history built on real sales and stock data.
4. **Know the customer.** A digital loyalty and ordering experience plus a CRM, replacing the stamp cards.
5. **Lighter internal admin.** HR, onboarding and training tools that work across two labour markets and two languages (ES/EN).
6. **AI on top of reliable data.** Forecasting, personalisation, a natural-language executive assistant, and an automated weekly report every **Monday at 7am**.

## Stakeholders (who asks for what)

See [`productContext.md`](./productContext.md) for each department's needs in detail.

| Area | Lead | Location |
| --- | --- | --- |
| Executive | Mariana Restrepo (CEO) | Medellín |
| Restaurant Operations | Felipe Guerrero (Operations Director, owner of the current milestone) | Medellín |
| Procurement & Suppliers | Lucía Fernández | — |
| Marketing & Digital Experience | Camila Ospina | — |
| People & Culture | Ashley Turner | Miami |
| Training & Quality Standards | Jake Morrison | Miami |
| Technology | Nicolás Park (CTO) | Medellín |

## Non-negotiables from the business

- **Numbers must be correct.** Felipe: *"If the margin calculation is wrong, I'm making bad decisions. Build it right."* Accuracy beats speed.
- **Two currencies everywhere.** Every money value is handled in both USD and COP.
- **Two countries, two time zones, two labour/legal regimes.** Never assume a single market.
- **Two languages.** Spanish and English. Customer- and staff-facing copy must work in both (or start from one base language and be ready to translate).
- **Brand consistency.** Public-facing work must match the Brasaland brand and must not invent facts (e.g. online ordering is **not** available yet).
