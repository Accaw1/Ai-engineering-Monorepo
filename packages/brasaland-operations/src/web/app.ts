import { sampleLocations, sampleMenuItems, sampleSales, sampleWasteRecords } from "../data/sampleData.ts";
import {
  extendedLocations,
  extendedMenuItems,
  extendedSales,
  extendedWasteRecords,
} from "../data/extendedSampleData.ts";
import type {
  Currency,
  Location,
  MenuCategory,
  MenuItem,
  SaleTransaction,
  SortOrder,
  ValidationResult,
  WasteRecord,
} from "../types/models.ts";
import { COUNTRIES } from "../types/models.ts";
import {
  filterActiveLocations,
  filterMenuItemsByCategory,
  filterSalesByDateRange,
  filterSalesByLocation,
  sortLocationsByCapacity,
  sortMenuItemsByPrice,
} from "../utils/collections.ts";
import { binarySearchLocationByCapacity, findLocationById, findMenuItemByName } from "../utils/search.ts";
import {
  calculateAverageTicket,
  calculateCountryComparison,
  calculateDailyRevenue,
  calculateLocationMargin,
  calculateWasteCost,
  convertCurrency,
  countSalesByPaymentMethod,
  findTopSellingItems,
  groupWasteByReason,
  rankLocationsByPerformance,
} from "../utils/transformations.ts";
import { validateLocation, validateMenuItem, validateSaleTransaction } from "../utils/validations.ts";

// ---------- Types ----------

type Cell = string | number;
type TableRow = Record<string, Cell>;
type DatasetKey = "briefing" | "extended";
type EntityKind = "MenuItem" | "SaleTransaction" | "Location";

type Output =
  | { kind: "table"; caption: string; rows: TableRow[] }
  | { kind: "value"; label: string; value: string }
  | { kind: "validation"; result: ValidationResult }
  | { kind: "error"; message: string };

interface Dataset {
  menuItems: MenuItem[];
  locations: Location[];
  sales: SaleTransaction[];
  wasteRecords: WasteRecord[];
}

const DATASETS: Record<DatasetKey, Dataset> = {
  briefing: {
    menuItems: sampleMenuItems,
    locations: sampleLocations,
    sales: sampleSales,
    wasteRecords: sampleWasteRecords,
  },
  extended: {
    menuItems: extendedMenuItems,
    locations: extendedLocations,
    sales: extendedSales,
    wasteRecords: extendedWasteRecords,
  },
};

const CURRENCIES: readonly Currency[] = ["USD", "COP"];
const SORT_ORDERS: readonly SortOrder[] = ["asc", "desc"];
const MENU_CATEGORIES: readonly MenuCategory[] = ["Meat", "Side", "Beverage", "Dessert", "Combo"];
const ENTITY_KINDS: readonly EntityKind[] = ["MenuItem", "SaleTransaction", "Location"];

let currentDataset: Dataset = DATASETS.extended;

// ---------- DOM helpers ----------

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}

function readValue(id: string): string {
  return getElement<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(id).value;
}

function readOption<T extends string>(id: string, allowed: readonly T[]): T {
  const value = readValue(id);
  const match = allowed.find((option) => option === value);
  if (match === undefined) {
    throw new Error(`Unexpected value "${value}" in #${id}`);
  }
  return match;
}

function readNumber(id: string): number {
  const value = Number(readValue(id));
  if (readValue(id).trim() === "" || !Number.isFinite(value)) {
    throw new Error("Enter a valid number");
  }
  return value;
}

function createElement(tag: string, className: string, text?: string): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

// ---------- Formatting ----------

function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function saleRow(sale: SaleTransaction): TableRow {
  return {
    ID: sale.id,
    Location: sale.locationId,
    Item: sale.itemId,
    Qty: sale.quantity,
    "Total USD": formatMoney(sale.totalPrice.USD, "USD"),
    "Total COP": formatMoney(sale.totalPrice.COP, "COP"),
    Payment: sale.paymentMethod,
    Timestamp: formatDateTime(sale.timestamp),
    Waiter: sale.waiterName,
  };
}

function locationRow(location: Location): TableRow {
  return {
    ID: location.id,
    Name: location.name,
    Country: location.country,
    Opened: location.openingYear,
    Capacity: location.seatingCapacity,
    Staff: location.staffCount,
    Manager: location.manager,
    Status: location.status,
  };
}

