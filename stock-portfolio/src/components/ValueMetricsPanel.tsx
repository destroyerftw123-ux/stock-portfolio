import { useState } from "react";
import { analyzeValue } from "../lib/valueMetrics";
import { formatCurrency, formatNum } from "../lib/format";
import {
  useFundamentalsOverrideStore,
  type FundamentalsOverride,
} from "../store/useFundamentalsOverrideStore";
import type { EnrichedHolding } from "../types";

const OVERRIDE_FIELDS: { key: keyof FundamentalsOverride; label: string; step?: string }[] = [
  { key: "trailingPE", label: "P/E ratio" },
  { key: "priceToBook", label: "P/B ratio" },
  { key: "bookValuePerShare", label: "Book value / share ($)" },
  { key: "epsTrailingTwelveMonths", label: "EPS (TTM, $)" },
  { key: "dividendYield", label: "Dividend yield (e.g. 0.02 = 2%)", step: "0.001" },
  { key: "debtToEquity", label: "Debt/Equity (%, e.g. 45 = 0.45x)" },
  { key: "currentRatio", label: "Current ratio" },
  { key: "returnOnEquity", label: "ROE (e.g. 0.18 = 18%)", step: "0.001" },
];

function CriteriaList({ title, items, score }: { title: string; items: { key: string; label: string; pass: boolean | null; detail: string }[]; score: string }) {
  return (
    <div className="flex-1 min-w-[220px]">
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="text-sm font-semibold text-text">{title}</h4>
        <span className="text-xs text-text-dim">{score} passed</span>
      </div>
      <ul className="space-y-1">
        {items.map((c) => (
          <li key={c.key} className="flex items-center justify-between text-sm gap-2">
            <span className="flex items-center gap-2 text-text-dim">
              <Badge pass={c.pass} />
              {c.label}
            </span>
            <span className="text-text tabular-nums">{c.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Badge({ pass }: { pass: boolean | null }) {
  if (pass === null)
    return <span className="w-2 h-2 rounded-full bg-text-dim/50 inline-block shrink-0" />;
  return (
    <span
      className={`w-2 h-2 rounded-full inline-block shrink-0 ${pass ? "bg-up" : "bg-down"}`}
    />
  );
}

export default function ValueMetricsPanel({ holding }: { holding: EnrichedHolding }) {
  const [editing, setEditing] = useState(false);
  const override = useFundamentalsOverrideStore((s) => s.overrides[holding.ticker]);
  const setOverride = useFundamentalsOverrideStore((s) => s.setOverride);

  const price = holding.fundamentals?.currentPrice ?? holding.avgCost;
  const analysis = analyzeValue(holding.fundamentals ?? null, price);

  return (
    <div className="bg-panel-2 border-t border-border p-4">
      {analysis.grahamNumber != null && (
        <div className="flex flex-wrap gap-6 mb-4 text-sm">
          <div>
            <div className="text-text-dim text-xs uppercase tracking-wide">Graham Number</div>
            <div className="font-semibold">{formatCurrency(analysis.grahamNumber)}</div>
          </div>
          <div>
            <div className="text-text-dim text-xs uppercase tracking-wide">Margin of Safety</div>
            <div
              className={`font-semibold ${
                (analysis.marginOfSafetyPct ?? 0) >= 0 ? "text-up" : "text-down"
              }`}
            >
              {formatNum(analysis.marginOfSafetyPct)}%
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-6">
        <CriteriaList title="Graham defensive-investor checklist" items={analysis.grahamCriteria} score={analysis.grahamScore} />
        <CriteriaList title="Buffett-style quality checklist" items={analysis.buffettCriteria} score={analysis.buffettScore} />
      </div>

      <div className="mt-4">
        <button
          onClick={() => setEditing((v) => !v)}
          className="text-xs text-accent hover:underline"
        >
          {editing ? "Hide manual fundamentals" : "Missing data? Enter fundamentals manually"}
        </button>
        {editing && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {OVERRIDE_FIELDS.map((f) => (
              <label key={f.key} className="text-xs text-text-dim flex flex-col gap-1">
                {f.label}
                <input
                  type="number"
                  step={f.step ?? "0.01"}
                  className="bg-bg border border-border rounded px-2 py-1 text-text text-sm"
                  defaultValue={override?.[f.key] ?? ""}
                  onBlur={(e) => {
                    const val = e.target.value === "" ? undefined : Number(e.target.value);
                    setOverride(holding.ticker, { [f.key]: val } as FundamentalsOverride);
                  }}
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
