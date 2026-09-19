import { usePortfolioStore } from "../store/usePortfolioStore";
import type { Transaction } from "../types";
import { formatCurrency, formatNum } from "../lib/format";

export default function TransactionLog({ transactions }: { transactions: Transaction[] }) {
  const removeTransaction = usePortfolioStore((s) => s.removeTransaction);

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return (
      <div className="bg-panel border border-border rounded-lg p-8 text-center text-text-dim">
        No transactions yet.
      </div>
    );
  }

  return (
    <div className="bg-panel border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-text-dim border-b border-border">
            <th className="px-3 py-2 text-xs uppercase tracking-wide font-medium">Date</th>
            <th className="px-3 py-2 text-xs uppercase tracking-wide font-medium">Ticker</th>
            <th className="px-3 py-2 text-xs uppercase tracking-wide font-medium">Type</th>
            <th className="px-3 py-2 text-xs uppercase tracking-wide font-medium text-right">Shares</th>
            <th className="px-3 py-2 text-xs uppercase tracking-wide font-medium text-right">Price</th>
            <th className="px-3 py-2 text-xs uppercase tracking-wide font-medium text-right">Total</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((tx) => (
            <tr key={tx.id} className="border-b border-border/60 hover:bg-panel-2">
              <td className="px-3 py-2.5">{tx.date}</td>
              <td className="px-3 py-2.5 font-semibold">{tx.ticker}</td>
              <td className="px-3 py-2.5">
                <span className={tx.type === "BUY" ? "text-up" : "text-down"}>{tx.type}</span>
              </td>
              <td className="px-3 py-2.5 text-right">{formatNum(tx.shares, 3)}</td>
              <td className="px-3 py-2.5 text-right">{formatCurrency(tx.pricePerShare)}</td>
              <td className="px-3 py-2.5 text-right">
                {formatCurrency(tx.shares * tx.pricePerShare + (tx.fees ?? 0))}
              </td>
              <td className="px-3 py-2.5 text-right">
                <button
                  onClick={() => removeTransaction(tx.id)}
                  className="text-xs text-down hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
