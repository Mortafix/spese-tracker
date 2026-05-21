"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChartLine, CircleDollarSign, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionTitle } from "@/components/entity-ui";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/money";
import type { ChartDatum, InvestmentTrendSeries } from "@/types/domain";

type TooltipPayload = {
  name?: string;
  value?: number;
  color?: string;
  payload?: ChartDatum | TrendChartRow;
};

type ChartPeriod = "all" | "year";
type TrendChartRow = { date: string } & Record<string, string | number | undefined>;

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(new Date(`${value}T12:00:00`));
}

function ChartTooltip({
  active,
  payload,
  label: labelValue,
  currency,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];
  const payloadItem = item.payload;
  const visiblePayload = payload.filter((entry) => typeof entry.value === "number");
  const tooltipLabel =
    (labelValue && /^\d{4}-\d{2}-\d{2}$/.test(labelValue)
      ? formatShortDate(labelValue)
      : labelValue) ||
    (payloadItem && "date" in payloadItem
      ? formatShortDate(payloadItem.date)
      : payloadItem && "name" in payloadItem
        ? payloadItem.name
        : item.name);

  return (
    <div className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm shadow-xl">
      <p className="font-medium text-slate-50">{tooltipLabel}</p>
      {visiblePayload.length > 1 ? (
        <div className="mt-1 space-y-1">
          {visiblePayload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-4 text-slate-300">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                  aria-hidden
                />
                <span className="truncate">{entry.name}</span>
              </span>
              <span className="font-medium text-slate-100">
                {formatCurrency(entry.value || 0, currency)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-300">{formatCurrency(item.value || 0, currency)}</p>
      )}
    </div>
  );
}

function ChartLegend({ data }: { data: ChartDatum[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
      {data.map((item) => (
        <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-400">
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

function PeriodSwitch({
  value,
  onChange,
}: {
  value: ChartPeriod;
  onChange: (value: ChartPeriod) => void;
}) {
  return (
    <div className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] p-1">
      <Button
        type="button"
        size="sm"
        variant={value === "all" ? "primary" : "ghost"}
        className="h-8"
        onClick={() => onChange("all")}
      >
        Sempre
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "year" ? "primary" : "ghost"}
        className="h-8"
        onClick={() => onChange("year")}
      >
        Anno
      </Button>
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

function latestSeriesValueAtDate(series: InvestmentTrendSeries, date: string) {
  return series.data.filter((point) => point.date <= date).at(-1)?.value;
}

function buildTrendRows(series: InvestmentTrendSeries[]) {
  const dates = [...new Set(series.flatMap((item) => item.data.map((point) => point.date)))]
    .sort((a, b) => a.localeCompare(b));

  return dates.map((date) => {
    const row: TrendChartRow = { date };

    series.forEach((item) => {
      const firstDate = item.data[0]?.date;

      if (!firstDate || date < firstDate) {
        return;
      }

      const value = latestSeriesValueAtDate(item, date);

      if (typeof value === "number") {
        row[item.id] = value;
      }
    });

    return row;
  });
}

export function InvestmentCharts({
  allocationTotals,
  performanceTotals,
  performanceTotalsCurrentYear,
  trend,
  trendCurrentYear,
  currency,
}: {
  allocationTotals: ChartDatum[];
  performanceTotals: ChartDatum[];
  performanceTotalsCurrentYear: ChartDatum[];
  trend: InvestmentTrendSeries[];
  trendCurrentYear: InvestmentTrendSeries[];
  currency: string;
}) {
  const [allocationRef, allocationWidth] = useMeasuredWidth();
  const [performanceRef, performanceWidth] = useMeasuredWidth();
  const [trendRef, trendWidth] = useMeasuredWidth();
  const [performancePeriod, setPerformancePeriod] = useState<ChartPeriod>("all");
  const [trendPeriod, setTrendPeriod] = useState<ChartPeriod>("all");
  const selectedPerformanceTotals =
    performancePeriod === "all" ? performanceTotals : performanceTotalsCurrentYear;
  const selectedTrend = trendPeriod === "all" ? trend : trendCurrentYear;
  const performanceBars = useMemo(
    () => [...selectedPerformanceTotals].sort((a, b) => a.value - b.value),
    [selectedPerformanceTotals],
  );
  const trendRows = useMemo(() => buildTrendRows(selectedTrend), [selectedTrend]);
  const trendLegend = useMemo(
    () =>
      selectedTrend.map((series) => ({
        name: series.name,
        value: 0,
        color: series.color,
      })),
    [selectedTrend],
  );

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="min-h-80 rounded-lg border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-slate-50">
            <SectionTitle icon={CircleDollarSign}>Allocazione attuale</SectionTitle>
          </h2>
          <p className="text-sm text-slate-400">Investimenti e contanti nella vista corrente</p>
        </div>
        <div ref={allocationRef} className="h-[220px] min-w-0">
          {allocationWidth > 0 && allocationTotals.length > 0 ? (
            <PieChart width={allocationWidth} height={220}>
              <Pie
                data={allocationTotals}
                dataKey="value"
                nameKey="name"
                innerRadius={56}
                outerRadius={88}
                paddingAngle={5}
                stroke="none"
              >
                {allocationTotals.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip currency={currency} />} />
            </PieChart>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Nessun valore da visualizzare.
            </div>
          )}
        </div>
        <ChartLegend data={allocationTotals} />
      </div>

      <div className="min-h-80 rounded-lg border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-50">
            <SectionTitle icon={TrendingUp}>Performance</SectionTitle>
          </h2>
          <PeriodSwitch value={performancePeriod} onChange={setPerformancePeriod} />
        </div>
        <p className="mb-3 text-sm text-slate-400">Gain/loss per investimento</p>
        <div ref={performanceRef} className="h-[220px] min-w-0">
          {performanceWidth > 0 && performanceBars.length > 0 ? (
            <BarChart
              width={performanceWidth}
              height={220}
              data={performanceBars}
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
                tickFormatter={(value) => `${Number(value) / 100}`}
                width={46}
              />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {performanceBars.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Aggiungi un investimento per vedere la performance.
            </div>
          )}
        </div>
      </div>

      <div className="min-h-80 rounded-lg border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-50">
            <SectionTitle icon={ChartLine}>Andamento</SectionTitle>
          </h2>
          <PeriodSwitch value={trendPeriod} onChange={setTrendPeriod} />
        </div>
        <p className="mb-3 text-sm text-slate-400">Una linea per investimento</p>
        <div ref={trendRef} className="h-[220px] min-w-0">
          {trendWidth > 0 && trendRows.length > 1 ? (
            <LineChart
              width={trendWidth}
              height={220}
              data={trendRows}
              margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
            >
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickFormatter={formatShortDate}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickFormatter={(value) => `${Number(value) / 100}`}
                width={46}
              />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              {selectedTrend.map((series) => (
                <Line
                  key={series.id}
                  type="monotone"
                  dataKey={series.id}
                  name={series.name}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: series.color, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: series.color, strokeWidth: 0 }}
                  connectNulls
                />
              ))}
            </LineChart>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Servono almeno due date per costruire il trend.
            </div>
          )}
        </div>
        <ChartLegend data={trendLegend} />
      </div>
    </div>
  );
}
