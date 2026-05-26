"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CategoryChip } from "@/components/entity-ui";
import { Badge } from "@/components/ui/badge";
import { oneTimePaymentPeriodOptions, type OneTimePaymentPeriod } from "@/lib/calculations";
import { cn } from "@/lib/utils";

const multiYearPeriods: OneTimePaymentPeriod[] = ["last3Years", "allYears"];

export function ExtraPeriodControls({
  selectedYear,
  selectedPeriod,
  selectedCategoryId,
  categories,
  minYear,
  maxYear,
}: {
  selectedYear: number;
  selectedPeriod: OneTimePaymentPeriod;
  selectedCategoryId?: string;
  categories: Array<{ id: string; name: string; color?: string; icon?: string }>;
  minYear: number;
  maxYear: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canGoBack = selectedYear > minYear;
  const canGoForward = selectedYear < maxYear;
  const showYearSelector = !multiYearPeriods.includes(selectedPeriod);

  function updateView(next: {
    year?: number;
    period?: OneTimePaymentPeriod;
    categoryId?: string;
  }) {
    const params = new URLSearchParams(searchParams);

    if (next.year) {
      params.set("year", String(next.year));
    }

    if (next.period) {
      params.set("period", next.period);
    }

    if (typeof next.categoryId === "string") {
      if (next.categoryId) {
        params.set("category", next.categoryId);
      } else {
        params.delete("category");
      }
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
      {showYearSelector ? (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            title="Anno precedente"
            disabled={!canGoBack}
            onClick={() => updateView({ year: selectedYear - 1 })}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <p className="min-w-24 text-center text-2xl font-semibold tracking-normal text-slate-50">
            {selectedYear}
          </p>
          <button
            type="button"
            title="Anno successivo"
            disabled={!canGoForward}
            onClick={() => updateView({ year: selectedYear + 1 })}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-300">Periodo</p>
          <div className="flex flex-wrap gap-2">
            {oneTimePaymentPeriodOptions.map((option) => {
              const active = selectedPeriod === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateView({ period: option.value })}
                  className={cn(
                    "h-9 rounded-md border px-4 text-sm font-medium transition",
                    active
                      ? "border-cyan-300/40 bg-cyan-300 text-slate-950"
                      : "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] hover:text-slate-50",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-300">Categoria</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={!selectedCategoryId}
              onClick={() => updateView({ categoryId: "" })}
              className={cn(
                "cursor-pointer rounded-md transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50",
                !selectedCategoryId ? "opacity-100" : "opacity-45 hover:opacity-80",
              )}
            >
              <Badge className="pointer-events-none border-white/10 bg-white/[0.04] text-slate-200">
                Tutte
              </Badge>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                aria-pressed={selectedCategoryId === category.id}
                onClick={() => updateView({ categoryId: category.id })}
                className={cn(
                  "cursor-pointer rounded-md transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50",
                  selectedCategoryId === category.id
                    ? "opacity-100"
                    : "opacity-45 hover:opacity-80",
                )}
              >
                <CategoryChip
                  name={category.name}
                  color={category.color}
                  icon={category.icon}
                  className="pointer-events-none"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
