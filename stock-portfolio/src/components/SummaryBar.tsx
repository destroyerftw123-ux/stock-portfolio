import { formatCurrency, formatPct, gainColor } from "../lib/format";

interface Props {
  marketValue: number;
  costBasis: number;
  gainLoss?: number;
  gainLossPct?: number;
  dayChange?: number;
  loading: boolean;
  onRefresh: () => void;
}

export default function SummaryBar({
  marketValue,
  costBasis,
  gainLoss,
  gainLossPct,
  dayChange,
  loading,
  onRefresh,
}: Props) {
  const dayChangePct = marketValue - dayChange! > 0 && dayChange != null
    ? (dayChange / (marketValue - dayChange)) * 100
    : undefined;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <Stat label="Portfolio Value" value={formatCurrency(marketValue)} />
      <Stat label="Cost Basis" value={formatCurrency(costBasis)} />
      <Stat
        label="Total Gain/Loss"
        value={
          <span className={gainColor(gainLoss)}>
            {formatCurrency(gainLoss)} ({formatPct(gainLossPct)})
          </span>
        }
      />
      <Stat
        label="Today"
        value={
          <span className={gainColor(dayChange)}>
            {formatCurrency(dayChange)} {dayChangePct != null ? `(${formatPct(dayChangePct)})` : ""}
          </span>
        }
        action={
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-xs text-accent hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        }
      />
    </div>
  );
}

function Stat({
  label,
  value,
  action,
}: {
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-panel border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-text-dim">{label}</div>
        {action}
      </div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
