# Journalyst-THA

Journalyst-THA parses broker CSV exports from Zerodha and IBKR, validates trade rows with Zod, and returns structured trade objects plus detailed row-level error information.

## Features

- Detects Zerodha and IBKR CSV formats from the header row
- Normalizes dates into ISO 8601 UTC strings
- Converts IBKR forex symbols like `EUR.USD` to `EUR/USD`
- Validates each trade row with `zod`
- Collects row-level error details instead of failing the entire import
- Exposes a simple HTTP upload endpoint for CSV ingestion

## Installation

```bash
npm install
```

## Run locally

```bash
npm start
```

The server listens on `http://localhost:3000` by default.

## API

### POST /import

Upload a CSV file with the form key `file`.

Example using `curl`:

```bash
curl -F "file=@ibkr.csv" http://localhost:3000/import
```

### Response format

Successful responses include:

- `broker`: detected broker name
- `trades`: validated trade objects
- `errors`: row-level parse and validation errors
- `summary`: totals for rows processed, valid rows, and skipped rows

Example:

```json
{
  "broker": "ibkr",
  "trades": [ ... ],
  "errors": [
    {
      "row": 3,
      "reason": "Invalid currency value: ''...",
      "rawLine": "..."
    }
  ],
  "summary": {
    "total": 10,
    "valid": 8,
    "skipped": 2
  }
}
```

## Supported CSV formats

### Zerodha

Header row must match:

`symbol,isin,trade_date,trade_type,quantity,price,trade_id,order_id,exchange,segment`

Rows are validated for:

- `symbol` required
- `trade_type` as `BUY` or `SELL`
- `quantity` and `price` positive numbers
- `trade_date` in `DD/MM/YYYY` or ISO format
- `currency` set to `INR`

### IBKR

Header row must match:

`TradeID,AccountID,Symbol,DateTime,Buy/Sell,Quantity,TradePrice,Currency,Commission,NetAmount,AssetClass`

Rows are validated for:

- `Buy/Sell` values `BOT` or `SLD`
- `Quantity` and `TradePrice` positive numbers
- `Currency` as a 3-letter code
- `DateTime` in `MM/DD/YYYY` or ISO format

## Development notes

- Parsers are located in `src/parsers`
- Common validation utilities are in `src/parsers/parserUtils.ts`
- Trade schema is defined in `src/targetSchema.ts`
- Error-aware parsing is returned as `ParseResult` with a detailed `errors` array

## Run tests

Execute parser, endpoint, and cleanup tests with:

```bash
npm test
```

Individual test scripts:

- `npm run test:unit` — parser validation
- `npm run test:api` — POST endpoint upload tests
- `npm run test:cleanup` — temp upload cleanup logic

## Cleanup stale uploads

Temporary CSV files are saved to `uploads/` during ingestion. The server removes each file after parsing, and stale files older than 24 hours can be cleaned manually with:

```bash
npm run cleanup-uploads
```

You can override the cleanup threshold with an environment variable:

```bash
CLEANUP_UPLOAD_MAX_AGE_MS=3600000 npm run cleanup-uploads
```

## Future improvements

- Add unit tests for parser edge cases
- Add support for more broker CSV layouts
- Add a file cleanup step for temporary uploads
