import { CalendarClock, Landmark } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { CategoryChip, OwnerChip, SectionTitle } from "@/components/entity-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { computeDashboardMetrics, parseViewMode } from "@/lib/calculations";
import { formatDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/money";
import { getAppData } from "@/lib/repository";

type DashboardPageProps = {
  searchParams: Promise<{
    view?: string;
  }>;
};

function daysUntilLabel(days: number) {
  if (days === 0) return "oggi";
  if (days === 1) return "tra 1 giorno";
  return `tra ${days} giorni`;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const view = parseViewMode(params.view);
  const data = await getAppData();
  const today = new Date();
  const metrics = computeDashboardMetrics(data, view, today);
  const totalMetrics = computeDashboardMetrics(data, "common", today, {
    commonScope: "allOwners",
  });
  const currency = data.settings.currency;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header>
        <p className="text-sm font-medium text-cyan-300">Dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-50">
          Riepilogo spese
        </h1>
      </header>

      <DashboardSummary
        metrics={metrics}
        totalMetrics={totalMetrics}
        view={view}
        settings={data.settings}
        currency={currency}
      />

      <DashboardCharts
        categoryTotals={metrics.categoryTotals}
        ownerTotals={metrics.ownerTotals}
        currency={currency}
      />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>
              <SectionTitle icon={CalendarClock}>Prossime spese</SectionTitle>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.upcomingPayments.length === 0 ? (
              <p className="text-sm text-slate-400">Nessuna scadenza attiva.</p>
            ) : (
              metrics.upcomingPayments.map((payment) => (
                <div
                  key={`${payment.type}-${payment.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 sm:px-4 sm:py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-50">
                      {payment.name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <CategoryChip
                        name={payment.categoryName}
                        color={payment.categoryColor}
                        icon={payment.categoryIcon}
                      />
                      <OwnerChip
                        owner={payment.owner}
                        settings={data.settings}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-slate-50 sm:text-lg">
                      {formatCurrency(payment.amountCents, currency)}
                    </p>
                    {payment.originalAmountCents !== payment.amountCents ? (
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        totale{" "}
                        {formatCurrency(payment.originalAmountCents, currency)}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      {daysUntilLabel(payment.daysUntil)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <SectionTitle icon={Landmark}>Mutui e finanziamenti</SectionTitle>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.loanProgress.length === 0 ? (
              <p className="text-sm text-slate-400">
                Nessun finanziamento attivo.
              </p>
            ) : (
              metrics.loanProgress.map((loan) => (
                <div
                  key={loan.id}
                  className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-50">{loan.name}</p>
                      <p className="text-sm text-slate-400">
                        {loan.paidInstallments}/{loan.totalInstallments} rate ·{" "}
                        {loan.progressPercent}%
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-50">
                      {formatCurrency(loan.monthlyAmountCents, currency)}
                    </p>
                  </div>
                  <Progress value={loan.progressPercent} />
                  <p className="text-xs text-slate-400">
                    Fine stimata {formatDate(loan.estimatedEndDate)},{" "}
                    {loan.remainingInstallments} rate residue.
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
