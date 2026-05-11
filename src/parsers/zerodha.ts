import { TradeSchema } from "../targetSchema.ts";
import type { ParseResult } from "../types.ts";
import {
  createTradeError,
  parseRequiredString,
  parsePositiveNumber,
  parseCsvDate,
} from "./parserUtils.ts";

export const zerodhaBrokerParser = function (attributes: string[], content: string): ParseResult {
  const trades: ParseResult['trades'] = [];
  const errors: ParseResult['errors'] = [];
  let rowIndex = 0;

  for (const line of content.split('\n')) {
    const rawLine = line.trim();
    if (!rawLine) continue; // skip empty lines

    rowIndex++;
    const list = rawLine.split(',');

    const symbol = parseRequiredString(list[0], 'symbol', rowIndex, rawLine, errors);
    if (!symbol) continue;

    const rawSide = list[3] ?? '';
    const side = rawSide.trim().toUpperCase();
    if (side !== 'BUY' && side !== 'SELL') {
      errors.push(createTradeError(rowIndex, `Invalid side value: '${rawSide}'. Expected BUY or SELL.`, rawLine));
      continue;
    }

    const quantity = parsePositiveNumber(list[4], 'quantity', rowIndex, rawLine, errors);
    if (quantity === null) continue;

    const price = parsePositiveNumber(list[5], 'price', rowIndex, rawLine, errors);
    if (price === null) continue;

    const executedAt = parseCsvDate(list[2], 'dmy', rowIndex, rawLine, errors);
    if (!executedAt) continue;

    const rawData = {
      isin: list[1],
      trade_id: list[6],
      order_id: list[7],
      exchange: list[8],
      segment: list[9],
    };

    const result = TradeSchema.safeParse({
      symbol,
      side,
      quantity,
      price,
      totalAmount: quantity * price,
      currency: 'INR',
      executedAt,
      broker: 'zerodha',
      rawData,
    });

    if (!result.success) {
      errors.push(createTradeError(rowIndex, result.error.issues.map((issue) => issue.message).join('; '), rawLine));
      continue;
    }

    trades.push(result.data);
  }

  return {
    broker: 'zerodha',
    trades,
    errors,
    summary: {
      total: rowIndex,
      valid: trades.length,
      skipped: errors.length,
    },
  };
};

