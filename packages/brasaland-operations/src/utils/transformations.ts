import type {
  Country,
  CountryComparison,
  CountryMetrics,
  Currency,
  Location,
  LocationScore,
  MenuItem,
  PaymentMethod,
  Price,
  SaleTransaction,
  TopSellingItem,
  WasteReason,
  WasteRecord,
} from "../types/models.ts";
import { PAYMENT_METHODS, WASTE_REASONS } from "../types/models.ts";
import { filterSalesByLocation } from "./collections.ts";
import { findLocationById } from "./search.ts";

const COP_PER_USD = 4000;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const REVENUE_MAX_POINTS = 40;
const REVENUE_TARGET_DAILY_USD = 1000;
const EFFICIENCY_MAX_POINTS = 30;
const WASTE_MAX_POINTS = 20;
const WASTE_PENALTY_PER_PERCENT = 2;
const MARGIN_MAX_POINTS = 10;

// ---------- Helpers ----------

export function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isSameCalendarDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function sumSalesRevenue(sales: SaleTransaction[], currency: Currency): number {
  return sales.reduce((total, sale) => total + sale.totalPrice[currency], 0);
}

function sumWasteCost(wasteRecords: WasteRecord[], currency: Currency): number {
  return wasteRecords.reduce((total, record) => total + record.cost[currency], 0);
}

function buildMenuItemIndex(menuItems: MenuItem[]): Map<string, MenuItem> {
  return new Map(menuItems.map((item) => [item.id, item]));
}

function filterWasteByLocation(wasteRecords: WasteRecord[], locationId: string): WasteRecord[] {
  return wasteRecords.filter((record) => record.locationId === locationId);
}

// ---------- Financial calculations ----------

export function calculateDailyRevenue(sales: SaleTransaction[], date: Date, currency: Currency): number {
  const salesOnDate = sales.filter((sale) => isSameCalendarDay(sale.timestamp, date));
  return roundToTwoDecimals(sumSalesRevenue(salesOnDate, currency));
}

export function calculateLocationMargin(
  sales: SaleTransaction[],
  menuItems: MenuItem[],
  locationId: string,
  currency: Currency,
): number {
  const menuItemIndex = buildMenuItemIndex(menuItems);
  // Sales whose item is not on the menu are skipped: without an ingredient cost
  // they would inflate the margin.
  const costedSales = filterSalesByLocation(sales, locationId).filter((sale) => menuItemIndex.has(sale.itemId));

  const totalRevenue = sumSalesRevenue(costedSales, currency);
  if (totalRevenue <= 0) {
    return 0;
  }

  const totalIngredientCost = costedSales.reduce((total, sale) => {
    const item = menuItemIndex.get(sale.itemId) as MenuItem;
    return total + item.ingredientCost[currency] * sale.quantity;
  }, 0);

  const marginPercentage = ((totalRevenue - totalIngredientCost) / totalRevenue) * 100;
  return roundToTwoDecimals(clamp(marginPercentage, 0, 100));
}

export function calculateWasteCost(wasteRecords: WasteRecord[], locationId: string, currency: Currency): number {
  return roundToTwoDecimals(sumWasteCost(filterWasteByLocation(wasteRecords, locationId), currency));
}

export function convertCurrency(amount: number, fromCurrency: Currency, toCurrency: Currency): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  const converted = fromCurrency === "USD" ? amount * COP_PER_USD : amount / COP_PER_USD;
  return roundToTwoDecimals(converted);
}

// ---------- Location performance scoring ----------

export function calculateOperatingDays(openingYear: number, referenceDate: Date): number {
  const openingDate = new Date(openingYear, 0, 1);
  const elapsedDays = Math.floor((referenceDate.getTime() - openingDate.getTime()) / MILLISECONDS_PER_DAY);
  return Math.max(elapsedDays, 1);
}

function scoreRevenue(totalRevenueUSD: number, operatingDays: number): number {
  const averageDailyRevenueUSD = totalRevenueUSD / operatingDays;
  return Math.min((averageDailyRevenueUSD / REVENUE_TARGET_DAILY_USD) * REVENUE_MAX_POINTS, REVENUE_MAX_POINTS);
}

function scoreEfficiency(totalSalesCount: number, seatingCapacity: number): number {
  if (seatingCapacity <= 0) {
    return 0;
  }
  return Math.min((totalSalesCount / seatingCapacity) * EFFICIENCY_MAX_POINTS, EFFICIENCY_MAX_POINTS);
}

function scoreWasteControl(totalWasteCostUSD: number, totalRevenueUSD: number): number {
  if (totalRevenueUSD <= 0) {
    // No revenue: any waste is a total loss, no waste means nothing to penalize.
    return totalWasteCostUSD > 0 ? 0 : WASTE_MAX_POINTS;
  }
  const wastePercentage = (totalWasteCostUSD / totalRevenueUSD) * 100;
  return Math.max(WASTE_MAX_POINTS - wastePercentage * WASTE_PENALTY_PER_PERCENT, 0);
}