function menuItemRow(item: MenuItem): TableRow {
  return {
    ID: item.id,
    Name: item.name,
    Category: item.category,
    "Price USD": formatMoney(item.basePrice.USD, "USD"),
    "Price COP": formatMoney(item.basePrice.COP, "COP"),
    "Cost USD": formatMoney(item.ingredientCost.USD, "USD"),
    "Prep (min)": item.prepTimeMinutes,
    Status: item.status,
  };
}

function wasteRow(record: WasteRecord): TableRow {
  return {
    ID: record.id,
    Location: record.locationId,
    Item: record.itemId,
    Qty: record.quantity,
    Reason: record.reason,
    "Cost USD": formatMoney(record.cost.USD, "USD"),
    "Cost COP": formatMoney(record.cost.COP, "COP"),
    Reported: formatDateTime(record.timestamp),
  };
}

function tableOf(caption: string, rows: TableRow[]): Output {
  return { kind: "table", caption, rows };
}

function valueOf(label: string, value: string): Output {
  return { kind: "value", label, value };
}

// ---------- Rendering ----------

function renderTable(caption: string, rows: TableRow[]): HTMLElement {
  const wrapper = createElement("div", "space-y-2");
  wrapper.append(createElement("p", "text-xs font-medium text-ink/60", `${caption} · ${rows.length} row(s)`));

  if (rows.length === 0) {
    wrapper.append(createElement("p", "rounded-md bg-paper px-3 py-2 text-sm text-ink/70", "No results"));
    return wrapper;
  }

  const scroller = createElement("div", "overflow-x-auto rounded-md border border-line bg-white");
  const table = createElement("table", "min-w-full text-left text-xs");
  const headerRow = createElement("tr", "bg-paper text-ink/70");
  Object.keys(rows[0]).forEach((column) => {
    headerRow.append(createElement("th", "whitespace-nowrap px-3 py-2 font-semibold", column));
  });
  const thead = createElement("thead", "");
  thead.append(headerRow);

  const tbody = createElement("tbody", "divide-y divide-line/70");
  rows.forEach((row) => {
    const tr = createElement("tr", "hover:bg-flame/5");
    Object.values(row).forEach((cell) => {
      const alignment = typeof cell === "number" ? "text-right tabular-nums" : "";
      tr.append(createElement("td", `whitespace-nowrap px-3 py-1.5 ${alignment}`, String(cell)));
    });
    tbody.append(tr);
  });

  table.append(thead, tbody);
  scroller.append(table);
  wrapper.append(scroller);
  return wrapper;
}

function renderValidation(result: ValidationResult): HTMLElement {
  const wrapper = createElement(
    "div",
    `rounded-md border px-3 py-2 text-sm ${result.valid ? "border-olive/40 bg-olive/10" : "border-flame/40 bg-flame/10"}`,
  );
  wrapper.append(
    createElement(
      "p",
      `font-semibold ${result.valid ? "text-olive" : "text-flame"}`,
      result.valid ? "✓ Valid — all business rules pass" : `✗ Invalid — ${result.errors.length} error(s)`,
    ),
  );
  if (result.errors.length > 0) {
    const list = createElement("ul", "mt-1 list-disc pl-5 text-flame");
    result.errors.forEach((error) => list.append(createElement("li", "", error)));
    wrapper.append(list);
  }
  return wrapper;
}

function renderOutput(output: Output): HTMLElement {
  switch (output.kind) {
    case "table":
      return renderTable(output.caption, output.rows);
    case "value": {
      const wrapper = createElement("div", "rounded-md border border-line bg-paper px-4 py-3");
      wrapper.append(
        createElement("p", "text-xs font-medium text-ink/60", output.label),
        createElement("p", "font-display text-3xl text-ink tabular-nums", output.value),
      );
      return wrapper;
    }
    case "validation":
      return renderValidation(output.result);
    case "error":
      return createElement("p", "rounded-md bg-flame/10 px-3 py-2 text-sm text-flame", output.message);
  }
}

function renderOutputs(container: Element, outputs: Output[]): void {
  container.replaceChildren(...outputs.map(renderOutput));
}

