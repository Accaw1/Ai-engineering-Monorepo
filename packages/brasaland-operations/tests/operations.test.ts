import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sampleLocations, sampleMenuItems, sampleSales, sampleWasteRecords } from "../src/data/sampleData.ts";
import type { Location, MenuItem, SaleTransaction, WasteRecord } from "../src/types/models.ts";
import {
  filterActiveLocations,
  filterMenuItemsByCategory,
  filterSalesByDateRange,
  filterSalesByLocation,
  sortLocationsByCapacity,
  sortMenuItemsByPrice,
} from "../src/utils/collections.ts";
import { binarySearchLocationByCapacity, findLocationById, findMenuItemByName } from "../src/utils/search.ts";
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
  scoreLocationPerformance,
} from "../src/utils/transformations.ts";
import { validateLocation, validateMenuItem, validateSaleTransaction } from "../src/utils/validations.ts";

function buildLocation(overrides: Partial<Location>): Location {
  return { ...sampleLocations[0], ...overrides };
}

describe("collections", () => {
  it("filters sales by location", () => {
    assert.deepEqual(
      filterSalesByLocation(sampleSales, "LOC-MIAMI-01").map((sale) => sale.id),
      ["TXN-2024-15483"],
    );
    assert.deepEqual(filterSalesByLocation(sampleSales, "LOC-UNKNOWN"), []);
    assert.deepEqual(filterSalesByLocation([], "LOC-MIAMI-01"), []);
  });

  it("filters sales by inclusive date range", () => {
    const exactStart = sampleSales[0].timestamp;
    const exactEnd = sampleSales[1].timestamp;
    assert.equal(filterSalesByDateRange(sampleSales, exactStart, exactEnd).length, 2);
    assert.equal(filterSalesByDateRange(sampleSales, exactEnd, exactEnd).length, 1);
    assert.equal(filterSalesByDateRange(sampleSales, exactEnd, exactStart).length, 0);
  });

  it("filters menu items by category and active locations", () => {
    assert.deepEqual(
      filterMenuItemsByCategory(sampleMenuItems, "Side").map((item) => item.id),
      ["ITEM-FRIES"],
    );
    assert.deepEqual(filterMenuItemsByCategory(sampleMenuItems, "Dessert"), []);
    const closed = buildLocation({ id: "LOC-CLOSED", status: "Temporarily closed" });
    assert.equal(filterActiveLocations([...sampleLocations, closed]).length, 2);
  });

  it("sorts without mutating the original array", () => {
    const original = [...sampleLocations].reverse();
    const snapshot = [...original];
    assert.deepEqual(
      sortLocationsByCapacity(original, "asc").map((l) => l.seatingCapacity),
      [80, 100],
    );
    assert.deepEqual(
      sortLocationsByCapacity(original, "desc").map((l) => l.seatingCapacity),
      [100, 80],
    );
    assert.deepEqual(original, snapshot);

    assert.deepEqual(
      sortMenuItemsByPrice(sampleMenuItems, "USD", "desc").map((item) => item.id),
      ["ITEM-PICANHA-250", "ITEM-FRIES", "ITEM-COKE"],
    );
    assert.deepEqual(
      sortMenuItemsByPrice(sampleMenuItems, "COP", "asc").map((item) => item.id),
      ["ITEM-COKE", "ITEM-FRIES", "ITEM-PICANHA-250"],
    );
  });
});

describe("search", () => {
  it("finds a location by id with linear search", () => {
    assert.equal(findLocationById(sampleLocations, "LOC-MIAMI-01")?.city, "Miami");
    assert.equal(findLocationById(sampleLocations, "LOC-NOPE"), null);
    assert.equal(findLocationById([], "LOC-MIAMI-01"), null);
  });

  it("finds a menu item by name, case-insensitive", () => {
    assert.equal(findMenuItemByName(sampleMenuItems, "PICANHA 250G")?.id, "ITEM-PICANHA-250");
    assert.equal(findMenuItemByName(sampleMenuItems, "Arepa"), null);
    assert.equal(findMenuItemByName(sampleMenuItems, ""), null);
  });

  it("binary searches locations sorted by capacity", () => {
    const sorted = [20, 40, 60, 80, 100, 120].map((capacity) =>
      buildLocation({ id: `LOC-${capacity}`, seatingCapacity: capacity }),
    );
    sorted.forEach((location, index) => {
      assert.equal(binarySearchLocationByCapacity(sorted, location.seatingCapacity), index);
    });
    assert.equal(binarySearchLocationByCapacity(sorted, 10), -1);
    assert.equal(binarySearchLocationByCapacity(sorted, 70), -1);
    assert.equal(binarySearchLocationByCapacity(sorted, 130), -1);
    assert.equal(binarySearchLocationByCapacity([], 80), -1);
  });
});

