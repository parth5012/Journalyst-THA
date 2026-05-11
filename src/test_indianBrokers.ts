import { TradeSchema } from "./targetSchema.js";

// ---- copy of indianBrokers (exported for testing) ----
const indianBrokers = function (attributes: Array<string>, content: string) {
    const trades = [];
    for (const line of content.split('\n')) {
        if (!line.trim()) continue;
        const list = line.split(',');
        if (list.length < 6) { console.warn('Skipping malformed row:', line); continue; }

        const quantity = parseFloat(list[4] ?? '0');
        const price    = parseFloat(list[5] ?? '0');

        const instance = TradeSchema.parse({
            symbol:      list[0] ?? '',
            side:        list[3]?.toUpperCase(),
            quantity,
            price,
            totalAmount: quantity * price,
            currency:    'INR',
            executedAt:  new Date(list[2] ?? '').toISOString(),
            broker:      'Indian',
            rawData: {
                isin:     list[1],
                trade_id: list[6],
                order_id: list[7],
                exchange: list[8],
                segment:  list[9],
            },
        });
        trades.push(instance);
    }
    return trades;
};

// ---- sample CSV rows (no header) ----
// Columns: symbol, isin, executedAt, side, quantity, price, trade_id, order_id, exchange, segment
const sampleCSV = `RELIANCE,INE002A01018,2024-01-15T09:15:00Z,buy,10,2450.50,TRD001,ORD001,NSE,EQ
INFY,INE009A01021,2024-01-15T10:30:00Z,sell,5,1780.25,TRD002,ORD002,BSE,EQ
TCS,INE467B01029,2024-01-15T11:00:00Z,buy,2,3920.00,TRD003,ORD003,NSE,EQ`;

// ---- run ----
try {
    const results = indianBrokers([], sampleCSV);
    console.log(`\n✅ Parsed ${results.length} trades successfully:\n`);
    results.forEach((t, i) => {
        console.log(`Trade ${i + 1}:`);
        console.log(`  Symbol:      ${t.symbol}`);
        console.log(`  Side:        ${t.side}`);
        console.log(`  Quantity:    ${t.quantity}`);
        console.log(`  Price:       ₹${t.price}`);
        console.log(`  Total Amt:   ₹${t.totalAmount}`);
        console.log(`  Currency:    ${t.currency}`);
        console.log(`  ExecutedAt:  ${t.executedAt}`);
        console.log(`  Broker:      ${t.broker}`);
        console.log(`  Exchange:    ${t.rawData['exchange']}`);
        console.log('');
    });
} catch (err) {
    console.error('❌ Parsing failed:', err);
}
