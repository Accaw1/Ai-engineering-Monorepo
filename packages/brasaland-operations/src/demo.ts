import { sampleLocations, sampleMenuItems, sampleSales, sampleWasteRecords } from "./data/sampleData.ts";
import {
  filterActiveLocations,
  filterMenuItemsByCategory,
  filterSalesByDateRange,
  filterSalesByLocation,
  sortLocationsByCapacity,
  sortMenuItemsByPrice,
} from "./utils/collections.ts";
import { binarySearchLocationByCapacity, findLocationById, findMenuItemByName } from "./utils/search.ts";
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
} from "./utils/transformations.ts";
import { validateLocation, validateMenuItem, validateSaleTransaction } from "./utils/validations.ts";

function printSection(title: string, value: unknown): void {
  console.log(`\n=== ${title} ===`);
  console.dir(value, { depth: 4 });
}

const reportDate = new Date("2024-03-15T12:00:00");
const sortedByCapacity = sortLocationsByCapacity(sampleLocations, "asc");

printSection("Sales at LOC-MEDELLIN-01", filterSalesByLocation(sampleSales, "LOC-MEDELLIN-01").map((sale) => sale.id));
printSection(
  "Sales on 2024-03-15",
  filterSalesByDateRange(sampleSales, new Date("2024-03-15T00:00:00"), new Date("2024-03-15T23:59:59")).map(
    (sale) => sale.id,
  ),
);
printSection("Meat items", filterMenuItemsByCategory(sampleMenuItems, "Meat").map((item) => item.name));
printSection("Active locations", filterActiveLocations(sampleLocations).map((location) => location.id));
printSection("Locations by capacity (desc)", sortLocationsByCapacity(sampleLocations, "desc").map((l) => l.id));
printSection("Menu by COP price (asc)", sortMenuItemsByPrice(sampleMenuItems, "COP", "asc").map((item) => item.name));

printSection("findLocationById LOC-MIAMI-01", findLocationById(sampleLocations, "LOC-MIAMI-01")?.name ?? null);
printSection("findMenuItemByName 'french fries'", findMenuItemByName(sampleMenuItems, "french fries")?.id ?? null);
printSection("binarySearch capacity 100", binarySearchLocationByCapacity(sortedByCapacity, 100));
printSection("binarySearch capacity 55", binarySearchLocationByCapacity(sortedByCapacity, 55));

printSection("Daily revenue 2024-03-15", {
  USD: calculateDailyRevenue(sampleSales, reportDate, "USD"),
  COP: calculateDailyRevenue(sampleSales, reportDate, "COP"),
});
printSection("Margin % by location (USD)", {
  "LOC-MEDELLIN-01": calculateLocationMargin(sampleSales, sampleMenuItems, "LOC-MEDELLIN-01", "USD"),
  "LOC-MIAMI-01": calculateLocationMargin(sampleSales, sampleMenuItems, "LOC-MIAMI-01", "USD"),
});
printSection("Waste cost LOC-MEDELLIN-01 (COP)", calculateWasteCost(sampleWasteRecords, "LOC-MEDELLIN-01", "COP"));
printSection("Convert 18.5 USD to COP", convertCurrency(18.5, "USD", "COP"));

printSection(
  "Performance ranking",
  rankLocationsByPerformance(sampleLocations, sampleSales, sampleWasteRecords, sampleMenuItems).map(
    ({ location, score }) => ({ location: location.id, score }),
  ),
);
printSection("Sales by payment method", countSalesByPaymentMethod(sampleSales));
printSection("Average ticket (USD)", calculateAverageTicket(sampleSales, "USD"));
printSection(
  "Top 2 selling items",
  findTopSellingItems(sampleSales, sampleMenuItems, 2).map(({ item, totalSold }) => ({ item: item.name, totalSold })),
);
printSection(
  "Waste by reason",
  Object.fromEntries(
    Object.entries(groupWasteByReason(sampleWasteRecords)).map(([reason, records]) => [reason, records.length]),
  ),
);
printSection("Country comparison", calculateCountryComparison(sampleSales, sampleLocations, sampleMenuItems));

printSection("Validate sample menu item", validateMenuItem(sampleMenuItems[0]));
printSection("Validate sample sale", validateSaleTransaction(sampleSales[0]));
printSection("Validate sample location", validateLocation(sampleLocations[0]));
printSection(
  "Validate invalid location",
  validateLocation({ ...sampleLocations[1], openingYear: 2005, seatingCapacity: 0, monthlyRentCost: { USD: 0, COP: 0 } }),
);
