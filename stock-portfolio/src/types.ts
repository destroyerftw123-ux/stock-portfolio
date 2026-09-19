export type TransactionType = "BUY" | "SELL";

export interface Transaction {
  id: string;
  ticker: string;
  type: TransactionType;
  shares: number;
  pricePerShare: number;
  date: string; // ISO date, e.g. 2024-01-15
  fees?: number;
  note?: string;
}

export interface Holding {
  ticker: string;
  shares: number;
  avgCost: number;
  costBasis: number;
}

export interface Fundamentals {
  ticker: string;
  shortName?: string;
  currentPrice?: number;
  previousClose?: number;
  currency?: string;
  marketCap?: number;
  trailingPE?: number;
  forwardPE?: number;
  priceToBook?: number;
  bookValuePerShare?: number;
  epsTrailingTwelveMonths?: number;
  dividendYield?: number;
  debtToEquity?: number;
  currentRatio?: number;
  returnOnEquity?: number;
  returnOnAssets?: number;
  profitMargin?: number;
  earningsGrowth?: number;
  fetchedAt: number;
}

export interface HistoricalPoint {
  date: string; // ISO date
  close: number;
}

export interface EnrichedHolding extends Holding {
  fundamentals?: Fundamentals;
  marketValue?: number;
  gainLoss?: number;
  gainLossPct?: number;
  dayChange?: number;
  dayChangePct?: number;
}
