import { useState } from "react";
import { usePortfolioData } from "./hooks/usePortfolioData";
import SummaryBar from "./components/SummaryBar";
import HoldingsTable from "./components/HoldingsTable";
import ValueChart from "./components/ValueChart";
import AllocationChart from "./components/AllocationChart";
import TransactionForm from "./components/TransactionForm";
import TransactionLog from "./components/TransactionLog";

type Tab = "dashboard" | "transactions";

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const { transactions, holdings, valueSeries, totals, loading, fetchErrors, refresh } =
    usePortfolioData();

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">📈 My Portfolio</h1>
          <nav className="flex gap-1 bg-panel border border-border rounded-lg p-1">
            <TabButton active={tab === "dashboard"} onClick={() => setTab("dashboard")}>
              Dashboard
            </TabButton>
            <TabButton active={tab === "transactions"} onClick={() => setTab("transactions")}>
              Transactions
            </TabButton>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {fetchErrors.length > 0 && (
          <div className="mb-4 text-xs text-text-dim bg-panel border border-border rounded-lg px-3 py-2">
            Couldn't fetch live data for: {fetchErrors.join(", ")}. Prices/fundamentals may be
            stale or missing — you can enter fundamentals manually in a holding's detail row.
          </div>
        )}

        {tab === "dashboard" ? (
          <>
            <SummaryBar
              marketValue={totals.marketValue}
              costBasis={totals.costBasis}
              gainLoss={totals.gainLoss}
              gainLossPct={totals.gainLossPct}
              dayChange={totals.dayChange}
              loading={loading}
              onRefresh={refresh}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2">
                <ValueChart data={valueSeries} />
              </div>
              <AllocationChart holdings={holdings} />
            </div>

            <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide mb-2">
              Holdings
            </h2>
            <HoldingsTable holdings={holdings} />
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <TransactionForm />
            <TransactionLog transactions={transactions} />
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-6 text-xs text-text-dim">
        Prices via Yahoo Finance public endpoints (best-effort, may be delayed or unavailable).
        All data stays in your browser's local storage — nothing is sent to a server.
      </footer>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
        active ? "bg-accent text-white" : "text-text-dim hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}
