"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { oneTimePaymentPeriodOptions, type OneTimePaymentPeriod } from "@/lib/calculations";
import { cn } from "@/lib/utils";

export function ExtraPeriodControls({
  selectedYear,
  selectedPeriod,
  minYear,
  maxYear,
}: {
  selectedYear: number;
  selectedPeriod: OneTimePaymentPeriod;
  minYear: number;
  maxYear: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canGoBack = selectedYear > minYear;
  const canGoForward = selectedYear < maxYear;

  function updateView(next: { year?: number; period?: OneTimePaymentPeriod }) {
    const params = new URLSearchParams(searchParams);

    if (next.year) {
      params.set("year", String(next.year));
    }

    if (next.period) {
      params.set("period", next.period);
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
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

      <div className="flex flex-wrap justify-center gap-2">
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
  );
}
