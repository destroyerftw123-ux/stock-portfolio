import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Fundamentals } from "../types";

export type FundamentalsOverride = Partial<
  Pick<
    Fundamentals,
    | "trailingPE"
    | "priceToBook"
    | "bookValuePerShare"
    | "epsTrailingTwelveMonths"
    | "dividendYield"
    | "debtToEquity"
    | "currentRatio"
    | "returnOnEquity"
    | "earningsGrowth"
  >
>;

interface OverrideState {
  overrides: Record<string, FundamentalsOverride>;
  setOverride: (ticker: string, patch: FundamentalsOverride) => void;
  clearOverride: (ticker: string) => void;
}

export const useFundamentalsOverrideStore = create<OverrideState>()(
  persist(
    (set) => ({
      overrides: {},
      setOverride: (ticker, patch) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            [ticker]: { ...state.overrides[ticker], ...patch },
          },
        })),
      clearOverride: (ticker) =>
        set((state) => {
          const next = { ...state.overrides };
          delete next[ticker];
          return { overrides: next };
        }),
    }),
    { name: "stock-portfolio-fundamentals-overrides" }
  )
);
