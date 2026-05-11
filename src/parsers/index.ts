import { zerodhaBrokerParser } from './zerodha.ts';
import { ibkrBrokerParser } from './ibkr.ts';
import type { ParseResult } from '../types.ts';

export function identifyBroker(content: string): ParseResult {
  const idx = content.indexOf('\n');
  if (idx === -1) {
    return {
      broker: 'unknown',
      trades: [],
      errors: [
        {
          row: 0,
          reason: 'Malformed CSV: missing header row.',
          rawLine: content.trim(),
        },
      ],
      summary: { total: 0, valid: 0, skipped: 1 },
    };
  }

  const headerLine = content.slice(0, idx).replace(/\uFEFF/g, '').trim();
  const body = content.slice(idx + 1);
  const attrList = headerLine.split(',').map((column) => column.trim());

  const zerodhaBrokerList = [
    'symbol',
    'isin',
    'trade_date',
    'trade_type',
    'quantity',
    'price',
    'trade_id',
    'order_id',
    'exchange',
    'segment',
  ];

  const ibkrBrokerList = [
    'TradeID',
    'AccountID',
    'Symbol',
    'DateTime',
    'Buy/Sell',
    'Quantity',
    'TradePrice',
    'Currency',
    'Commission',
    'NetAmount',
    'AssetClass',
  ];

  const isIndianBroker =
    attrList.length === zerodhaBrokerList.length &&
    attrList.every((header, index) => header.toLowerCase() === zerodhaBrokerList[index]?.toLowerCase());

  const isInternationalBroker =
    attrList.length === ibkrBrokerList.length &&
    attrList.every((header, index) => header.toLowerCase() === ibkrBrokerList[index]?.toLowerCase());

  if (isIndianBroker) return zerodhaBrokerParser(attrList, body);
  if (isInternationalBroker) return ibkrBrokerParser(attrList, body);

  return {
    broker: 'unknown',
    trades: [],
    errors: [
      {
        row: 0,
        reason: `Broker header not recognized: '${headerLine}'.`,
        rawLine: headerLine,
      },
    ],
    summary: { total: 0, valid: 0, skipped: 1 },
  };
}