function scoreProfitMargin(marginPercentage: number): number {
  return Math.min(marginPercentage / 10, MARGIN_MAX_POINTS);
}

export function scoreLocationPerformance(
  location: Location,
  sales: SaleTransaction[],
  wasteRecords: WasteRecord[],
  menuItems: MenuItem[],
  referenceDate: Date = new Date(),
): number {
  const locationSales = filterSalesByLocation(sales, location.id);
  const totalRevenueUSD = sumSalesRevenue(locationSales, "USD");
  const totalWasteCostUSD = sumWasteCost(filterWasteByLocation(wasteRecords, location.id), "USD");
  const operatingDays = calculateOperatingDays(location.openingYear, referenceDate);
  const marginPercentage = calculateLocationMargin(sales, menuItems, location.id, "USD");

  const totalScore =
    scoreRevenue(totalRevenueUSD, operatingDays) +
    scoreEfficiency(locationSales.length, location.seatingCapacity) +
    scoreWasteControl(totalWasteCostUSD, totalRevenueUSD) +
    scoreProfitMargin(marginPercentage);

  return roundToTwoDecimals(totalScore);
}

export function rankLocationsByPerformance(
  locations: Location[],
  sales: SaleTransaction[],
  wasteRecords: WasteRecord[],
  menuItems: MenuItem[],
  referenceDate: Date = new Date(),
): LocationScore[] {
  return locations
    .map((location) => ({
      location,
      score: scoreLocationPerformance(location, sales, wasteRecords, menuItems, referenceDate),
    }))
    .sort((a, b) => b.score - a.score);
}

// ---------- Aggregations and reports ----------

export function countSalesByPaymentMethod(sales: SaleTransaction[]): Record<PaymentMethod, number> {
  return Object.fromEntries(
    PAYMENT_METHODS.map((method) => [method, sales.filter((sale) => sale.paymentMethod === method).length]),
  ) as Record<PaymentMethod, number>;
}

export function calculateAverageTicket(sales: SaleTransaction[], currency: Currency): number {
  if (sales.length === 0) {
    return 0;
  }
  return roundToTwoDecimals(sumSalesRevenue(sales, currency) / sales.length);
}

function sumQuantitySoldByItem(sales: SaleTransaction[]): Map<string, number> {
  return sales.reduce(
    (totals, sale) => totals.set(sale.itemId, (totals.get(sale.itemId) ?? 0) + sale.quantity),
    new Map<string, number>(),
  );
}

export function findTopSellingItems(sales: SaleTransaction[], menuItems: MenuItem[], topN: number): TopSellingItem[] {
  if (topN <= 0) {
    return [];
  }

  const quantityByItemId = sumQuantitySoldByItem(sales);

  return menuItems
    .filter((item) => quantityByItemId.has(item.id))
    .map((item) => ({ item, totalSold: quantityByItemId.get(item.id) as number }))
    .sort((a, b) => b.totalSold - a.totalSold || a.item.name.localeCompare(b.item.name))
    .slice(0, topN);
}

export function groupWasteByReason(wasteRecords: WasteRecord[]): Record<WasteReason, WasteRecord[]> {
  return Object.fromEntries(
    WASTE_REASONS.map((reason) => [reason, wasteRecords.filter((record) => record.reason === reason)]),
  ) as Record<WasteReason, WasteRecord[]>;
}

function sumPrices(prices: Price[]): Price {
  return prices.reduce((total, price) => ({ USD: total.USD + price.USD, COP: total.COP + price.COP }), {
    USD: 0,
    COP: 0,
  });
}

function divideAndRoundPrice(price: Price, divisor: number): Price {
  if (divisor <= 0) {
    return { USD: 0, COP: 0 };
  }
  return { USD: roundToTwoDecimals(price.USD / divisor), COP: roundToTwoDecimals(price.COP / divisor) };
}

function buildCountryMetrics(country: Country, sales: SaleTransaction[], locations: Location[]): CountryMetrics {
  const countryLocations = locations.filter((location) => location.country === country);
  const countrySales = sales.filter((sale) => findLocationById(countryLocations, sale.locationId) !== null);
  const rawRevenue = sumPrices(countrySales.map((sale) => sale.totalPrice));
  const totalRevenue: Price = { USD: roundToTwoDecimals(rawRevenue.USD), COP: roundToTwoDecimals(rawRevenue.COP) };

  return {
    totalLocations: countryLocations.length,
    totalRevenue,
    averageRevenuePerLocation: divideAndRoundPrice(totalRevenue, countryLocations.length),
    totalSales: countrySales.length,
  };
}

export function calculateCountryComparison(
  sales: SaleTransaction[],
  locations: Location[],
  // Kept to match the signature in BRIEFING.md; revenue already comes from each sale's totalPrice.
  _menuItems: MenuItem[],
): CountryComparison {
  return {
    Colombia: buildCountryMetrics("Colombia", sales, locations),
    USA: buildCountryMetrics("USA", sales, locations),
  };
}
