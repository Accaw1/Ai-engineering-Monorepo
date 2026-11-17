---
name: brasaland-domain
description: Business invariants for Brasaland data - two currencies, exact enums, validation rules, pure functions, time zones.
scope: file-pattern
alwaysApply: false
globs:
  - "packages/brasaland-operations/**"
  - "services/**"
  - "uis/backoffice/**"
  - "data/**"
---

# Rule: Brasaland domain and money

**Scope: file-pattern.** Active when reading or editing files matching `packages/brasaland-operations/**`, `services/**`, `uis/backoffice/**` or `data/**`.

Felipe Guerrero: *"If the margin calculation is wrong, I'm making bad decisions."* These invariants come from [`BRIEFING.md`](../../BRIEFING.md) and [`CONTEXT.md`](../../CONTEXT.md).

## Money

1. Every money value is a `Price { USD: number; COP: number }`. Never a bare number or a single-currency field in a domain model or API payload.
2. Calculations take an explicit `currency: "USD" | "COP"` and read that field directly.
3. Conversion goes **only** through `convertCurrency` (1 USD = **4000** COP, fixed). Don't hard-code `4000` anywhere else, and don't change the rate without a recorded decision (`techContext.md` D5).
4. Round to **2 decimals once, at the end** of a calculation (`Math.round(x * 100) / 100`).
5. Guard against division by zero (margin with zero revenue → `0`), and clamp percentages the briefing bounds (margin 0–100, score 0–100).

## Entities and enums

- Reuse the types in `packages/brasaland-operations/src/types/models.ts`. Don't redefine `MenuItem`, `SaleTransaction`, `Location`, `WasteRecord` or `Price` elsewhere. If a second project needs them, propose moving them to `packages/shared`.
- Enum strings are exact and case-sensitive: `"Meat" | "Side" | "Beverage" | "Dessert" | "Combo"`, `"Cash" | "Credit card" | "Debit card" | "Digital wallet"`, `"Active" | "Temporarily closed" | "Under renovation"`, `"Expired" | "Cooking error" | "Customer return" | "Damage" | "Other"`, `"Colombia" | "USA"`.
- ID formats: `ITEM-…`, `TXN-YYYY-NNNNN`, `LOC-<CITY>-NN`.

## Validation (reuse `utils/validations.ts`; don't re-implement it)

- MenuItem: USD and COP prices > 0; `prepTimeMinutes` in (0, 60]; non-empty name; available in at least one country.
- SaleTransaction: quantity > 0; both prices > 0; non-empty `waiterName`.
- Location: `openingYear` in [2008, current year]; seating and staff > 0; rent and utilities > 0 in both currencies.
- Validators return `{ valid, errors: string[] }` and collect **all** errors, not just the first.

## Code style

- Pure functions: no global state, and never mutate inputs (`[...arr].sort()`). Date-dependent logic takes an injectable `referenceDate` / `currentYear`.
- Time zones: Colombia `America/Bogota`, Florida `America/New_York`. Don't silently change the "local calendar day" behaviour of `calculateDailyRevenue`.
- Every new function gets `node:test` tests covering both currencies, empty input and invalid data. `npm run check` must pass.
- `data/**`: no real customer or employee PII in `data/raw`. Use synthetic or anonymised samples and document the origin in the folder README.
