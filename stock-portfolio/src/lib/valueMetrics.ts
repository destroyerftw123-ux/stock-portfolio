import type { Fundamentals } from "../types";

export interface ValueCriterion {
  key: string;
  label: string;
  /** true = pass, false = fail, null = not enough data */
  pass: boolean | null;
  detail: string;
}

export interface ValueAnalysis {
  grahamNumber: number | null;
  marginOfSafetyPct: number | null;
  grahamCriteria: ValueCriterion[];
  buffettCriteria: ValueCriterion[];
  grahamScore: string; // e.g. "5/7"
  buffettScore: string;
}

/**
 * Graham Number: sqrt(22.5 * EPS * Book Value per Share).
 * 22.5 = Graham's ceiling of P/E (15) x P/B (1.5). This is the theoretical
 * max price a defensive investor should pay, per "The Intelligent Investor".
 */
function grahamNumber(eps?: number, bvps?: number): number | null {
  if (!eps || !bvps || eps <= 0 || bvps <= 0) return null;
  return Math.sqrt(22.5 * eps * bvps);
}

function pct(v: number | undefined, digits = 1): string {
  if (v === undefined || v === null || Number.isNaN(v)) return "—";
  return `${(v * 100).toFixed(digits)}%`;
}

function num(v: number | undefined, digits = 2): string {
  if (v === undefined || v === null || Number.isNaN(v)) return "—";
  return v.toFixed(digits);
}

export function analyzeValue(f: Fundamentals | null, currentPrice: number): ValueAnalysis {
  const eps = f?.epsTrailingTwelveMonths;
  const bvps = f?.bookValuePerShare;
  const gNumber = grahamNumber(eps, bvps);
  const marginOfSafety = gNumber ? ((gNumber - currentPrice) / gNumber) * 100 : null;

  const grahamCriteria: ValueCriterion[] = [
    {
      key: "pe",
      label: "P/E ratio ≤ 15",
      pass: f?.trailingPE != null ? f.trailingPE <= 15 : null,
      detail: f?.trailingPE != null ? num(f.trailingPE) : "no data",
    },
    {
      key: "pb",
      label: "P/B ratio ≤ 1.5",
      pass: f?.priceToBook != null ? f.priceToBook <= 1.5 : null,
      detail: f?.priceToBook != null ? num(f.priceToBook) : "no data",
    },
    {
      key: "pepb",
      label: "P/E × P/B ≤ 22.5",
      pass:
        f?.trailingPE != null && f?.priceToBook != null
          ? f.trailingPE * f.priceToBook <= 22.5
          : null,
      detail:
        f?.trailingPE != null && f?.priceToBook != null
          ? num(f.trailingPE * f.priceToBook)
          : "no data",
    },
    {
      key: "current_ratio",
      label: "Current ratio ≥ 2",
      pass: f?.currentRatio != null ? f.currentRatio >= 2 : null,
      detail: f?.currentRatio != null ? num(f.currentRatio) : "no data",
    },
    {
      key: "debt_equity",
      label: "Debt/Equity ≤ 1.0 (100%)",
      pass: f?.debtToEquity != null ? f.debtToEquity <= 100 : null,
      detail: f?.debtToEquity != null ? num(f.debtToEquity / 100) : "no data",
    },
    {
      key: "dividend",
      label: "Pays a dividend",
      pass: f?.dividendYield != null ? f.dividendYield > 0 : null,
      detail: f?.dividendYield != null ? pct(f.dividendYield) : "no data",
    },
    {
      key: "earnings_growth",
      label: "Positive earnings growth",
      pass: f?.earningsGrowth != null ? f.earningsGrowth > 0 : null,
      detail: f?.earningsGrowth != null ? pct(f.earningsGrowth) : "no data",
    },
    {
      key: "margin_of_safety",
      label: "Trading below Graham Number",
      pass: marginOfSafety != null ? marginOfSafety > 0 : null,
      detail: marginOfSafety != null ? `${marginOfSafety.toFixed(1)}% margin` : "no data",
    },
  ];

  const buffettCriteria: ValueCriterion[] = [
    {
      key: "roe",
      label: "ROE ≥ 15%",
      pass: f?.returnOnEquity != null ? f.returnOnEquity >= 0.15 : null,
      detail: f?.returnOnEquity != null ? pct(f.returnOnEquity) : "no data",
    },
    {
      key: "low_debt",
      label: "Low debt (D/E ≤ 0.5)",
      pass: f?.debtToEquity != null ? f.debtToEquity <= 50 : null,
      detail: f?.debtToEquity != null ? num(f.debtToEquity / 100) : "no data",
    },
    {
      key: "profit_margin",
      label: "Healthy profit margin ≥ 10%",
      pass: f?.profitMargin != null ? f.profitMargin >= 0.1 : null,
      detail: f?.profitMargin != null ? pct(f.profitMargin) : "no data",
    },
    {
      key: "consistent_growth",
      label: "Consistent earnings growth",
      pass: f?.earningsGrowth != null ? f.earningsGrowth > 0.05 : null,
      detail: f?.earningsGrowth != null ? pct(f.earningsGrowth) : "no data",
    },
    {
      key: "reasonable_price",
      label: "Reasonable valuation (P/E ≤ 25)",
      pass: f?.trailingPE != null ? f.trailingPE <= 25 : null,
      detail: f?.trailingPE != null ? num(f.trailingPE) : "no data",
    },
  ];

  const score = (criteria: ValueCriterion[]) => {
    const known = criteria.filter((c) => c.pass !== null);
    const passed = known.filter((c) => c.pass).length;
    return `${passed}/${known.length || criteria.length}`;
  };

  return {
    grahamNumber: gNumber,
    marginOfSafetyPct: marginOfSafety,
    grahamCriteria,
    buffettCriteria,
    grahamScore: score(grahamCriteria),
    buffettScore: score(buffettCriteria),
  };
}
