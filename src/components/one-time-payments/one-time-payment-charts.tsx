"use client";

import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownUp, ChartLine, Shapes } from "lucide-react";
import { SectionTitle } from "@/components/entity-ui";
import { formatCurrency } from "@/lib/money";
import type { ChartDatum, OneTimePaymentMonthlyDatum } from "@/types/domain";

type TooltipPayload = {
  name?: string;
  value?: number;
  color?: string;
  payload?: ChartDatum | OneTimePaymentMonthlyDatum;
};

const monthLabels: Record<string, string> = {
  "01": "Gen",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "Mag",
  "06": "Giu",
  "07": "Lug",
  "08": "Ago",
  "09": "Set",
  "10": "Ott",
  "11": "Nov",
  "12": "Dic",
};

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

function ChartTooltip({
  active,
  payload,
  label,
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

  const visiblePayload = payload.filter((entry) => typeof entry.value === "number");
  const tooltipLabel = label && monthLabels[label] ? monthLabels[label] : label || payload[0].name;

  return (
    <div className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm shadow-xl">
      <p className="font-medium text-slate-50">{tooltipLabel}</p>
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
    </div>
  );
}

function ChartLegend({ data }: { data: ChartDatum[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
      {data.map((item) => (
        <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
          <span className="max-w-[9rem] truncate">{item.name}</span>
        </div>
      ))}
    </div>
  );
}

export function OneTimePaymentCharts({
  directionTotals,
  categoryTotals,
  monthlyTrend,
  currency,
}: {
  directionTotals: ChartDatum[];
  categoryTotals: ChartDatum[];
  monthlyTrend: OneTimePaymentMonthlyDatum[];
  currency: string;
}) {
  const [directionRef, directionWidth] = useMeasuredWidth();
  const [categoryRef, categoryWidth] = useMeasuredWidth();
  const [trendRef, trendWidth] = useMeasuredWidth();
  const hasTrend = monthlyTrend.some((item) => item.incomeCents > 0 || item.expenseCents > 0);

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="min-h-80 rounded-lg border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-slate-50">
            <SectionTitle icon={ArrowDownUp}>Entrate e uscite</SectionTitle>
          </h2>
          <p className="text-sm text-slate-400">Totali nel periodo selezionato</p>
        </div>
        <div ref={directionRef} className="h-[220px] min-w-0">
          {directionWidth > 0 && directionTotals.length > 0 ? (
            <BarChart
              width={directionWidth}
              height={220}
              data={directionTotals}
              margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
            >
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickFormatter={(value) => `${Number(value) / 100}`}
                width={46}
              />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {directionTotals.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Nessun movimento nel periodo.
            </div>
          )}
        </div>
      </div>

      <div className="min-h-80 rounded-lg border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-slate-50">
            <SectionTitle icon={Shapes}>Categorie</SectionTitle>
          </h2>
          <p className="text-sm text-slate-400">Distribuzione dei movimenti</p>
        </div>
        <div ref={categoryRef} className="h-[220px] min-w-0">
          {categoryWidth > 0 && categoryTotals.length > 0 ? (
            <PieChart width={categoryWidth} height={220}>
              <Pie
                data={categoryTotals}
                dataKey="value"
                nameKey="name"
                innerRadius={56}
                outerRadius={88}
                paddingAngle={5}
                stroke="none"
              >
                {categoryTotals.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip currency={currency} />} />
            </PieChart>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Nessuna categoria da visualizzare.
            </div>
          )}
        </div>
        <ChartLegend data={categoryTotals} />
      </div>

      <div className="min-h-80 rounded-lg border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-slate-50">
            <SectionTitle icon={ChartLine}>Andamento annuo</SectionTitle>
          </h2>
          <p className="text-sm text-slate-400">Mesi dell&apos;anno selezionato</p>
        </div>
        <div ref={trendRef} className="h-[220px] min-w-0">
          {trendWidth > 0 && hasTrend ? (
            <LineChart
              width={trendWidth}
              height={220}
              data={monthlyTrend}
              margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
            >
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickFormatter={(value) => monthLabels[String(value)] || String(value)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickFormatter={(value) => `${Number(value) / 100}`}
                width={46}
              />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Line
                type="monotone"
                dataKey="incomeCents"
                name="Entrate"
                stroke="#34d399"
                strokeWidth={2}
                dot={{ r: 3, fill: "#34d399", strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="expenseCents"
                name="Uscite"
                stroke="#fb7185"
                strokeWidth={2}
                dot={{ r: 3, fill: "#fb7185", strokeWidth: 0 }}
              />
            </LineChart>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Aggiungi movimenti per vedere il trend.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