describe("financial calculations", () => {
  it("calculates daily revenue in both currencies", () => {
    const day = new Date("2024-03-15T08:00:00");
    assert.equal(calculateDailyRevenue(sampleSales, day, "USD"), 50.5);
    assert.equal(calculateDailyRevenue(sampleSales, day, "COP"), 202000);
    assert.equal(calculateDailyRevenue(sampleSales, new Date("2024-03-16T08:00:00"), "USD"), 0);
  });

  it("calculates location margin", () => {
    assert.equal(calculateLocationMargin(sampleSales, sampleMenuItems, "LOC-MEDELLIN-01", "USD"), 61.08);
    assert.equal(calculateLocationMargin(sampleSales, sampleMenuItems, "LOC-MEDELLIN-01", "COP"), 61.08);
    assert.equal(calculateLocationMargin(sampleSales, sampleMenuItems, "LOC-MIAMI-01", "USD"), 73.33);
    assert.equal(calculateLocationMargin(sampleSales, sampleMenuItems, "LOC-NOPE", "USD"), 0);
    assert.equal(calculateLocationMargin(sampleSales, [], "LOC-MIAMI-01", "USD"), 0);
  });

  it("calculates waste cost and converts currency", () => {
    assert.equal(calculateWasteCost(sampleWasteRecords, "LOC-MEDELLIN-01", "USD"), 7.2);
    assert.equal(calculateWasteCost(sampleWasteRecords, "LOC-MIAMI-01", "COP"), 9600);
    assert.equal(calculateWasteCost([], "LOC-MIAMI-01", "COP"), 0);
    assert.equal(convertCurrency(18.5, "USD", "COP"), 74000);
    assert.equal(convertCurrency(10000, "COP", "USD"), 2.5);
    assert.equal(convertCurrency(1, "COP", "USD"), 0);
    assert.equal(convertCurrency(12.345, "USD", "USD"), 12.345);
  });
});

describe("performance scoring", () => {
  const steakhouseItem: MenuItem = {
    ...sampleMenuItems[0],
    id: "ITEM-TEST",
    ingredientCost: { USD: 1000, COP: 4000000 },
  };
  const testLocation = buildLocation({ id: "LOC-TEST", openingYear: 2024, seatingCapacity: 2 });
  const testSales: SaleTransaction[] = [1, 2].map((n) => ({
    ...sampleSales[0],
    id: `TXN-TEST-${n}`,
    locationId: "LOC-TEST",
    itemId: "ITEM-TEST",
    quantity: 1,
    totalPrice: { USD: 5000, COP: 20000000 },
  }));
  const testWaste: WasteRecord[] = [
    { ...sampleWasteRecords[0], locationId: "LOC-TEST", cost: { USD: 100, COP: 400000 } },
  ];
  const tenDaysAfterOpening = new Date(2024, 0, 11);

  it("scores each component per the briefing formula", () => {
    // revenue 40 (1000 USD/day) + efficiency 30 + waste 18 (1%) + margin 8 (80%)
    assert.equal(
      scoreLocationPerformance(testLocation, testSales, testWaste, [steakhouseItem], tenDaysAfterOpening),
      96,
    );
  });

  it("handles a location with no activity", () => {
    assert.equal(scoreLocationPerformance(testLocation, [], [], [], tenDaysAfterOpening), 20);
    assert.equal(scoreLocationPerformance(testLocation, [], testWaste, [], tenDaysAfterOpening), 0);
  });

  it("ranks locations from highest to lowest score", () => {
    const ranking = rankLocationsByPerformance(
      [...sampleLocations, testLocation],
      [...sampleSales, ...testSales],
      [...sampleWasteRecords, ...testWaste],
      [...sampleMenuItems, steakhouseItem],
      tenDaysAfterOpening,
    );
    assert.equal(ranking[0].location.id, "LOC-TEST");
    assert.ok(ranking.every((entry, i) => i === 0 || ranking[i - 1].score >= entry.score));
    assert.deepEqual(rankLocationsByPerformance([], sampleSales, [], sampleMenuItems), []);
  });
});

