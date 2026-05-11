import { TradeSchema } from "../targetSchema.js";
import type { ParseResult, TradeError } from "../types.js";

const parseZerodhaDate = function(raw:string){
    if (!raw || raw.trim() === '') throw new Error(`Missing date`)
    
    if (raw.includes('T')) {
        const d = new Date(raw);
        if (isNaN(d.getTime())) throw new Error(`Invalid date: '${raw}'`);
        return d.toISOString();
    }
    const parts = raw.split('/');
    if (parts.length === 3) {
        const [dd, mm, yyyy] = parts;
        const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
        if (isNaN(d.getTime())) throw new Error(`Invalid date: '${raw}'`);
        return d.toISOString();
    }
    throw new Error(`Unrecognized date format: '${raw}'`);
}


export const zerodhaBrokerParser = function(attributes:Array<string>,content:string){
    const trades: ParseResult['trades'] = [];
    const errors: TradeError[] = [];
    let rowIndex = 0;
    for(const line of content.split('\n')){
        if (!line.trim()) continue  // also skip empty lines
        rowIndex++;
        const list = line.split(',');

        const symbol = list[0];
        const rawQuantity = parseFloat(list[4] ?? '0');
        const rawPrice = parseFloat(list[5] ?? '0');
        const rawSide = list[3];
        const rawData = {
            'isin': list[1],
            'trade_id': list[6],
            'order_id': list[7],
            'exchange': list[8],
            'segment': list[9]
        }
        const rawDate = list[2];

        const side = rawSide?.toUpperCase();
        if (!side) {
            errors.push({
                row: rowIndex,
                reason: `Unrecognized side value: '${rawSide}'. Expected BOT or SLD.`,
                rawLine: line,
            });
            continue;
        }

        const quantity = rawQuantity;
        if (isNaN(quantity) || quantity <= 0) {
            errors.push({
                row: rowIndex,
                reason: `Quantity must be positive, got '${rawQuantity}'`,
                rawLine: line,
            });
            continue;
        }

        const price = rawPrice;
        if (isNaN(price) || price <= 0) {
            errors.push({
                row: rowIndex,
                reason: `Price must be positive, got '${rawPrice}'`,
                rawLine: line,
            });
            continue;
        }

        let executedAt: string;
        try {
            executedAt = parseZerodhaDate(rawDate ?? '');
        } catch (e) {
            errors.push({
                row: rowIndex,
                reason: (e as Error).message,
                rawLine: line,
            });
            continue;
        }
        // Parse and validate with Zod
        const instance = TradeSchema.parse({
            symbol,
            side,
            quantity,
            price,
            totalAmount: quantity*price,
            currency: 'INR',
            executedAt,
            broker: 'zerodha',
            rawData
            
        })
        trades.push(instance)
    }
    return trades;
}
