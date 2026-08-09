"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Point = { label: string; revenue: number };

const PIE_COLORS = ["#F2B705", "#22C55E", "#38BDF8", "#EF4444", "#A855F7", "#14B8A6", "#F97316"];

export default function RevenueChart({
  daily,
  monthly,
}: {
  daily: Point[];
  monthly: Point[];
}) {
  const [range, setRange] = useState<"day" | "month">("day");
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar");

  const data = range === "day" ? daily : monthly;
  const pieData = useMemo(() => data.filter((d) => d.revenue > 0), [data]);

  return (
    <div className="bg-panel border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-white font-semibold">รายได้</h3>
        <div className="flex items-center gap-2">
          <ToggleGroup
            value={range}
            onChange={(v) => setRange(v as "day" | "month")}
            options={[
              { value: "day", label: "รายวัน" },
              { value: "month", label: "รายเดือน" },
            ]}
          />
          <ToggleGroup
            value={chartType}
            onChange={(v) => setChartType(v as any)}
            options={[
              { value: "bar", label: "Bar" },
              { value: "line", label: "Line" },
              { value: "pie", label: "Pie" },
            ]}
          />
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232B40" />
              <XAxis dataKey="label" stroke="#8993A8" fontSize={12} />
              <YAxis stroke="#8993A8" fontSize={12} />
              <Tooltip contentStyle={{ background: "#141A2A", border: "1px solid #232B40", borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="#F2B705" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232B40" />
              <XAxis dataKey="label" stroke="#8993A8" fontSize={12} />
              <YAxis stroke="#8993A8" fontSize={12} />
              <Tooltip contentStyle={{ background: "#141A2A", border: "1px solid #232B40", borderRadius: 8 }} />
              <Line type="monotone" dataKey="revenue" stroke="#F2B705" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <PieChart>
              <Tooltip contentStyle={{ background: "#141A2A", border: "1px solid #232B40", borderRadius: 8 }} />
              <Pie data={pieData} dataKey="revenue" nameKey="label" outerRadius={110} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ToggleGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1 bg-panel2 rounded-lg p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
            value === opt.value ? "bg-accent text-gray-900" : "text-muted hover:text-white"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
