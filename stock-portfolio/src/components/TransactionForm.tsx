import { useState } from "react";
import { usePortfolioStore } from "../store/usePortfolioStore";
import type { TransactionType } from "../types";

const today = () => new Date().toISOString().slice(0, 10);

export default function TransactionForm() {
  const addTransaction = usePortfolioStore((s) => s.addTransaction);

  const [ticker, setTicker] = useState("");
  const [type, setType] = useState<TransactionType>("BUY");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(today());
  const [fees, setFees] = useState("");

  const canSubmit = ticker.trim() && Number(shares) > 0 && Number(price) > 0 && date;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    addTransaction({
      ticker: ticker.trim().toUpperCase(),
      type,
      shares: Number(shares),
      pricePerShare: Number(price),
      date,
      fees: fees ? Number(fees) : undefined,
    });
    setTicker("");
    setShares("");
    setPrice("");
    setFees("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-panel border border-border rounded-lg p-4 flex flex-wrap gap-3 items-end"
    >
      <Field label="Ticker">
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="AAPL"
          className="input w-24"
        />
      </Field>
      <Field label="Type">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TransactionType)}
          className="input w-24"
        >
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
      </Field>
      <Field label="Shares">
        <input
          type="number"
          step="0.0001"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          placeholder="10"
          className="input w-24"
        />
      </Field>
      <Field label="Price / share">
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="150.00"
          className="input w-28"
        />
      </Field>
      <Field label="Date">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input w-40"
        />
      </Field>
      <Field label="Fees (optional)">
        <input
          type="number"
          step="0.01"
          value={fees}
          onChange={(e) => setFees(e.target.value)}
          placeholder="0.00"
          className="input w-24"
        />
      </Field>
      <button
        type="submit"
        disabled={!canSubmit}
        className="px-4 py-2 rounded bg-accent text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed h-9"
      >
        Add Transaction
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-text-dim">
      {label}
      {children}
    </label>
  );
}
