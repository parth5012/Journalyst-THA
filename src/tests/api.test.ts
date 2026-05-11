import assert from 'node:assert';
import http from 'node:http';
import app from '../server.ts';

async function runApiTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to start test server');
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  const validCsv = `symbol,isin,trade_date,trade_type,quantity,price,trade_id,order_id,exchange,segment
TCS,INE467B01029,15/01/2024,buy,2,3920.00,TRD003,ORD003,NSE,EQ`;
  const validForm = new FormData();
  validForm.append('file', new Blob([validCsv], { type: 'text/csv' }), 'zerodha.csv');

  const validResponse = await fetch(`${baseUrl}/import`, {
    method: 'POST',
    body: validForm,
  });

  assert.strictEqual(validResponse.status, 200);
  const validJson = await validResponse.json();
  assert.strictEqual(validJson.broker, 'zerodha');
  assert.strictEqual(validJson.summary.valid, 1);
  assert.strictEqual(validJson.summary.skipped, 0);

  const missingResponse = await fetch(`${baseUrl}/import`, {
    method: 'POST',
  });
  assert.strictEqual(missingResponse.status, 400);
  const missingJson = await missingResponse.json();
  assert.strictEqual(missingJson.error, 'Missing CSV file upload.');

  const invalidCsv = `bad,header,columns
1,2,3`;
  const invalidForm = new FormData();
  invalidForm.append('file', new Blob([invalidCsv], { type: 'text/csv' }), 'bad.csv');
  const invalidResponse = await fetch(`${baseUrl}/import`, {
    method: 'POST',
    body: invalidForm,
  });
  assert.strictEqual(invalidResponse.status, 400);
  const invalidJson = await invalidResponse.json();
  assert.strictEqual(invalidJson.message, 'No valid trades found.');
  assert.strictEqual(invalidJson.result.broker, 'unknown');

  await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));

  console.log('✅ API tests passed.');
}

runApiTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
