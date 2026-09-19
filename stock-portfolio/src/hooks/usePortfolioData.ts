import { useEffect, useMemo, useState, useCallback } from "react";
import { usePortfolioStore } from "../store/usePortfolioStore";
import { useFundamentalsOverrideStore } from "../store/useFundamentalsOverrideStore";
import { computeHoldings, buildPortfolioValueSeries } from "../lib/portfolioCalc";
import {
  fetchManyQuotes,
  fetchManyFundamentals,
  type QuoteResult,
} from "../services/stockApi";
import type { EnrichedHolding, Fundamentals, HistoricalPoint } from "../types";

export function usePortfolioData() {
  const transactions = usePortfolioStore((s) => s.transactions);
  const overrides = useFundamentalsOverrideStore((s) => s.overrides);

  const holdings = useMemo(() => computeHoldings(transactions), [transactions]);
  const tickers = useMemo(() => holdings.map((h) => h.ticker), [holdings]);
  const tickerKey = tickers.join(",");

  const [quotes, setQuotes] = useState<Record<string, QuoteResult>>({});
  const [fundamentals, setFundamentals] = useState<Record<string, Fundamentals | null>>({});
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => setRefreshToken((n) => n + 1), []);

  useEffect(() => {
    if (tickers.length === 0) {
      setQuotes({});
      setFundamentals({});
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchManyQuotes(tickers), fetchManyFundamentals(tickers)])
      .then(([q, f]) => {
        if (cancelled) return;
        setQuotes(q);
        setFundamentals(f);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickerKey, refreshToken]);

  const enrichedHoldings: EnrichedHolding[] = useMemo(() => {
    return holdings.map((h) => {
      const q = quotes[h.ticker];
      const apiFund = fundamentals[h.ticker] ?? undefined;
      const override = overrides[h.ticker];

      const merged: Fundamentals | undefined =
        apiFund || override
          ? {
              ticker: h.ticker,
              currentPrice: q?.price ?? apiFund?.currentPrice,
              shortName: apiFund?.shortName ?? q?.shortName,
              previousClose: q?.previousClose ?? apiFund?.previousClose,
              currency: q?.currency ?? apiFund?.currency,
              marketCap: apiFund?.marketCap,
              trailingPE: override?.trailingPE ?? apiFund?.trailingPE,
              forwardPE: apiFund?.forwardPE,
              priceToBook: override?.priceToBook ?? apiFund?.priceToBook,
              bookValuePerShare: override?.bookValuePerShare ?? apiFund?.bookValuePerShare,
              epsTrailingTwelveMonths:
                override?.epsTrailingTwelveMonths ?? apiFund?.epsTrailingTwelveMonths,
              dividendYield: override?.dividendYield ?? apiFund?.dividendYield,
              debtToEquity: override?.debtToEquity ?? apiFund?.debtToEquity,
              currentRatio: override?.currentRatio ?? apiFund?.currentRatio,
              returnOnEquity: override?.returnOnEquity ?? apiFund?.returnOnEquity,
              returnOnAssets: apiFund?.returnOnAssets,
              profitMargin: apiFund?.profitMargin,
              earningsGrowth: override?.earningsGrowth ?? apiFund?.earningsGrowth,
              fetchedAt: apiFund?.fetchedAt ?? Date.now(),
            }
          : undefined;

      const price = q?.price;
      const marketValue = price != null ? price * h.shares : undefined;
      const gainLoss = marketValue != null ? marketValue - h.costBasis : undefined;
      const gainLossPct = marketValue != null && h.costBasis > 0 ? (gainLoss! / h.costBasis) * 100 : undefined;
      const prevClose = q?.previousClose;
      const dayChangePct =
        price != null && prevClose ? ((price - prevClose) / prevClose) * 100 : undefined;
      const dayChange =
        price != null && prevClose ? (price - prevClose) * h.shares : undefined;

      return {
        ...h,
        fundamentals: merged,
        marketValue,
        gainLoss,
        gainLossPct,
        dayChange,
        dayChangePct,
      };
    });
  }, [holdings, quotes, fundamentals, overrides]);

  const historyByTicker: Record<string, HistoricalPoint[]> = useMemo(() => {
    const out: Record<string, HistoricalPoint[]> = {};
    for (const t of tickers) {
      if (quotes[t]?.history) out[t] = quotes[t]!.history!;
    }
    return out;
  }, [tickers, quotes]);

  const valueSeries = useMemo(
    () => buildPortfolioValueSeries(transactions, historyByTicker),
    [transactions, historyByTicker]
  );

  const totals = useMemo(() => {
    let marketValue = 0;
    let costBasis = 0;
    let dayChange = 0;
    let hasMarketValue = false;
    for (const h of enrichedHoldings) {
      costBasis += h.costBasis;
      if (h.marketValue != null) {
        marketValue += h.marketValue;
        hasMarketValue = true;
      }
      if (h.dayChange != null) dayChange += h.dayChange;
    }
    const gainLoss = hasMarketValue ? marketValue - costBasis : undefined;
    const gainLossPct = hasMarketValue && costBasis > 0 ? (gainLoss! / costBasis) * 100 : undefined;
    return { marketValue, costBasis, gainLoss, gainLossPct, dayChange };
  }, [enrichedHoldings]);

  const fetchErrors = useMemo(
    () =>
      Object.values(quotes)
        .filter((q) => q.error)
        .map((q) => `${q.ticker}: ${q.error}`),
    [quotes]
  );

  return {
    transactions,
    holdings: enrichedHoldings,
    valueSeries,
    totals,
    loading,
    fetchErrors,
    refresh,
  };
}
