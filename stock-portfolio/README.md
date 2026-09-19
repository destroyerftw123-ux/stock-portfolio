# My Portfolio

A single-page stock portfolio tracker. Log buy/sell transactions, see live
holdings with gain/loss, a portfolio value chart, an allocation breakdown,
and a Graham/Buffett-style value-investing checklist per holding.

Everything is stored in your browser's `localStorage` — there's no backend
and no account; the data never leaves your machine.

## Run it

```bash
npm install
npm run dev
```

Then open the printed `localhost` URL.

Build for production / static hosting:

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

`dist/` is a static site — deploy it anywhere that serves static files
(Netlify, Vercel, GitHub Pages, Cloudflare Pages, S3, etc).

## Features

- **Transactions tab** — log BUY/SELL trades (ticker, shares, price, date,
  optional fees). Holdings and average cost are derived automatically.
- **Dashboard** — total portfolio value, cost basis, gain/loss, today's
  change, a portfolio value chart (reconstructed from actual historical
  prices and the shares you held on each date), and an allocation pie chart.
- **Holdings table** — click a row to expand it and see:
  - **Graham defensive-investor checklist**: P/E ≤ 15, P/B ≤ 1.5, P/E×P/B ≤
    22.5, current ratio ≥ 2, debt/equity ≤ 1.0, pays a dividend, positive
    earnings growth, and whether the stock trades below its **Graham
    Number** (`√(22.5 × EPS × Book Value/Share)`), with the resulting
    margin of safety.
  - **Buffett-style quality checklist**: ROE ≥ 15%, low debt, healthy profit
    margins, consistent earnings growth, reasonable valuation.
  - A **manual fundamentals override** form — since free price APIs don't
    always return every fundamental reliably, you can type in P/E, P/B,
    book value, EPS, dividend yield, debt/equity, current ratio, or ROE
    yourself and it's used in place of (or alongside) whatever the API
    returned, saved per ticker in `localStorage`.

## About the price data

Prices and fundamentals come from Yahoo Finance's public (unofficial,
no-API-key) endpoints, called directly from the browser with a couple of
public CORS-proxy fallbacks if the direct call is blocked. This is free and
requires no signup, but it's best-effort:

- It can be rate-limited or occasionally unavailable.
- The fundamentals endpoint (`quoteSummary`) is flakier than the price/chart
  endpoint — if it fails, the app still works, it just won't auto-fill the
  Graham/Buffett numbers, and you'll see "Couldn't fetch live data" at the
  top of the dashboard. Use the manual fundamentals form in that case.
- If you want more reliable data, swap `src/services/stockApi.ts` for a
  keyed provider (Alpha Vantage, Finnhub, IEX Cloud, Financial Modeling
  Prep) — the rest of the app (store, calculations, UI) doesn't need to
  change, only that one file's fetch logic.

## Project structure

```
src/
  types.ts                    shared types
  store/                      zustand stores, persisted to localStorage
    usePortfolioStore.ts         transactions
    useFundamentalsOverrideStore.ts  manual fundamentals overrides
  services/stockApi.ts        Yahoo Finance fetch + caching
  lib/
    portfolioCalc.ts             holdings & historical value from transactions
    valueMetrics.ts               Graham Number / Graham & Buffett checklists
    format.ts                     currency/percent formatting helpers
  hooks/usePortfolioData.ts   ties store + API + calculations together
  components/                 UI (holdings table, charts, forms, etc.)
```
