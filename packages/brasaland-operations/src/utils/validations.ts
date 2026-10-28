import type { Location, MenuItem, Price, SaleTransaction, ValidationResult } from "../types/models.ts";

const FIRST_OPENING_YEAR = 2008;
const MAX_PREP_TIME_MINUTES = 60;

// ---------- Rule predicates ----------

export function isPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function isNonEmptyString(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function isPositivePrice(price: Price | null | undefined): boolean {
  return price != null && isPositiveNumber(price.USD) && isPositiveNumber(price.COP);
}

export function isValidDate(value: Date): boolean {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function isWithinRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

function buildValidationResult(errors: string[]): ValidationResult {
  return { valid: errors.length === 0, errors };
}

// ---------- Entity validations ----------

export function validateMenuItem(item: MenuItem): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(item.name)) {
    errors.push("name must not be empty");
  }
  if (!isPositivePrice(item.basePrice)) {
    errors.push("basePrice USD and COP must be greater than 0");
  }
  if (!isPositivePrice(item.ingredientCost)) {
    errors.push("ingredientCost USD and COP must be greater than 0");
  }
  if (!isPositiveNumber(item.prepTimeMinutes) || item.prepTimeMinutes > MAX_PREP_TIME_MINUTES) {
    errors.push(`prepTimeMinutes must be greater than 0 and at most ${MAX_PREP_TIME_MINUTES}`);
  }
  if (!item.isAvailableInColombia && !item.isAvailableInUSA) {
    errors.push("item must be available in at least one country");
  }

  return buildValidationResult(errors);
}

export function validateSaleTransaction(sale: SaleTransaction): ValidationResult {
  const errors: string[] = [];

  if (!isPositiveNumber(sale.quantity)) {
    errors.push("quantity must be greater than 0");
  }
  if (!isPositivePrice(sale.totalPrice)) {
    errors.push("totalPrice USD and COP must be greater than 0");
  }
  if (!isNonEmptyString(sale.waiterName)) {
    errors.push("waiterName must not be empty");
  }
  if (!isValidDate(sale.timestamp)) {
    errors.push("timestamp must be a valid date");
  }

  return buildValidationResult(errors);
}

export function validateLocation(location: Location, currentYear: number = new Date().getFullYear()): ValidationResult {
  const errors: string[] = [];

  if (!Number.isInteger(location.openingYear) || !isWithinRange(location.openingYear, FIRST_OPENING_YEAR, currentYear)) {
    errors.push(`openingYear must be between ${FIRST_OPENING_YEAR} and ${currentYear}`);
  }
  if (!isPositiveNumber(location.seatingCapacity)) {
    errors.push("seatingCapacity must be greater than 0");
  }
  if (!isPositiveNumber(location.staffCount)) {
    errors.push("staffCount must be greater than 0");
  }
  if (!isPositivePrice(location.monthlyRentCost)) {
    errors.push("monthlyRentCost USD and COP must be greater than 0");
  }
  if (!isPositivePrice(location.averageMonthlyUtilities)) {
    errors.push("averageMonthlyUtilities USD and COP must be greater than 0");
  }

  return buildValidationResult(errors);
}
