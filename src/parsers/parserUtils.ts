import type { TradeError } from "../types.ts";

export function createTradeError(row: number, reason: string, rawLine: string): TradeError {
  return {
    row,
    reason,
    rawLine,
  };
}

export function parseRequiredString(
  raw: string | undefined,
  field: string,
  row: number,
  rawLine: string,
  errors: TradeError[]
): string | null {
  const value = raw?.trim() ?? "";
  if (!value) {
    errors.push(createTradeError(row, `Missing required field '${field}'.`, rawLine));
    return null;
  }
  return value;
}

export function parsePositiveNumber(
  raw: string | undefined,
  field: string,
  row: number,
  rawLine: string,
  errors: TradeError[]
): number | null {
  const value = raw?.trim() ?? "";
  if (!value) {
    errors.push(createTradeError(row, `Missing required field '${field}'.`, rawLine));
    return null;
  }

  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  if (Number.isNaN(parsed) || parsed <= 0) {
    errors.push(createTradeError(row, `Invalid ${field}: '${raw}'. Expected a positive number.`, rawLine));
    return null;
  }
  return parsed;
}

export function parseCsvDate(
  raw: string | undefined,
  order: "mdy" | "dmy",
  row: number,
  rawLine: string,
  errors: TradeError[]
): string | null {
  if (!raw || raw.trim() === "") {
    errors.push(createTradeError(row, "Missing executed date.", rawLine));
    return null;
  }

  const input = raw.trim();
  if (input.includes("T")) {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) {
      errors.push(createTradeError(row, `Invalid date format: '${input}'.`, rawLine));
      return null;
    }
    return date.toISOString();
  }

  const parts = input.split("/");
  if (parts.length !== 3) {
    errors.push(createTradeError(row, `Unrecognized date format: '${input}'.`, rawLine));
    return null;
  }

  const [first, second, year] = parts;
  const [month, day] = order === "mdy" ? [first, second] : [second, first];
  const normalized = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    errors.push(createTradeError(row, `Invalid date components: '${input}'.`, rawLine));
    return null;
  }

  return date.toISOString();
}

export function validateCurrency(
  raw: string | undefined,
  row: number,
  rawLine: string,
  errors: TradeError[]
): string | null {
  const currency = raw?.trim().toUpperCase() ?? "";
  if (!currency || currency.length !== 3) {
    errors.push(createTradeError(row, `Invalid currency value: '${raw ?? ""}'. Expected a 3-letter ISO currency code.`, rawLine));
    return null;
  }
  return currency;
}
