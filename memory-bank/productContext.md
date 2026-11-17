# Product Context — Users, Departments and Needs

Last updated: 2026-11-17

> Business context: who uses what we build and why. Extends [`projectbrief.md`](./projectbrief.md). Source: [`CONTEXT.md`](../CONTEXT.md).

## Department needs (backlog source)

Every feature should trace back to one of these rows. If a request doesn't fit any of them, ask the developer before building it.

| Department | Lead | Pain today | What they need | Where it will live |
| --- | --- | --- | --- | --- |
| Restaurant Operations | Felipe Guerrero | Locations run in isolation. Orders by WhatsApp. Paper/Excel shift reports | Real-time sales dashboard per location (COP + USD). Ingredient ordering from sales history + stock. Alert when a location shows no sales during opening hours | `uis/backoffice` (UI) · `services/` (API) · `workflows/` (alerts) · `packages/brasaland-operations` (logic) |
| Procurement & Suppliers | Lucía Fernández | ~20 suppliers, negotiation by email/Excel. Price changes found on the invoice | Supplier platform with price history + alerts. Consolidated purchasing across both markets | `uis/backoffice` · `services/` |
| Marketing & Digital Experience | Camila Ospina | 2019 website, no online orders, 2.8-star app. Stamp-card loyalty with no data | Digital loyalty + ordering app. Customer CRM. Personalisation engine | `uis/website` (public) · `uis/backoffice` (CRM) · `services/` · `agents/` |
| People & Culture | Ashley Turner | 115 people, 2 labour regimes, HR by email/Excel. Manual onboarding with high kitchen turnover | HR portal (holidays, absences). Automated onboarding. HR KPI dashboard (turnover, absenteeism, time-to-fill) by country | `uis/backoffice` (today: `uis/talent-pipeline-tracker`) · `services/` · `workflows/` |
| Training & Quality Standards | Jake Morrison | Recipes in a Google Drive nobody can navigate. Updates take days in 2 languages | Searchable recipe catalogue. Onboarding path. Push recipe updates to all 14 locations. ES/EN | `uis/backoffice` · `services/` · `agents/` (RAG) |
| Technology | Nicolás Park | Static site, old app, unconnected POS per country, spreadsheets | Central API (locations, menus, sales, customers, suppliers). Real-time telemetry. Data pipeline feeding dashboards | `services/` · `data/pipelines` · `infra/` |
| Executive Direction | Mariana Restrepo | Decisions from calls, Tuesday PDFs and intuition | Executive dashboard (chain sales in USD + COP). Natural-language AI assistant. Automated weekly report every Monday 7am | `uis/backoffice` · `agents/` · `workflows/` |

## User groups and the surface they use

| User | Surface | Notes |
| --- | --- | --- |
| Restaurant customers (Colombia + Florida) | **Public website** → `uis/website` | Brand, menu, locations, Brasa Points signup, contact. Bilingual audience |
| HQ and location staff (managers, supervisors, HR, procurement, training, executives) | **Internal backoffice** → `uis/backoffice` | One internal app with its own layout and auth, **separate from the public site** |
| Other systems (POS, dashboards, agents, n8n) | **Central API** → `services/` | One FastAPI app with domain routers |

## Product principles

1. **Trustworthy numbers first.** A dashboard showing a wrong margin is worse than no dashboard.
2. **Both markets by default.** Currency (USD/COP), country (Colombia/USA), language (ES/EN) and time zone are always inputs, never assumptions.
3. **Replace a real manual process.** Each feature should remove a phone call, a spreadsheet, a WhatsApp order or a paper form.
4. **Honest public copy.** The website must not promise features that don't exist (online ordering, real-time loyalty balance) until they ship.
5. **Data before AI.** AI features (forecasting, personalisation, assistant) come after clean, validated data exists in `services/` and `data/`.