// ---------- Operations ----------

function filterByLocation(): Output[] {
  const locationId = readValue("filterLocationId");
  return [tableOf(`Sales at ${locationId}`, filterSalesByLocation(currentDataset.sales, locationId).map(saleRow))];
}

function filterByDateRange(): Output[] {
  const start = new Date(readValue("filterStart"));
  const end = new Date(readValue("filterEnd"));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Pick both a start and an end date");
  }
  return [tableOf("Sales in range", filterSalesByDateRange(currentDataset.sales, start, end).map(saleRow))];
}

function filterByCategory(): Output[] {
  const category = readOption("filterCategory", MENU_CATEGORIES);
  return [
    tableOf(`${category} items`, filterMenuItemsByCategory(currentDataset.menuItems, category).map(menuItemRow)),
  ];
}

function filterActive(): Output[] {
  return [tableOf("Active locations", filterActiveLocations(currentDataset.locations).map(locationRow))];
}

function sortByCapacity(): Output[] {
  const order = readOption("sortCapacityOrder", SORT_ORDERS);
  return [
    tableOf(
      `Locations by capacity (${order})`,
      sortLocationsByCapacity(currentDataset.locations, order).map(locationRow),
    ),
  ];
}

function sortByPrice(): Output[] {
  const currency = readOption("sortPriceCurrency", CURRENCIES);
  const order = readOption("sortPriceOrder", SORT_ORDERS);
  return [
    tableOf(
      `Menu by ${currency} price (${order})`,
      sortMenuItemsByPrice(currentDataset.menuItems, currency, order).map(menuItemRow),
    ),
  ];
}

function searchLocationById(): Output[] {
  const id = readValue("searchLocationId").trim();
  const location = findLocationById(currentDataset.locations, id);
  return location === null
    ? [valueOf("findLocationById", `null — no location with id "${id}"`)]
    : [tableOf("Found location", [locationRow(location)])];
}

function searchMenuItemByName(): Output[] {
  const name = readValue("searchMenuName");
  const item = findMenuItemByName(currentDataset.menuItems, name);
  return item === null
    ? [valueOf("findMenuItemByName", `null — no item named "${name}"`)]
    : [tableOf("Found menu item", [menuItemRow(item)])];
}

function binarySearchCapacity(): Output[] {
  const targetCapacity = readNumber("binaryCapacity");
  const sortedLocations = sortLocationsByCapacity(currentDataset.locations, "asc");
  const index = binarySearchLocationByCapacity(sortedLocations, targetCapacity);
  const sortedRows = sortedLocations.map((location, position) => ({
    Index: position,
    Capacity: location.seatingCapacity,
    ID: location.id,
    Match: position === index ? "◀ found" : "",
  }));
  return [
    valueOf(`binarySearchLocationByCapacity(sorted, ${targetCapacity})`, String(index)),
    tableOf("Array searched (sorted ascending by capacity)", sortedRows),
  ];
}

function dailyRevenue(): Output[] {
  const dateValue = readValue("revenueDate");
  if (dateValue === "") {
    throw new Error("Pick a date");
  }
  const currency = readOption("revenueCurrency", CURRENCIES);
  const revenue = calculateDailyRevenue(currentDataset.sales, new Date(`${dateValue}T00:00:00`), currency);
  return [valueOf(`Revenue on ${dateValue}`, formatMoney(revenue, currency))];
}

function locationMargin(): Output[] {
  const locationId = readValue("marginLocationId");
  const currency = readOption("marginCurrency", CURRENCIES);
  const margin = calculateLocationMargin(currentDataset.sales, currentDataset.menuItems, locationId, currency);
  return [valueOf(`Profit margin at ${locationId} (${currency})`, `${margin}%`)];
}

function wasteCost(): Output[] {
  const locationId = readValue("wasteLocationId");
  const currency = readOption("wasteCurrency", CURRENCIES);
  const cost = calculateWasteCost(currentDataset.wasteRecords, locationId, currency);
  return [valueOf(`Waste cost at ${locationId}`, formatMoney(cost, currency))];
}

