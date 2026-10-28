# @repo/brasaland-operations

Milestone 2 core data processing for Brasaland: menu items, sales, locations and waste records, plus the filters, searches, financial metrics, performance scoring, reports, and validations from [`BRIEFING.md`](../../BRIEFING.md).

## Structure

```
src/
├── types/models.ts            # Interfaces and types (MenuItem, SaleTransaction, Location, WasteRecord, ...)
├── utils/collections.ts       # Filtering and non-mutating sorting
├── utils/search.ts            # Linear search (by id / name) and binary search (by capacity)
├── utils/transformations.ts   # Revenue, margin, waste, currency, performance scoring, reports
├── utils/validations.ts       # Business rule validations
├── data/sampleData.ts         # Sample data from the briefing (+ waste records)
├── data/extendedSampleData.ts # Full chain: the 14 restaurants from the Milestone 1 website, with sales and waste
├── web/app.ts                 # Test page logic, compiled to dist/ by `npm run build:web`
├── index.html                 # Tailwind test page
└── demo.ts                    # Runs every function against the sample data
tests/operations.test.ts       # node:test suite
```

## Commands

Requires Node 22+.

```bash
cd packages/brasaland-operations
npm install
npm run typecheck   # tsc --noEmit
npm run demo        # tsx src/demo.ts
npm test            # tsx --test tests/*.test.ts
npm run check       # typecheck + tests
npm run web         # build the test page and serve it on port 3000
```

### Test page

`npm run web` compiles `src/web/app.ts` and the utils to `dist/` and then serves the package folder. Open **http://localhost:3000/src/index.html** (in Codespaces, open the forwarded port 3000 and add `/src/index.html`).

The page has controls for every function: filters, sorting, linear and binary search, financial metrics, performance ranking, reports, and a JSON editor for trying validations with valid or invalid entities. A toggle switches between the full 14-restaurant chain (default) and the Milestone 2 briefing sample. Tailwind loads from its CDN, so the page needs internet access.

## Implementation notes

- **Currency**: every money value is a `Price` with both `USD` and `COP`. Calculations read the requested currency directly; `convertCurrency` uses a fixed rate of 1 USD = 4000 COP.
- **Dates**: `calculateDailyRevenue` matches sales by calendar day in the runtime's local time zone. `filterSalesByDateRange` compares exact instants, inclusive at both ends.
- **Margin**: sales whose `itemId` is not in `menuItems` are excluded, because they have no ingredient cost. If there is no revenue the margin is `0`, and the result is clamped to 0–100 as the briefing specifies.
- **Performance score**: operating days are counted from January 1 of `openingYear`. If a location has no revenue, it gets 20 waste points when there is no waste and 0 when there is any.
- **Purity**: `scoreLocationPerformance` / `rankLocationsByPerformance` take an optional `referenceDate`, and `validateLocation` takes an optional `currentYear`. Both default to today, so callers and tests can pass fixed values for deterministic results.
