import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { EnrichedHolding } from "../types";
import { formatCurrency, formatPct } from "../lib/format";

// Dataviz skill reference palette, dark-mode categorical steps, fixed order.
const CATEGORICAL_DARK = [
  "#3987e5", // blue
  "#d95926", // orange
  "#199e70", // aqua
  "#c98500", // yellow
  "#d55181", // magenta
  "#008300", // green
  "#9085e9", // violet
];
const OTHER_COLOR = "#8b98a5";
const MAX_SLICES = 7;

export default function AllocationChart({ holdings }: { holdings: EnrichedHolding[] }) {
  const withValue = holdings
    .filter((h) => h.marketValue != null && h.marketValue > 0)
    .sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0));

  if (withValue.length === 0) {
    return (
      <div className="bg-panel border border-border rounded-lg p-8 text-center text-text-dim h-72 flex items-center justify-center">
        No priced holdings yet to allocate.
      </div>
    );
  }

  const top = withValue.slice(0, MAX_SLICES);
  const rest = withValue.slice(MAX_SLICES);
  const restValue = rest.reduce((sum, h) => sum + (h.marketValue ?? 0), 0);
  const total = withValue.reduce((sum, h) => sum + (h.marketValue ?? 0), 0);

  const data = [
    ...top.map((h, i) => ({
      name: h.ticker,
      value: h.marketValue ?? 0,
      color: CATEGORICAL_DARK[i % CATEGORICAL_DARK.length],
    })),
    ...(restValue > 0 ? [{ name: "Other", value: restValue, color: OTHER_COLOR }] : []),
  ];

  return (
    <div className="bg-panel border border-border rounded-lg p-4 h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            stroke="#12181f"
            strokeWidth={2}
            label={({ name, percent }) =>
              (percent ?? 0) > 0.05 ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : ""
            }
            labelLine={false}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#1a222b",
              border: "1px solid #232d38",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value, name) => {
              const num = Number(value) || 0;
              return [
                `${formatCurrency(num)} (${formatPct((num / total) * 100, 1).replace("+", "")})`,
                name,
              ];
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: 12, color: "#8b98a5" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
