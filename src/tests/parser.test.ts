import assert from 'node:assert';
import { identifyBroker } from '../parsers/index.ts';

function runParserTests() {
  const zerodhaCsv = `symbol,isin,trade_date,trade_type,quantity,price,trade_id,order_id,exchange,segment
TCS,INE467B01029,15/01/2024,buy,2,3920.00,TRD003,ORD003,NSE,EQ`;
  const zerodhaResult = identifyBroker(zerodhaCsv);
  assert.strictEqual(zerodhaResult.broker, 'zerodha');
  assert.strictEqual(zerodhaResult.summary.valid, 1);
  assert.strictEqual(zerodhaResult.summary.skipped, 0);
  assert.strictEqual(zerodhaResult.trades[0].broker, 'zerodha');
  assert.strictEqual(zerodhaResult.trades[0].currency, 'INR');

  const zerodhaInvalidCsv = `symbol,isin,trade_date,trade_type,quantity,price,trade_id,order_id,exchange,segment
TCS,INE467B01029,15/01/2024,buy,0,3920.00,TRD003,ORD003,NSE,EQ`;
  const invalidResult = identifyBroker(zerodhaInvalidCsv);
  assert.strictEqual(invalidResult.broker, 'zerodha');
  assert.strictEqual(invalidResult.summary.valid, 0);
  assert.strictEqual(invalidResult.summary.skipped, 1);
  assert.ok(invalidResult.errors[0].reason.includes('Invalid quantity'));

  const ibkrCsv = `TradeID,AccountID,Symbol,DateTime,Buy/Sell,Quantity,TradePrice,Currency,Commission,NetAmount,AssetClass
1001,ACC123,EUR.USD,04/01/2026,BOT,100,1.05,USD,0.10,105.00,CASH`;
  const ibkrResult = identifyBroker(ibkrCsv);
  assert.strictEqual(ibkrResult.broker, 'ibkr');
  assert.strictEqual(ibkrResult.summary.valid, 1);
  assert.strictEqual(ibkrResult.summary.skipped, 0);
  assert.strictEqual(ibkrResult.trades[0].symbol, 'EUR/USD');
  assert.strictEqual(ibkrResult.trades[0].side, 'BUY');

  const unknownCsv = `foo,bar,baz
1,2,3`;
  const unknownResult = identifyBroker(unknownCsv);
  assert.strictEqual(unknownResult.broker, 'unknown');
  assert.strictEqual(unknownResult.summary.valid, 0);
  assert.strictEqual(unknownResult.summary.skipped, 1);
  assert.ok(unknownResult.errors[0].reason.includes('Broker header not recognized'));

  console.log('✅ Parser tests passed.');
}

runParserTests();
