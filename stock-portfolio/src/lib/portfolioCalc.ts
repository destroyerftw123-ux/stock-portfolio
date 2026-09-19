import type { Holding, HistoricalPoint, Transaction } from "../types";

/** Derive current holdings (average-cost basis) from a list of transactions. */
export function computeHoldings(transactions: Transaction[]): Holding[] {
  const byTicker = new Map<string, { shares: number; costBasis: number }>();

  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  for (const tx of sorted) {
    const ticker = tx.ticker.toUpperCase();
    const entry = byTicker.get(ticker) ?? { shares: 0, costBasis: 0 };
    const fees = tx.fees ?? 0;

    if (tx.type === "BUY") {
      entry.shares += tx.shares;
      entry.costBasis += tx.shares * tx.pricePerShare + fees;
    } else {
      const avgCost = entry.shares > 0 ? entry.costBasis / entry.shares : 0;
      const sellShares = Math.min(tx.shares, entry.shares);
      entry.shares -= sellShares;
      entry.costBasis -= sellShares * avgCost;
      if (entry.shares <= 0) {
        entry.shares = 0;
        entry.costBasis = 0;
      }
    }
    byTicker.set(ticker, entry);
  }

  const holdings: Holding[] = [];
  for (const [ticker, { shares, costBasis }] of byTicker) {
    if (shares > 1e-9) {
      holdings.push({
        ticker,
        shares,
        costBasis,
        avgCost: costBasis / shares,
      });
    }
  }
  return holdings.sort((a, b) => a.ticker.localeCompare(b.ticker));
}

/** Shares held for a single ticker as of a given ISO date (inclusive). */
function sharesAsOf(transactions: Transaction[], ticker: string, date: string): number {
  let shares = 0;
  for (const tx of transactions) {
    if (tx.ticker.toUpperCase() !== ticker || tx.date > date) continue;
    shares += tx.type === "BUY" ? tx.shares : -tx.shares;
  }
  return Math.max(0, shares);
}

/**
 * Reconstruct total portfolio value on each date present in the historical
 * price series, using the number of shares actually held on that date.
 */
export function buildPortfolioValueSeries(
  transactions: Transaction[],
  historyByTicker: Record<string, HistoricalPoint[]>
): { date: string; value: number }[] {
  const allDates = new Set<string>();
  for (const points of Object.values(historyByTicker)) {
    for (const p of points) allDates.add(p.date);
  }
  const dates = [...allDates].sort();
  const tickers = Object.keys(historyByTicker);

  return dates.map((date) => {
    let value = 0;
    for (const ticker of tickers) {
      const shares = sharesAsOf(transactions, ticker, date);
      if (shares <= 0) continue;
      const points = historyByTicker[ticker];
      // last close on or before this date
      let close: number | undefined;
      for (let i = points.length - 1; i >= 0; i--) {
        if (points[i].date <= date) {
          close = points[i].close;
          break;
        }
      }
      if (close !== undefined) value += shares * close;
    }
    return { date, value };
  });
}
