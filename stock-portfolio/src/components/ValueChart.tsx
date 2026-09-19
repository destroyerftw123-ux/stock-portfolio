import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "../lib/format";

export default function ValueChart({ data }: { data: { date: string; value: number }[] }) {
  if (data.length < 2) {
    return (
      <div className="bg-panel border border-border rounded-lg p-8 text-center text-text-dim h-72 flex items-center justify-center">
        Not enough price history yet to chart portfolio value.
      </div>
    );
  }

  return (
    <div className="bg-panel border border-border rounded-lg p-4 h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f9dff" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#4f9dff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#232d38" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#8b98a5", fontSize: 11 }}
            axisLine={{ stroke: "#232d38" }}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: "#8b98a5", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={70}
            tickFormatter={(v) => formatCurrency(v, 0)}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "#1a222b",
              border: "1px solid #232d38",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#8b98a5" }}
            formatter={(v) => [formatCurrency(Number(v) || 0), "Value"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#4f9dff"
            strokeWidth={2}
            fill="url(#valueFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
