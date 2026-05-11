import { identifyBroker } from './parsers/index.ts';

const sampleCsv = `symbol,isin,trade_date,trade_type,quantity,price,trade_id,order_id,exchange,segment
RELIANCE,INE002A01018,15/01/2024,buy,10,2450.50,TRD001,ORD001,NSE,EQ
INFY,INE009A01021,15/01/2024,sell,5,1780.25,TRD002,ORD002,BSE,EQ
TCS,INE467B01029,15/01/2024,buy,2,3920.00,TRD003,ORD003,NSE,EQ`;

const result = identifyBroker(sampleCsv);

console.log(`Parsed trades: ${result.trades.length}`);
console.log(`Skipped rows: ${result.errors.length}`);
console.log('Summary:', result.summary);

if (result.errors.length) {
  console.log('\nValidation errors:');
  for (const error of result.errors) {
    console.log(`- row ${error.row}: ${error.reason}`);
  }
}

for (const [index, trade] of result.trades.entries()) {
  console.log(`\nTrade ${index + 1}:`, {
    symbol: trade.symbol,
    side: trade.side,
    quantity: trade.quantity,
    price: trade.price,
    totalAmount: trade.totalAmount,
    currency: trade.currency,
    executedAt: trade.executedAt,
    broker: trade.broker,
  });
}
