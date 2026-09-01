"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChartColumnIncreasing, UsersRound } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/entity-ui";
import { PrivateValue, usePrivacyMode } from "@/components/privacy-mode";
import { formatCurrency } from "@/lib/money";
import type { ChartDatum } from "@/types/domain";

function ChartTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload?: ChartDatum }>;
  currency: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];

  return (
    <div className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm shadow-xl">
      <p className="font-medium text-slate-50">
        {item.payload?.name || item.name}
      </p>
      <p className="text-slate-300">
        <PrivateValue>{formatCurrency(item.value, currency)}</PrivateValue>
      </p>
    </div>
  );
}

function ChartLegend({ data }: { data: ChartDatum[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
      {data.map((item) => (
        <div
          key={item.name}
          className="flex items-center gap-1.5 text-xs text-slate-400"
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <span className="max-w-[9rem] truncate">{item.name}</span>
        </div>
      ))}
    </div>
  );
}

function piePaddingAngle(data: ChartDatum[]) {
  return data.length > 1 ? 5 : 0;
}

function EmptyChartMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 text-center text-sm text-slate-400">
      {children}
    </div>
  );
}

function useMeasuredWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width));
    });

    observer.observe(element);
    setWidth(Math.floor(element.getBoundingClientRect().width));

    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

export function DashboardCharts({
  categoryTotals,
  ownerTotals,
  currency,
}: {
  categoryTotals: ChartDatum[];
  ownerTotals: ChartDatum[];
  currency: string;
}) {
  const [barRef, barWidth] = useMeasuredWidth();
  const { enabled: privacyEnabled } = usePrivacyMode();
  const [categoryMode, setCategoryMode] = useState<"bar" | "pie">("bar");
  const [pieRef, pieWidth] = useMeasuredWidth();
  const hasCategoryTotals = categoryTotals.length > 0;
  const hasOwnerTotals = ownerTotals.length > 0;
  const categoryBars = useMemo(
    () => [...categoryTotals].sort((a, b) => a.value - b.value),
    [categoryTotals],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem("category-chart-mode");

      if (saved === "bar" || saved === "pie") {
        setCategoryMode(saved);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function changeCategoryMode(mode: "bar" | "pie") {
    setCategoryMode(mode);
    window.localStorage.setItem("category-chart-mode", mode);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="min-h-80 rounded-lg border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-50">
              <SectionTitle icon={ChartColumnIncreasing}>
                Spese per categoria
              </SectionTitle>
            </h2>
            <p className="text-sm text-slate-400">Impatto mensile ricorrente</p>
          </div>
          <div className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] p-1">
            <Button
              size="sm"
              variant={categoryMode === "bar" ? "primary" : "ghost"}
              className="h-8"
              onClick={() => changeCategoryMode("bar")}
            >
              Barre
            </Button>
            <Button
              size="sm"
              variant={categoryMode === "pie" ? "primary" : "ghost"}
              className="h-8"
              onClick={() => changeCategoryMode("pie")}
            >
              Torta
            </Button>
          </div>
        </div>
        <div ref={barRef} className="h-[220px] min-w-0">
          {!hasCategoryTotals ? (
            <EmptyChartMessage>Nessuna spesa ricorrente per questa vista.</EmptyChartMessage>
          ) : null}
          {barWidth > 0 && hasCategoryTotals && categoryMode === "bar" ? (
            <BarChart
              width={barWidth}
              height={220}
              data={categoryBars}
              margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickFormatter={(value) => privacyEnabled ? "••••" : `${value / 100}`}
                width={46}
              />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {categoryBars.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          ) : null}
          {barWidth > 0 && categoryMode === "pie" ? (
            <PieChart width={barWidth} height={220}>
              <Pie
                data={categoryTotals}
                dataKey="value"
                nameKey="name"
                innerRadius={54}
                outerRadius={88}
                paddingAngle={piePaddingAngle(categoryTotals)}
                stroke="none"
              >
                {categoryTotals.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip currency={currency} />} />
            </PieChart>
          ) : null}
        </div>
        {categoryMode === "pie" && hasCategoryTotals ? (
          <ChartLegend data={categoryTotals} />
        ) : null}
      </div>

      <div className="min-h-80 rounded-lg border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-slate-50">
            <SectionTitle icon={UsersRound}>Ripartizione spese</SectionTitle>
          </h2>
          <p className="text-sm text-slate-400">
            Quote applicate alla vista corrente
          </p>
        </div>
        <div ref={pieRef} className="h-[220px] min-w-0">
          {!hasOwnerTotals ? (
            <EmptyChartMessage>Nessuna spesa ricorrente per questa vista.</EmptyChartMessage>
          ) : null}
          {pieWidth > 0 && hasOwnerTotals ? (
            <PieChart width={pieWidth} height={220}>
              <Pie
                data={ownerTotals}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={piePaddingAngle(ownerTotals)}
                stroke="none"
              >
                {ownerTotals.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip currency={currency} />} />
            </PieChart>
          ) : null}
        </div>
        {hasOwnerTotals ? <ChartLegend data={ownerTotals} /> : null}
      </div>
    </div>
  );
}