function convertAmount(): Output[] {
  const amount = readNumber("convertAmount");
  const fromCurrency = readOption("convertFrom", CURRENCIES);
  const toCurrency = readOption("convertTo", CURRENCIES);
  const converted = convertCurrency(amount, fromCurrency, toCurrency);
  return [valueOf(`${formatMoney(amount, fromCurrency)} →`, formatMoney(converted, toCurrency))];
}

function rankPerformance(): Output[] {
  const ranking = rankLocationsByPerformance(
    currentDataset.locations,
    currentDataset.sales,
    currentDataset.wasteRecords,
    currentDataset.menuItems,
  );
  return [
    tableOf(
      "Locations ranked by performance score (0–100)",
      ranking.map(({ location, score }, position) => ({
        Rank: position + 1,
        ID: location.id,
        Name: location.name,
        Status: location.status,
        Score: score,
      })),
    ),
  ];
}

function salesByPaymentMethod(): Output[] {
  const counts = countSalesByPaymentMethod(currentDataset.sales);
  return [
    tableOf(
      "Sales by payment method",
      Object.entries(counts).map(([method, count]) => ({ "Payment method": method, Sales: count })),
    ),
  ];
}

function averageTicket(): Output[] {
  const currency = readOption("ticketCurrency", CURRENCIES);
  return [valueOf("Average ticket", formatMoney(calculateAverageTicket(currentDataset.sales, currency), currency))];
}

function topSellingItems(): Output[] {
  const topN = readNumber("topN");
  const topItems = findTopSellingItems(currentDataset.sales, currentDataset.menuItems, topN);
  return [
    tableOf(
      `Top ${topN} selling items`,
      topItems.map(({ item, totalSold }, position) => ({
        Rank: position + 1,
        Item: item.name,
        Category: item.category,
        "Units sold": totalSold,
      })),
    ),
  ];
}

function wasteByReason(): Output[] {
  const groups = groupWasteByReason(currentDataset.wasteRecords);
  return [
    tableOf(
      "Waste grouped by reason",
      Object.entries(groups).map(([reason, records]) => ({
        Reason: reason,
        Records: records.length,
        Units: records.reduce((total, record) => total + record.quantity, 0),
        "Cost USD": formatMoney(
          records.reduce((total, record) => total + record.cost.USD, 0),
          "USD",
        ),
      })),
    ),
  ];
}

function countryComparison(): Output[] {
  const comparison = calculateCountryComparison(
    currentDataset.sales,
    currentDataset.locations,
    currentDataset.menuItems,
  );
  return [
    tableOf(
      "Colombia vs USA",
      COUNTRIES.map((country) => {
        const metrics = comparison[country];
        return {
          Country: country,
          Locations: metrics.totalLocations,
          Sales: metrics.totalSales,
          "Revenue USD": formatMoney(metrics.totalRevenue.USD, "USD"),
          "Revenue COP": formatMoney(metrics.totalRevenue.COP, "COP"),
          "Avg / location USD": formatMoney(metrics.averageRevenuePerLocation.USD, "USD"),
          "Avg / location COP": formatMoney(metrics.averageRevenuePerLocation.COP, "COP"),
        };
      }),
    ),
  ];
}

function showDataset(): Output[] {
  return [
    tableOf("Menu items", currentDataset.menuItems.map(menuItemRow)),
    tableOf("Locations", currentDataset.locations.map(locationRow)),
    tableOf("Sales", currentDataset.sales.map(saleRow)),
    tableOf("Waste records", currentDataset.wasteRecords.map(wasteRow)),
  ];
}

// ---------- Validation playground ----------

const VALID_EXAMPLES: Record<EntityKind, object> = {
  MenuItem: sampleMenuItems[0],
  SaleTransaction: sampleSales[0],
  Location: sampleLocations[0],
};

const INVALID_EXAMPLES: Record<EntityKind, object> = {
  MenuItem: {
    ...sampleMenuItems[0],
    name: "",
    basePrice: { USD: 0, COP: 74000 },
    prepTimeMinutes: 75,
    isAvailableInColombia: false,
    isAvailableInUSA: false,
  },
  SaleTransaction: {
    ...sampleSales[0],
    quantity: 0,
    totalPrice: { USD: 37, COP: -1 },
    waiterName: "  ",
    timestamp: "not a date",
  },
  Location: {
    ...sampleLocations[0],
    openingYear: 2005,
    seatingCapacity: 0,
    staffCount: -2,
    monthlyRentCost: { USD: 0, COP: 0 },
  },
};

