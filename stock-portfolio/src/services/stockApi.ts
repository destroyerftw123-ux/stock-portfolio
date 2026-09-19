import type { Fundamentals, HistoricalPoint } from "../types";

/**
 * Yahoo Finance's public endpoints don't reliably send CORS headers, and
 * some are occasionally rate-limited or require a session cookie/crumb.
 * We try a direct fetch first, then fall back to a couple of public CORS
 * proxies. Every caller should be ready for this to fail entirely (e.g. the
 * proxies being down) and degrade to manual entry.
 */
const CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const QUOTE_SUMMARY_BASE = "https://query2.finance.yahoo.com/v10/finance/quoteSummary";

const CORS_PROXIES = [
  (url: string) => url,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

const FETCH_TIMEOUT_MS = 10_000;

async function fetchJsonWithFallback(url: string): Promise<any> {
  let lastError: unknown;
  for (const wrap of CORS_PROXIES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(wrap(url), { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
    }
  }
  throw lastError ?? new Error("All fetch strategies failed");
}

// ---- simple TTL cache in localStorage, keyed by request ----
function cacheGet<T>(key: string, ttlMs: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > ttlMs) return null;
    return data as T;
  } catch {
    return null;
  }
}

function cacheSet(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // storage full or unavailable — non-fatal
  }
}

const QUOTE_TTL = 5 * 60 * 1000; // 5 min
const HISTORY_TTL = 12 * 60 * 60 * 1000; // 12 hours
const FUNDAMENTALS_TTL = 24 * 60 * 60 * 1000; // 24 hours

export interface QuoteResult {
  ticker: string;
  price?: number;
  previousClose?: number;
  currency?: string;
  shortName?: string;
  history?: HistoricalPoint[];
  error?: string;
}

/** Fetch current price + previous close + optional historical closes in one call. */
export async function fetchQuoteAndHistory(
  ticker: string,
  range: "1mo" | "6mo" | "1y" | "2y" | "5y" = "1y"
): Promise<QuoteResult> {
  const cacheKey = `sp_chart_${ticker}_${range}`;
  const cached = cacheGet<QuoteResult>(cacheKey, QUOTE_TTL);
  if (cached) return cached;

  try {
    const url = `${CHART_BASE}/${encodeURIComponent(
      ticker
    )}?range=${range}&interval=1d&includePrePost=false`;
    const json = await fetchJsonWithFallback(url);
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error("No data returned");

    const meta = result.meta ?? {};
    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

    const history: HistoricalPoint[] = timestamps
      .map((t, i) => ({
        date: new Date(t * 1000).toISOString().slice(0, 10),
        close: closes[i],
      }))
      .filter((p): p is HistoricalPoint => typeof p.close === "number");

    const out: QuoteResult = {
      ticker,
      price: meta.regularMarketPrice,
      previousClose: meta.chartPreviousClose ?? meta.previousClose,
      currency: meta.currency,
      shortName: meta.symbol,
      history,
    };
    cacheSet(cacheKey, out);
    return out;
  } catch (err) {
    return { ticker, error: err instanceof Error ? err.message : "Fetch failed" };
  }
}

export async function fetchHistory(
  ticker: string,
  range: "1mo" | "6mo" | "1y" | "2y" | "5y" = "1y"
): Promise<HistoricalPoint[]> {
  const cacheKey = `sp_history_${ticker}_${range}`;
  const cached = cacheGet<HistoricalPoint[]>(cacheKey, HISTORY_TTL);
  if (cached) return cached;
  const q = await fetchQuoteAndHistory(ticker, range);
  const history = q.history ?? [];
  if (history.length) cacheSet(cacheKey, history);
  return history;
}

/**
 * Fundamentals (P/E, P/B, ROE, debt/equity, etc.) via Yahoo's quoteSummary
 * endpoint. This endpoint is flakier than the chart endpoint (crumb/auth
 * requirements change over time), so failures here should never block the
 * rest of the app — callers fall back to manual entry.
 */
export async function fetchFundamentals(ticker: string): Promise<Fundamentals | null> {
  const cacheKey = `sp_fund_${ticker}`;
  const cached = cacheGet<Fundamentals>(cacheKey, FUNDAMENTALS_TTL);
  if (cached) return cached;

  try {
    const modules = "defaultKeyStatistics,financialData,summaryDetail,price";
    const url = `${QUOTE_SUMMARY_BASE}/${encodeURIComponent(ticker)}?modules=${modules}`;
    const json = await fetchJsonWithFallback(url);
    const result = json?.quoteSummary?.result?.[0];
    if (!result) throw new Error("No fundamentals returned");

    const keyStats = result.defaultKeyStatistics ?? {};
    const financialData = result.financialData ?? {};
    const summaryDetail = result.summaryDetail ?? {};
    const price = result.price ?? {};

    const raw = (v: any) => (typeof v?.raw === "number" ? v.raw : undefined);

    const fundamentals: Fundamentals = {
      ticker,
      shortName: price.shortName,
      currentPrice: raw(price.regularMarketPrice),
      previousClose: raw(price.regularMarketPreviousClose),
      currency: price.currency,
      marketCap: raw(price.marketCap),
      trailingPE: raw(summaryDetail.trailingPE),
      forwardPE: raw(summaryDetail.forwardPE),
      priceToBook: raw(keyStats.priceToBook),
      bookValuePerShare: raw(financialData.bookValue) ?? raw(keyStats.bookValue),
      epsTrailingTwelveMonths: raw(keyStats.trailingEps),
      dividendYield: raw(summaryDetail.dividendYield),
      debtToEquity: raw(financialData.debtToEquity),
      currentRatio: raw(financialData.currentRatio),
      returnOnEquity: raw(financialData.returnOnEquity),
      returnOnAssets: raw(financialData.returnOnAssets),
      profitMargin: raw(financialData.profitMargins),
      earningsGrowth: raw(financialData.earningsGrowth),
      fetchedAt: Date.now(),
    };
    cacheSet(cacheKey, fundamentals);
    return fundamentals;
  } catch {
    return null;
  }
}

export async function fetchManyQuotes(
  tickers: string[]
): Promise<Record<string, QuoteResult>> {
  const settled = await Promise.allSettled(tickers.map((t) => fetchQuoteAndHistory(t)));
  const out: Record<string, QuoteResult> = {};
  settled.forEach((s, i) => {
    out[tickers[i]] =
      s.status === "fulfilled" ? s.value : { ticker: tickers[i], error: "Fetch failed" };
  });
  return out;
}

export async function fetchManyFundamentals(
  tickers: string[]
): Promise<Record<string, Fundamentals | null>> {
  const settled = await Promise.allSettled(tickers.map((t) => fetchFundamentals(t)));
  const out: Record<string, Fundamentals | null> = {};
  settled.forEach((s, i) => {
    out[tickers[i]] = s.status === "fulfilled" ? s.value : null;
  });
  return out;
}