describe("aggregations and reports", () => {
  it("counts sales by payment method including zeros", () => {
    assert.deepEqual(countSalesByPaymentMethod(sampleSales), {
      Cash: 1,
      "Credit card": 1,
      "Debit card": 0,
      "Digital wallet": 0,
    });
    assert.deepEqual(Object.values(countSalesByPaymentMethod([])), [0, 0, 0, 0]);
  });

  it("calculates average ticket", () => {
    assert.equal(calculateAverageTicket(sampleSales, "USD"), 25.25);
    assert.equal(calculateAverageTicket(sampleSales, "COP"), 101000);
    assert.equal(calculateAverageTicket([], "USD"), 0);
  });

  it("finds top selling items", () => {
    const top = findTopSellingItems(sampleSales, sampleMenuItems, 5);
    assert.deepEqual(
      top.map(({ item, totalSold }) => [item.id, totalSold]),
      [
        ["ITEM-FRIES", 3],
        ["ITEM-PICANHA-250", 2],
      ],
    );
    assert.equal(findTopSellingItems(sampleSales, sampleMenuItems, 1).length, 1);
    assert.deepEqual(findTopSellingItems(sampleSales, sampleMenuItems, 0), []);
    assert.deepEqual(findTopSellingItems([], sampleMenuItems, 3), []);
  });

  it("groups waste by reason with every reason present", () => {
    const groups = groupWasteByReason(sampleWasteRecords);
    assert.equal(groups["Cooking error"].length, 1);
    assert.equal(groups.Expired.length, 1);
    assert.deepEqual(groups.Damage, []);
    assert.equal(Object.keys(groupWasteByReason([])).length, 5);
  });

  it("compares countries", () => {
    const comparison = calculateCountryComparison(sampleSales, sampleLocations, sampleMenuItems);
    assert.deepEqual(comparison.Colombia, {
      totalLocations: 1,
      totalRevenue: { USD: 37, COP: 148000 },
      averageRevenuePerLocation: { USD: 37, COP: 148000 },
      totalSales: 1,
    });
    assert.deepEqual(calculateCountryComparison([], [], []).USA, {
      totalLocations: 0,
      totalRevenue: { USD: 0, COP: 0 },
      averageRevenuePerLocation: { USD: 0, COP: 0 },
      totalSales: 0,
    });
  });
});

describe("validations", () => {
  it("accepts the sample data", () => {
    sampleMenuItems.forEach((item) => assert.deepEqual(validateMenuItem(item), { valid: true, errors: [] }));
    sampleSales.forEach((sale) => assert.equal(validateSaleTransaction(sale).valid, true));
    sampleLocations.forEach((location) => assert.equal(validateLocation(location, 2024).valid, true));
  });

  it("rejects invalid menu items", () => {
    const result = validateMenuItem({
      ...sampleMenuItems[0],
      name: "  ",
      basePrice: { USD: 0, COP: 74000 },
      prepTimeMinutes: 61,
      isAvailableInColombia: false,
      isAvailableInUSA: false,
    });
    assert.equal(result.valid, false);
    assert.equal(result.errors.length, 4);
    assert.equal(validateMenuItem({ ...sampleMenuItems[0], prepTimeMinutes: 0 }).valid, false);
    assert.equal(validateMenuItem({ ...sampleMenuItems[0], prepTimeMinutes: 60 }).valid, true);
  });

  it("rejects invalid sales", () => {
    const result = validateSaleTransaction({
      ...sampleSales[0],
      quantity: 0,
      totalPrice: { USD: 37, COP: -1 },
      waiterName: "",
      timestamp: new Date("not a date"),
    });
    assert.equal(result.valid, false);
    assert.equal(result.errors.length, 4);
  });

  it("rejects invalid locations", () => {
    assert.equal(validateLocation({ ...sampleLocations[0], openingYear: 2007 }, 2024).valid, false);
    assert.equal(validateLocation({ ...sampleLocations[0], openingYear: 2025 }, 2024).valid, false);
    assert.equal(validateLocation({ ...sampleLocations[0], openingYear: 2024 }, 2024).valid, true);
    const result = validateLocation(
      {
        ...sampleLocations[0],
        seatingCapacity: 0,
        staffCount: -3,
        monthlyRentCost: { USD: 1500, COP: 0 },
        averageMonthlyUtilities: { USD: 0, COP: 1600000 },
      },
      2024,
    );
    assert.equal(result.errors.length, 4);
  });
});
