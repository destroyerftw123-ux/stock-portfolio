import { Fragment, useState } from "react";
import type { EnrichedHolding } from "../types";
import { formatCurrency, formatPct, formatNum, gainColor } from "../lib/format";
import ValueMetricsPanel from "./ValueMetricsPanel";

export default function HoldingsTable({ holdings }: { holdings: EnrichedHolding[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (holdings.length === 0) {
    return (
      <div className="bg-panel border border-border rounded-lg p-8 text-center text-text-dim">
        No holdings yet. Add a buy transaction to get started.
      </div>
    );
  }

  return (
    <div className="bg-panel border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-dim border-b border-border">
              <Th>Ticker</Th>
              <Th align="right">Shares</Th>
              <Th align="right">Avg Cost</Th>
              <Th align="right">Price</Th>
              <Th align="right">Day</Th>
              <Th align="right">Market Value</Th>
              <Th align="right">Gain/Loss</Th>
              <Th align="right">P/E</Th>
              <Th align="right">P/B</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const isOpen = expanded === h.ticker;
              return (
                <Fragment key={h.ticker}>
                  <tr
                    onClick={() => setExpanded(isOpen ? null : h.ticker)}
                    className="border-b border-border/60 hover:bg-panel-2 cursor-pointer transition-colors"
                  >
                    <Td className="font-semibold">{h.ticker}</Td>
                    <Td align="right">{formatNum(h.shares, 3)}</Td>
                    <Td align="right">{formatCurrency(h.avgCost)}</Td>
                    <Td align="right">{formatCurrency(h.fundamentals?.currentPrice)}</Td>
                    <Td align="right" className={gainColor(h.dayChangePct)}>
                      {formatPct(h.dayChangePct)}
                    </Td>
                    <Td align="right">{formatCurrency(h.marketValue)}</Td>
                    <Td align="right" className={gainColor(h.gainLoss)}>
                      {formatCurrency(h.gainLoss)} ({formatPct(h.gainLossPct)})
                    </Td>
                    <Td align="right">{formatNum(h.fundamentals?.trailingPE)}</Td>
                    <Td align="right">{formatNum(h.fundamentals?.priceToBook)}</Td>
                    <Td align="right" className="text-text-dim">
                      {isOpen ? "▲" : "▼"}
                    </Td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={10} className="p-0">
                        <ValueMetricsPanel holding={h} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align = "left" }: { children?: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`px-3 py-2 text-xs uppercase tracking-wide font-medium ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  className = "",
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td className={`px-3 py-2.5 ${align === "right" ? "text-right" : "text-left"} ${className}`}>
      {children}
    </td>
  );
}
