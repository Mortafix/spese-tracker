import {
  Banknote,
  CalendarClock,
  Plus,
  Save,
  Trash2,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import {
  createInvestmentAction,
  deleteInvestmentAction,
  deleteInvestmentTrackingAction,
  updateInvestmentAction,
  updateInvestmentTrackingAction,
  upsertCashBalanceAction,
} from "@/app/actions/mutations";
import {
  ActionBar,
  EntityCard,
  EntitySummaryRow,
  OwnerChip,
  SectionTitle,
} from "@/components/entity-ui";
import {
  ActiveField,
  Field,
  FormGrid,
  MoneyInput,
  OwnerSelect,
  SignedMoneyInput,
} from "@/components/forms";
import { InvestmentCharts } from "@/components/investments/investment-charts";
import { InvestmentTrackingForm } from "@/components/investments/tracking-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  cashBalanceForOwner,
  computeInvestmentPortfolioMetrics,
  dateInAppTimeZone,
  investmentCurrentValueCents,
  investmentNetContributedCents,
  investmentReturnPercent,
  investmentTrackingsFor,
  ownerMatchesInvestmentView,
  parseViewMode,
  splitFactor,
} from "@/lib/calculations";
import { formatDate } from "@/lib/dates";
import { centsToInputValue, formatCurrency } from "@/lib/money";
import { getAppData } from "@/lib/repository";
import { cn } from "@/lib/utils";
import type { AppSettings, Investment, InvestmentTracking, Owner, ViewMode } from "@/types/domain";

type InvestmentsPageProps = {
  searchParams: Promise<{
    view?: string;
  }>;
};

const cashOwners: Owner[] = ["mine", "partner", "shared"];

function todayInputValue() {
  return dateInAppTimeZone().toISOString().slice(0, 10);
}

function formatSignedCurrency(cents: number, currency: string) {
  if (cents > 0) {
    return `+${formatCurrency(cents, currency)}`;
  }

  return formatCurrency(cents, currency);
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "n.d.";
  }

  return `${value.toFixed(1)}%`;
}

function valueTone(value: number) {
  if (value > 0) return "text-emerald-200";
  if (value < 0) return "text-rose-200";
  return "text-slate-300";
}

function ownerCashLabel(owner: Owner, settings: AppSettings) {
  if (owner === "mine") return settings.profileNames.mine;
  if (owner === "partner") return settings.profileNames.partner;
  return "Entrambi";
}

