import { TradeSchema } from "../targetSchema.ts";
import type { ParseResult } from "../types.ts";
import {
  createTradeError,
  parseRequiredString,
  parsePositiveNumber,
  parseCsvDate,
  validateCurrency,
} from "./parserUtils.ts";

// IBKR uses BOT (bought) and SLD (sold) instead of BUY/SELL
const SIDE_MAP: Record<string, string> = {
    BOT: 'BUY',
    SLD: 'SELL',
};

// IBKR uses "EUR.USD" for forex pairs — normalize to "EUR/USD"
// This only applies to CASH asset class (forex)
function normalizeSymbol(symbol: string, assetClass: string): string {
    if (assetClass?.toUpperCase() === 'CASH') {
        return symbol.replace('.', '/');
    }
    return symbol;
}

// IBKR CSV columns (0-indexed, header-based):
// TradeID | AccountID | Symbol | DateTime | Buy/Sell | Quantity | TradePrice | Currency | Commission | NetAmount | AssetClass
//    0         1           2         3           4          5           6            7            8            9          10

export const ibkrBrokerParser = function (
  attributes: string[],
  content: string
): ParseResult {
  const trades: ParseResult['trades'] = [];
  const errors: ParseResult['errors'] = [];
  let rowIndex = 0; // counts data rows only (not header)

  for (const line of content.split('\n')) {
    const rawLine = line.trim();
    if (!rawLine) continue; // skip empty lines

    rowIndex++;
    const list = rawLine.split(',');

    const rawSymbol = list[2] ?? '';
    const rawDateTime = list[3] ?? '';
    const rawSide = list[4] ?? '';
    const rawQuantity = list[5] ?? '';
    const rawPrice = list[6] ?? '';
    const rawCurrency = list[7] ?? '';
    const rawAssetClass = list[10] ?? '';

    const rawData: Record<string, unknown> = {
      trade_id: list[0],
      account_id: list[1],
      commission: list[8],
      net_amount: list[9],
      asset_class: rawAssetClass,
    };

    const side = SIDE_MAP[rawSide.trim().toUpperCase()];
    if (!side) {
      errors.push(createTradeError(rowIndex, `Unrecognized side value: '${rawSide}'. Expected BOT or SLD.`, rawLine));
      continue;
    }

    const quantity = parsePositiveNumber(rawQuantity, 'quantity', rowIndex, rawLine, errors);
    if (quantity === null) continue;

    const price = parsePositiveNumber(rawPrice, 'price', rowIndex, rawLine, errors);
    if (price === null) continue;

    const executedAt = parseCsvDate(rawDateTime, 'mdy', rowIndex, rawLine, errors);
    if (!executedAt) continue;

    const symbol = parseRequiredString(rawSymbol, 'symbol', rowIndex, rawLine, errors);
    if (!symbol) continue;

    const currency = validateCurrency(rawCurrency, rowIndex, rawLine, errors);
    if (!currency) continue;

    const result = TradeSchema.safeParse({
      symbol: normalizeSymbol(symbol, rawAssetClass),
      side,
      quantity,
      price,
      totalAmount: quantity * price,
      currency,
      executedAt,
      broker: 'ibkr',
      rawData,
    });

    if (!result.success) {
      errors.push(createTradeError(rowIndex, result.error.issues.map((issue) => issue.message).join('; '), rawLine));
      continue;
    }

    trades.push(result.data);
  }

  return {
    broker: 'ibkr',
    trades,
    errors,
    summary: {
      total: rowIndex,
      valid: trades.length,
      skipped: errors.length,
    },
  };
};