function loadValidationExample(examples: Record<EntityKind, object>): Output[] {
  const kind = readOption("validateEntity", ENTITY_KINDS);
  getElement<HTMLTextAreaElement>("validateJson").value = JSON.stringify(examples[kind], null, 2);
  return [];
}

function validateJson(): Output[] {
  const kind = readOption("validateEntity", ENTITY_KINDS);
  let parsed: unknown;
  try {
    parsed = JSON.parse(readValue("validateJson"));
  } catch {
    throw new Error("The JSON is not valid — check commas and quotes");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Paste a JSON object");
  }

  // JSON has no Date type, so timestamps arrive as strings.
  switch (kind) {
    case "MenuItem":
      return [{ kind: "validation", result: validateMenuItem(parsed as MenuItem) }];
    case "SaleTransaction": {
      const rawSale = parsed as SaleTransaction & { timestamp: string };
      return [
        { kind: "validation", result: validateSaleTransaction({ ...rawSale, timestamp: new Date(rawSale.timestamp) }) },
      ];
    }
    case "Location":
      return [{ kind: "validation", result: validateLocation(parsed as Location) }];
  }
}

// ---------- Wiring ----------

const ACTIONS: Record<string, () => Output[]> = {
  filterByLocation,
  filterByDateRange,
  filterByCategory,
  filterActive,
  sortByCapacity,
  sortByPrice,
  searchLocationById,
  searchMenuItemByName,
  binarySearchCapacity,
  dailyRevenue,
  locationMargin,
  wasteCost,
  convertAmount,
  rankPerformance,
  salesByPaymentMethod,
  averageTicket,
  topSellingItems,
  wasteByReason,
  countryComparison,
  showDataset,
  loadValidExample: () => loadValidationExample(VALID_EXAMPLES),
  loadInvalidExample: () => loadValidationExample(INVALID_EXAMPLES),
  validateJson,
};

function runAction(button: HTMLElement): void {
  const action = ACTIONS[button.dataset.action ?? ""];
  const output = button.closest("section")?.querySelector("[data-output]");
  if (action === undefined || output == null) {
    return;
  }
  try {
    const outputs = action();
    if (outputs.length > 0) {
      renderOutputs(output, outputs);
    }
  } catch (error) {
    renderOutputs(output, [{ kind: "error", message: error instanceof Error ? error.message : String(error) }]);
  }
}

function fillOptions(select: HTMLSelectElement | HTMLDataListElement, values: string[]): void {
  select.replaceChildren(
    ...values.map((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      return option;
    }),
  );
}

function refreshDatasetControls(): void {
  const locationIds = currentDataset.locations.map((location) => location.id);
  document.querySelectorAll<HTMLSelectElement>("select[data-location-select]").forEach((select) => {
    fillOptions(select, locationIds);
  });
  fillOptions(getElement<HTMLDataListElement>("locationIdOptions"), locationIds);
  fillOptions(
    getElement<HTMLDataListElement>("menuNameOptions"),
    currentDataset.menuItems.map((item) => item.name),
  );

  getElement("statMenuItems").textContent = String(currentDataset.menuItems.length);
  getElement("statLocations").textContent = String(currentDataset.locations.length);
  getElement("statSales").textContent = String(currentDataset.sales.length);
  getElement("statWasteRecords").textContent = String(currentDataset.wasteRecords.length);

  document.querySelectorAll("[data-output]").forEach((output) => output.replaceChildren());
}

function selectDataset(key: DatasetKey): void {
  currentDataset = DATASETS[key];
  refreshDatasetControls();
}

document.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>("button[data-action]");
  if (button !== null) {
    runAction(button);
  }
});

document.querySelectorAll<HTMLInputElement>("input[name='dataset']").forEach((radio) => {
  radio.addEventListener("change", () => selectDataset(radio.value === "extended" ? "extended" : "briefing"));
});

getElement("validateEntity").addEventListener("change", () => {
  loadValidationExample(INVALID_EXAMPLES);
  document.querySelector("#validateJson ~ [data-output]")?.replaceChildren();
});

refreshDatasetControls();
loadValidationExample(INVALID_EXAMPLES);
