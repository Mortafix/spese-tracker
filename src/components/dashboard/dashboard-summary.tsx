"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
  PiggyBank,
  Scale,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { AppSettings, DashboardMetrics, ViewMode } from "@/types/domain";

type MetricConfig = {
  key: keyof Pick<
    DashboardMetrics,
    | "incomeCents"
    | "recurringCents"
    | "availableCents"
    | "remainingThisMonthCents"
    | "sharedAccountTopUpCents"
  >;
  label: string;
  icon: typeof WalletCards;
};

const metricsConfig: MetricConfig[] = [
  { key: "incomeCents", label: "Budget mensile", icon: ArrowDownToLine },
  { key: "recurringCents", label: "Spese ricorrenti", icon: ArrowUpFromLine },
  { key: "availableCents", label: "Disponibile", icon: PiggyBank },
  { key: "remainingThisMonthCents", label: "Da pagare", icon: CalendarClock },
  { key: "sharedAccountTopUpCents", label: "Da caricare", icon: UsersRound },
];

function percentage(value: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

export function DashboardSummary({
  metrics,
  totalMetrics,
  view,
  settings,
  currency,
}: {
  metrics: DashboardMetrics;
  totalMetrics: DashboardMetrics;
  view: ViewMode;
  settings: AppSettings;
  currency: string;
}) {
  const [mode, setMode] = useState<"personal" | "comparison">("personal");
  const profileName =
    view === "mine"
      ? settings.profileNames.mine
      : settings.profileNames.partner;
  const showComparison = view !== "common";

  const cards = useMemo(
    () =>
      metricsConfig.map((metric) => {
        const value = metrics[metric.key];
        const total = totalMetrics[metric.key];
        const Icon = metric.icon;
        const comparison = showComparison && mode === "comparison";

        return {
          ...metric,
          Icon,
          value,
          total,
          comparison,
        };
      }),
    [metrics, mode, showComparison, totalMetrics],
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Scale className="h-4 w-4 text-cyan-300" aria-hidden />
          <span>
            {showComparison
              ? `Vista ${profileName}`
              : "Vista comune: bilancio del nucleo"}
          </span>
        </div>

        {showComparison ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-1">
            <Button
              size="sm"
              variant={mode === "personal" ? "primary" : "ghost"}
              onClick={() => setMode("personal")}
              className="h-8"
            >
              Quota
            </Button>
            <Button
              size="sm"
              variant={mode === "comparison" ? "primary" : "ghost"}
              onClick={() => setMode("comparison")}
              className="h-8"
            >
              Sul totale
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-5">
        {cards.map(({ key, label, Icon, value, total, comparison }) => (
          <Card key={key} className="overflow-hidden">
            <CardContent className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-50">
                  {formatCurrency(value, currency)}
                </p>
                {comparison ? (
                  <p className="mt-1 text-xs text-slate-500">
                    {percentage(value, total)} di{" "}
                    {formatCurrency(total, currency)}
                  </p>
                ) : null}
              </div>
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-300/10 text-cyan-200",
                  key === "sharedAccountTopUpCents" &&
                    "border-amber-300/20 bg-amber-300/10 text-amber-200",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
