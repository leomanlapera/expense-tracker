"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPhp } from "@/lib/money";

const FALLBACK = ["#0d1c42", "#22396f", "#4b6bb0", "#7d97d1", "#a4b0d8", "#fcf1d0"];

export type CategorySlice = {
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
  total_minor: number;
};

export function CategoryDonut({ data }: { data: CategorySlice[] }) {
  const total = data.reduce((n, d) => n + d.total_minor, 0);
  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-[color:var(--color-muted-foreground)]">
        No expenses to chart yet.
      </p>
    );
  }

  const withFill = data.map((d, i) => ({
    ...d,
    name: d.category_name ?? "Uncategorised",
    fill: d.category_color ?? FALLBACK[i % FALLBACK.length],
  }));

  const top = withFill.slice(0, 3);
  const summary = top
    .map((s) => `${s.name} ${Math.round((s.total_minor / total) * 100)}%`)
    .join(", ");

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <p className="sr-only">
        {`Total spent ${formatPhp(total)}. Top categories: ${summary}.`}
      </p>
      <div className="h-52 w-full max-w-xs">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={withFill}
              dataKey="total_minor"
              nameKey="name"
              innerRadius={60}
              outerRadius={88}
              stroke="var(--color-background)"
              strokeWidth={3}
              paddingAngle={1}
            >
              {withFill.map((slice) => (
                <Cell key={slice.category_id ?? slice.name} fill={slice.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatPhp(Number(value))}
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
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-1 flex-col gap-1 text-sm">
        {withFill.map((slice) => {
          const pct = Math.round((slice.total_minor / total) * 100);
          return (
            <li
              key={slice.category_id ?? slice.name}
              className="flex items-center gap-2 tabular-nums"
            >
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ background: slice.fill }}
              />
              <span className="flex-1 truncate">{slice.name}</span>
              <span className="text-[color:var(--color-muted-foreground)]">{pct}%</span>
              <span className="w-24 text-right">{formatPhp(slice.total_minor)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