function displayInvestmentStats(
  investment: Investment,
  trackings: InvestmentTracking[],
  view: ViewMode,
  settings: AppSettings,
) {
  const factor = splitFactor(investment.owner, view, settings);
  const originalCurrentValue = investmentCurrentValueCents(investment, trackings);
  const originalNetContributed = investmentNetContributedCents(investment, trackings);
  const currentValue = Math.round(originalCurrentValue * factor);
  const netContributed = Math.round(originalNetContributed * factor);
  const gainLoss = currentValue - netContributed;

  return {
    currentValue,
    netContributed,
    gainLoss,
    returnPercent: investmentReturnPercent(investment, trackings),
    originalCurrentValue,
  };
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <p className="truncate text-sm text-slate-400">{label}</p>
        <p className={cn("mt-2 text-2xl font-semibold tracking-normal text-slate-50", tone)}>
          {value}
        </p>
        {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}

export default async function InvestmentsPage({ searchParams }: InvestmentsPageProps) {
  const params = await searchParams;
  const view = parseViewMode(params.view);
  const data = await getAppData();
  const currency = data.settings.currency;
  const today = todayInputValue();
  const metrics = computeInvestmentPortfolioMetrics(data, view);
  const visibleInvestments = data.investments
    .filter((investment) => ownerMatchesInvestmentView(investment.owner, view))
    .sort((a, b) => Number(b.active) - Number(a.active) || b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header>
        <p className="text-sm font-medium text-cyan-300">Investimenti</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-50">
          Patrimonio investito e contanti
        </h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-5">
        <MetricCard
          label="Patrimonio totale"
          value={formatCurrency(metrics.totalValueCents, currency)}
          detail="Investimenti + contanti"
        />
        <MetricCard
          label="Contanti"
          value={formatCurrency(metrics.cashCents, currency)}
          detail="Saldo manuale corrente"
        />
        <MetricCard
          label="Valore investimenti"
          value={formatCurrency(metrics.investmentValueCents, currency)}
          detail={`${metrics.positions.length} attivi nella vista`}
        />
        <MetricCard
          label="Gain/loss"
          value={formatSignedCurrency(metrics.gainLossCents, currency)}
          detail={`Capitale netto ${formatCurrency(metrics.netContributedCents, currency)}`}
          tone={valueTone(metrics.gainLossCents)}
        />
        <MetricCard
          label="Rendimento"
          value={formatPercent(metrics.returnPercent)}
          detail="Su capitale netto investito"
          tone={valueTone(metrics.gainLossCents)}
        />
      </section>

      <InvestmentCharts
        allocationTotals={metrics.allocationTotals}
        performanceTotals={metrics.performanceTotals}
        performanceTotalsCurrentYear={metrics.performanceTotalsCurrentYear}
        trend={metrics.trend}
        trendCurrentYear={metrics.trendCurrentYear}
        currency={currency}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            <SectionTitle icon={Banknote}>Contanti</SectionTitle>
          </CardTitle>
          <CardDescription>Un saldo corrente per profilo, senza storico movimenti.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-3">
          {cashOwners.map((owner) => {
            const cashBalance = cashBalanceForOwner(data, owner);

            return (
              <details
                key={owner}
                className="rounded-lg border border-white/10 bg-white/[0.03]"
              >
                <summary className="flex cursor-pointer list-none flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-400">
                        {ownerCashLabel(owner, data.settings)}
                      </p>
                      <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-50">
                        {formatCurrency(cashBalance.balanceCents, currency)}
                      </p>
                    </div>
                    <OwnerChip owner={owner} settings={data.settings} variant="colored" />
                  </div>
                  <p className="text-xs text-slate-500">
                    Aggiornato al {formatDate(cashBalance.asOfDate)}
                  </p>
                </summary>
                <div className="border-t border-white/10 p-4">
                  <form action={upsertCashBalanceAction} className="space-y-4">
                    <input type="hidden" name="owner" value={owner} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Saldo">
                        <MoneyInput
                          name="balance"
                          defaultValue={centsToInputValue(cashBalance.balanceCents)}
                        />
                      </Field>
                      <Field label="Data">
                        <Input
                          name="asOfDate"
                          type="date"
                          defaultValue={cashBalance.asOfDate || today}
                          required
                        />
                      </Field>
                    </div>
                    <Button type="submit" variant="secondary">
                      <Save className="h-4 w-4" />
                      Salva
                    </Button>
                  </form>
                </div>
              </details>
            );
          })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <SectionTitle icon={TrendingUp}>Investimenti configurati</SectionTitle>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleInvestments.length === 0 ? (
            <p className="text-sm text-slate-400">Nessun investimento per questa vista.</p>
          ) : (
            visibleInvestments.map((investment) => {
              const trackings = investmentTrackingsFor(investment, data.investmentTrackings);
              const history = [...trackings].reverse();
              const stats = displayInvestmentStats(
                investment,
                trackings,
                view,
                data.settings,
              );
              const updateFormId = `investment-update-${investment.id}`;

              return (
                <EntityCard key={investment.id} active={investment.active}>
                  <EntitySummaryRow>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-semibold text-slate-50">
                          {investment.name}
                        </p>
                        <OwnerChip owner={investment.owner} settings={data.settings} variant="colored" />
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        Dal {formatDate(investment.startDate)} · {trackings.length} tracking
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-slate-50 sm:text-lg">
                        {formatCurrency(stats.currentValue, currency)}
                      </p>
                      <p className={cn("mt-1 text-xs font-medium", valueTone(stats.gainLoss))}>
                        {formatSignedCurrency(stats.gainLoss, currency)} ·{" "}
                        {formatPercent(stats.returnPercent)}
                      </p>
                      {!investment.active ? (
                        <p className="mt-1 text-xs font-medium text-slate-500">Disattivo</p>
                      ) : null}
                    </div>
                  </EntitySummaryRow>

                  <div className="space-y-4 border-t border-white/10 p-4">
                    <details className="rounded-lg border border-white/10 bg-white/[0.03]">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-50">Modifica investimento</p>
                          <p className="text-sm text-slate-400">Nome, owner, importo iniziale e stato.</p>
                        </div>
                        <Save className="h-4 w-4 text-cyan-300" aria-hidden />
                      </summary>
                      <div className="border-t border-white/10 p-4">
                        <form id={updateFormId} action={updateInvestmentAction} className="space-y-4">
                          <input type="hidden" name="id" value={investment.id} />
                          <FormGrid>
                            <Field label="Nome">
                              <Input name="name" defaultValue={investment.name} required />
                            </Field>
                            <Field label="Importo iniziale">
                              <MoneyInput
                                name="initialAmount"
                                defaultValue={centsToInputValue(investment.initialAmountCents)}
                              />
                            </Field>
                            <Field label="Data inizio">
                              <Input
                                name="startDate"
                                type="date"
                                defaultValue={investment.startDate}
                                required
                              />
                            </Field>
                            <Field label="Owner">
                              <OwnerSelect settings={data.settings} defaultValue={investment.owner} />
                            </Field>
                            <Field label="Stato">
                              <ActiveField defaultChecked={investment.active} />
                            </Field>
                          </FormGrid>
                        </form>
                        <ActionBar>
                          <Button type="submit" form={updateFormId} variant="secondary">
                            <Save className="h-4 w-4" />
                            Salva investimento
                          </Button>
                          <form action={deleteInvestmentAction}>
                            <input type="hidden" name="id" value={investment.id} />
                            <Button type="submit" variant="danger" size="sm">
                              <Trash2 className="h-4 w-4" />
                              Elimina investimento
                            </Button>
                          </form>
                        </ActionBar>
                      </div>
                    </details>

                    <details className="rounded-lg border border-white/10 bg-white/[0.03]">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-50">Nuovo tracking</p>
                          <p className="text-sm text-slate-400">Versamento, ritiro e valore attuale.</p>
                        </div>
                        <WalletCards className="h-4 w-4 text-cyan-300" aria-hidden />
                      </summary>
                      <div className="border-t border-white/10 p-4">
                        <InvestmentTrackingForm
                          investmentId={investment.id}
                          defaultCurrentValueCents={stats.originalCurrentValue}
                          defaultTrackedAt={today}
                        />
                      </div>
                    </details>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-base font-semibold text-slate-50">
                        <CalendarClock className="h-4 w-4 text-cyan-300" aria-hidden />
                        Storico snapshot
                      </div>
                      {history.length === 0 ? (
                        <p className="text-sm text-slate-400">
                          Nessun tracking ancora: il valore coincide con l&apos;importo iniziale.
                        </p>
                      ) : (
                        history.map((tracking) => {
                          const trackingFormId = `tracking-update-${tracking.id}`;

                          return (
                            <details
                              key={tracking.id}
                              className="rounded-lg border border-white/10 bg-white/[0.03]"
                            >
                              <summary className="grid cursor-pointer list-none gap-3 px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto]">
                                <div>
                                  <p className="font-medium text-slate-50">
                                    {formatDate(tracking.trackedAt)}
                                  </p>
                                  {tracking.note ? (
                                    <p className="mt-1 text-sm text-slate-400">{tracking.note}</p>
                                  ) : null}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-slate-50">
                                    {formatCurrency(tracking.currentValueCents, currency)}
                                  </p>
                                  <p
                                    className={cn(
                                      "mt-1 text-xs font-medium",
                                      valueTone(tracking.movementCents),
                                    )}
                                  >
                                    {formatSignedCurrency(tracking.movementCents, currency)}
                                  </p>
                                </div>
                              </summary>
                              <div className="border-t border-white/10 p-3">
                                <form
                                  id={trackingFormId}
                                  action={updateInvestmentTrackingAction}
                                  className="space-y-4"
                                >
                                  <input type="hidden" name="id" value={tracking.id} />
                                  <input type="hidden" name="investmentId" value={investment.id} />
                                  <FormGrid>
                                    <Field label="Data tracking">
                                      <Input
                                        name="trackedAt"
                                        type="date"
                                        defaultValue={tracking.trackedAt}
                                        required
                                      />
                                    </Field>
                                    <Field label="Movimento">
                                      <SignedMoneyInput
                                        name="movement"
                                        defaultValue={centsToInputValue(tracking.movementCents)}
                                      />
                                    </Field>
                                    <Field label="Valore attuale">
                                      <MoneyInput
                                        name="currentValue"
                                        defaultValue={centsToInputValue(tracking.currentValueCents)}
                                      />
                                    </Field>
                                    <Field label="Note" className="sm:col-span-2 xl:col-span-1">
                                      <Textarea name="note" defaultValue={tracking.note} />
                                    </Field>
                                  </FormGrid>
                                </form>
                                <ActionBar>
                                  <Button type="submit" form={trackingFormId} variant="secondary">
                                    <Save className="h-4 w-4" />
                                    Salva tracking
                                  </Button>
                                  <form action={deleteInvestmentTrackingAction}>
                                    <input type="hidden" name="id" value={tracking.id} />
                                    <Button type="submit" variant="danger" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                      Elimina
                                    </Button>
                                  </form>
                                </ActionBar>
                              </div>
                            </details>
                          );
                        })
                      )}
                    </div>
                  </div>
                </EntityCard>
              );
            })
          )}
        </CardContent>
      </Card>

      <details className="rounded-xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/20">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-50">Nuovo investimento</h2>
            <p className="text-sm text-slate-400">Nome, importo iniziale e data di partenza.</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
            <Plus className="h-4 w-4" aria-hidden />
          </div>
        </summary>
        <div className="border-t border-white/10 p-4">
          <form action={createInvestmentAction} className="space-y-4">
            <FormGrid>
              <Field label="Nome">
                <Input name="name" required placeholder="Es. ETF globale" />
              </Field>
              <Field label="Importo iniziale">
                <MoneyInput name="initialAmount" />
              </Field>
              <Field label="Data inizio">
                <Input name="startDate" type="date" defaultValue={today} required />
              </Field>
              <Field label="Owner">
                <OwnerSelect settings={data.settings} defaultValue="mine" />
              </Field>
              <Field label="Stato">
                <ActiveField />
              </Field>
            </FormGrid>
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Aggiungi investimento
            </Button>
          </form>
        </div>
      </details>
    </div>
  );
}
