import type { Trade} from './targetSchema.js';


export type TradeError = {
  row: number;
  reason: string;
  rawLine: string;
};

export type ParseResult = {
  broker: string;
  trades: Trade[];
  errors: TradeError[];
  summary: { total: number; valid: number; skipped: number };
};

export type BrokerParser = (csvText: string) => ParseResult;
