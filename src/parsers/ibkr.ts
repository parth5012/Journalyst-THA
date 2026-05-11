import { TradeSchema } from "../targetSchema.js";
import type { ParseResult, TradeError } from "../types.js";

// IBKR uses BOT (bought) and SLD (sold) instead of BUY/SELL
const SIDE_MAP: Record<string, string> = {
    BOT: 'BUY',
    SLD: 'SELL',
};

// Normalize IBKR DateTime to ISO 8601
// Handles two formats from the PDF:
//   - ISO with timezone: "2026-04-01T14:30:00Z"  → pass through
//   - MM/DD/YYYY (no time): "04/03/2026"          → treat as UTC midnight
function parseIbkrDate(raw: string): string {
    if (!raw || raw.trim() === '') throw new Error(`Missing date`);

    // ISO format — contains a 'T' separator
    if (raw.includes('T')) {
        const d = new Date(raw);
        if (isNaN(d.getTime())) throw new Error(`Invalid date: '${raw}'`);
        return d.toISOString();
    }

    // MM/DD/YYYY fallback (e.g. row 4 in the PDF sample)
    const parts = raw.split('/');
    if (parts.length === 3) {
        const [mm, dd, yyyy] = parts;
        const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
        if (isNaN(d.getTime())) throw new Error(`Invalid date: '${raw}'`);
        return d.toISOString();
    }

    throw new Error(`Unrecognized date format: '${raw}'`);
}

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

export const internationalBrokers = function (
    attributes: Array<string>,
    content: string
): ParseResult {
    const trades: ParseResult['trades'] = [];
    const errors: TradeError[] = [];
    let rowIndex = 0; // counts data rows only (not header)

    for (const line of content.split('\n')) {
        if (!line.trim()) continue; // skip empty lines

        rowIndex++;
        const list = line.split(',');

        const rawSymbol    = list[2]  ?? '';
        const rawDateTime  = list[3]  ?? '';
        const rawSide      = list[4]  ?? '';
        const rawQuantity  = list[5]  ?? '';
        const rawPrice     = list[6]  ?? '';
        const rawCurrency  = list[7]  ?? '';
        const rawAssetClass = list[10] ?? '';

        // rawData stores ALL fields — nothing is discarded (as required by the THA)
        const rawData: Record<string, unknown> = {
            trade_id:    list[0],
            account_id:  list[1],
            commission:  list[8],   // may be empty (row 6 edge case)
            net_amount:  list[9],
            asset_class: rawAssetClass,
        };

        // --- Validate and map side ---
        const side = SIDE_MAP[rawSide?.toUpperCase()];
        if (!side) {
            errors.push({
                row: rowIndex,
                reason: `Unrecognized side value: '${rawSide}'. Expected BOT or SLD.`,
                rawLine: line,
            });
            continue;
        }

        // --- Validate quantity (must be positive) ---
        const quantity = parseFloat(rawQuantity);
        if (isNaN(quantity) || quantity <= 0) {
            errors.push({
                row: rowIndex,
                reason: `Quantity must be positive, got '${rawQuantity}'`,
                rawLine: line,
            });
            continue;
        }

        // --- Validate price ---
        const price = parseFloat(rawPrice);
        if (isNaN(price) || price <= 0) {
            errors.push({
                row: rowIndex,
                reason: `Price must be positive, got '${rawPrice}'`,
                rawLine: line,
            });
            continue;
        }

        // --- Normalize date ---
        let executedAt: string;
        try {
            executedAt = parseIbkrDate(rawDateTime);
        } catch (e) {
            errors.push({
                row: rowIndex,
                reason: (e as Error).message,
                rawLine: line,
            });
            continue;
        }

        // --- Normalize symbol (EUR.USD → EUR/USD for forex) ---
        const symbol = normalizeSymbol(rawSymbol, rawAssetClass);

        // --- Validate currency (must be 3 chars) ---
        const currency = rawCurrency?.trim();
        if (!currency || currency.length !== 3) {
            errors.push({
                row: rowIndex,
                reason: `Invalid or missing currency: '${currency}'`,
                rawLine: line,
            });
            continue;
        }

        // --- Parse and validate with Zod ---
        const result = TradeSchema.safeParse({
            symbol,
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
            errors.push({
                row: rowIndex,
                reason: result.error.issues.map(i => i.message).join('; '),
                rawLine: line,
            });
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