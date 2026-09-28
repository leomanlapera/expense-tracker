"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPhp } from "@/lib/money";

export type DailyPoint = {
  occurred_on: string;
  expense_minor: number;
};

export function DailyTrend({ data }: { data: DailyPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[color:var(--color-muted-foreground)]">
        No spending this month yet.
      </p>
    );
  }

  const shaped = data.map((d) => ({
    day: Number(d.occurred_on.slice(8, 10)),
    amount: d.expense_minor / 100,
  }));

  const totalMinor = data.reduce((n, d) => n + d.expense_minor, 0);
  const peak = data.reduce<{ occurred_on: string; expense_minor: number } | null>(
    (best, d) => (best && best.expense_minor >= d.expense_minor ? best : d),
    null,
  );

  return (
    <div className="h-48 w-full">
      <p className="sr-only">
        {`Spent ${formatPhp(totalMinor)} across ${data.length} day${data.length === 1 ? "" : "s"} this month.`}
        {peak ? ` Highest day: ${peak.occurred_on} at ${formatPhp(peak.expense_minor)}.` : ""}
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={shaped} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip
            formatter={(value) => formatPhp(Math.round(Number(value) * 100))}
            labelFormatter={(day) => `Day ${day}`}
            cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(1,7,54,0.08)",
              padding: "8px 12px",
            }}
            itemStyle={{ color: "var(--color-foreground)" }}
            labelStyle={{ color: "var(--color-muted-foreground)", marginBottom: 2 }}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--color-background)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
