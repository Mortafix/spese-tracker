import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CircleDollarSign,
  HandCoins,
  ListOrdered,
  Plus,
  Save,
  Trash2,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import {
  createOneTimePaymentAction,
  deleteOneTimePaymentAction,
  updateOneTimePaymentAction,
} from "@/app/actions/mutations";
import {
  ActionBar,
  CategoryChip,
  EntityCard,
  EntitySummaryRow,
  SectionTitle,
} from "@/components/entity-ui";
import { Field, FormGrid, MoneyInput } from "@/components/forms";
import { ExtraPeriodControls } from "@/components/one-time-payments/extra-period-controls";
import { OneTimePaymentCharts } from "@/components/one-time-payments/one-time-payment-charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ONE_TIME_PAYMENT_MIN_YEAR,
  computeOneTimePaymentMetrics,
  dateInAppTimeZone,
  filterOneTimePaymentsByPeriod,
  oneTimePaymentAvailableYears,
  oneTimePaymentDirectionLabel,
  oneTimePaymentDirectionOptions,
  oneTimePaymentTypeLabel,
  oneTimePaymentTypeOptions,
  parseOneTimePaymentPeriod,
  parseOneTimePaymentYear,
} from "@/lib/calculations";
import { formatDate } from "@/lib/dates";
import { centsToInputValue, formatCurrency } from "@/lib/money";
import { getAppData } from "@/lib/repository";
import { cn } from "@/lib/utils";
import type { OneTimePaymentDirection, OneTimePaymentType } from "@/types/domain";

type OneTimePaymentsPageProps = {
  searchParams: Promise<{
    year?: string;
    period?: string;
    category?: string;
  }>;
};

function todayInputValue() {
  return dateInAppTimeZone().toISOString().slice(0, 10);
}

function valueTone(value: number) {
  if (value > 0) return "text-emerald-200";
  if (value < 0) return "text-rose-200";
  return "text-slate-300";
}

function formatSignedCurrency(cents: number, currency: string) {
  if (cents > 0) {
    return `+${formatCurrency(cents, currency)}`;
  }

  if (cents < 0) {
    return `-${formatCurrency(Math.abs(cents), currency)}`;
  }

  return formatCurrency(0, currency);
}

function CategorySelect({
  categories,
  defaultValue,
}: {
  categories: Awaited<ReturnType<typeof getAppData>>["categories"];
  defaultValue?: string;
}) {
  return (
    <Select name="categoryId" defaultValue={defaultValue} required>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </Select>
  );
}

function DirectionSelect({ defaultValue = "expense" }: { defaultValue?: OneTimePaymentDirection }) {
  return (
    <Select name="direction" defaultValue={defaultValue}>
      {oneTimePaymentDirectionOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}

function TypeSelect({ defaultValue = "single" }: { defaultValue?: OneTimePaymentType }) {
  return (
    <Select name="type" defaultValue={defaultValue}>
      {oneTimePaymentTypeOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}

function CashField({ defaultChecked = false }: { defaultChecked?: boolean }) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-300">
      <input
        type="checkbox"
        name="isCash"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-white/10 accent-cyan-300"
      />
      Contanti
    </label>
  );
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

const directionIconMap = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
} satisfies Record<OneTimePaymentDirection, LucideIcon>;

const typeIconMap = {
  deposit: HandCoins,
  installment: ListOrdered,
  balance: BadgeCheck,
  single: CircleDollarSign,
} satisfies Record<OneTimePaymentType, LucideIcon>;

function DirectionBadge({ direction }: { direction: OneTimePaymentDirection }) {
  const Icon = directionIconMap[direction];
  const directionTone =
    direction === "income"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : "border-rose-400/30 bg-rose-400/10 text-rose-200";

  return (
    <Badge className={cn("gap-1", directionTone)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {oneTimePaymentDirectionLabel(direction)}
    </Badge>
  );
}

function PaymentTypeBadge({ type }: { type: OneTimePaymentType }) {
  const Icon = typeIconMap[type];

  return (
    <Badge className="gap-1 border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {oneTimePaymentTypeLabel(type)}
    </Badge>
  );
}

export default async function OneTimePaymentsPage({ searchParams }: OneTimePaymentsPageProps) {
  const params = await searchParams;
  const data = await getAppData();
  const currency = data.settings.currency;
  const years = oneTimePaymentAvailableYears(data.oneTimePayments);
  const maxYear = years[0] ?? ONE_TIME_PAYMENT_MIN_YEAR;
  const selectedYear = parseOneTimePaymentYear(params.year, data.oneTimePayments);
  const selectedPeriod = parseOneTimePaymentPeriod(params.period);
  const selectedCategory = data.categories.find((category) => category.id === params.category);
  const categoryFilteredPayments = selectedCategory
    ? data.oneTimePayments.filter((payment) => payment.categoryId === selectedCategory.id)
    : data.oneTimePayments;
  const filteredData = {
    ...data,
    oneTimePayments: categoryFilteredPayments,
  };
  const metrics = computeOneTimePaymentMetrics(filteredData, selectedYear, selectedPeriod);
  const visiblePayments = filterOneTimePaymentsByPeriod(
    categoryFilteredPayments,
    selectedYear,
    selectedPeriod,
  );
  const today = todayInputValue();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header>
        <p className="text-sm font-medium text-cyan-300">Extra</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-50">
          Movimenti extra
        </h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Entrate"
          value={formatCurrency(metrics.incomeCents, currency)}
          detail="Movimenti extra nel periodo"
          tone="text-emerald-200"
        />
        <MetricCard
          label="Uscite"
          value={formatCurrency(metrics.expenseCents, currency)}
          detail="Pagamenti non ricorrenti"
          tone="text-rose-200"
        />
        <MetricCard
          label="Saldo periodo"
          value={formatSignedCurrency(metrics.netCents, currency)}
          detail={`${metrics.count} movimenti registrati`}
          tone={valueTone(metrics.netCents)}
        />
        <MetricCard
          label="Contanti"
          value={formatCurrency(metrics.cashCents, currency)}
          detail="Movimenti marcati contanti"
        />
      </section>

      <OneTimePaymentCharts
        directionTotals={metrics.directionTotals}
        categoryTotals={metrics.categoryTotals}
        monthlyTrend={metrics.monthlyTrend}
        trendGranularity={metrics.trendGranularity}
        currency={currency}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            <SectionTitle icon={CalendarDays}>Filtri</SectionTitle>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExtraPeriodControls
            selectedYear={selectedYear}
            selectedPeriod={selectedPeriod}
            selectedCategoryId={selectedCategory?.id}
            categories={data.categories}
            minYear={ONE_TIME_PAYMENT_MIN_YEAR}
            maxYear={maxYear}
          />
        </CardContent>
      </Card>

      <details className="rounded-xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/20">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-50">
              Nuovo extra
            </h2>
            <p className="text-sm text-slate-400">Pagamenti singoli, rate, saldi o entrate extra.</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
            <Plus className="h-4 w-4" aria-hidden />
          </div>
        </summary>
        <div className="border-t border-white/10 p-4">
          <form action={createOneTimePaymentAction} className="space-y-4">
            <FormGrid>
              <Field label="Nome">
                <Input name="name" required placeholder="Es. Tredicesima" />
              </Field>
              <Field label="Categoria">
                <CategorySelect categories={data.categories} />
              </Field>
              <Field label="Direzione">
                <DirectionSelect />
              </Field>
              <Field label="Tipo">
                <TypeSelect />
              </Field>
              <Field label="Data">
                <Input name="date" type="date" defaultValue={today} required />
              </Field>
              <Field label="Importo">
                <MoneyInput name="amount" />
              </Field>
              <Field label="Pagamento">
                <CashField />
              </Field>
              <Field label="Note" className="sm:col-span-2 xl:col-span-4">
                <Textarea name="note" placeholder="Note facoltative" />
              </Field>
            </FormGrid>
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Aggiungi movimento
            </Button>
          </form>
        </div>
      </details>

      <Card>
        <CardHeader>
          <CardTitle>
            <SectionTitle icon={WalletCards}>Movimenti del periodo</SectionTitle>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {visiblePayments.length === 0 ? (
            <p className="text-sm text-slate-400">Nessun extra per questa vista.</p>
          ) : (
            visiblePayments.map((payment) => {
              const category = data.categories.find((item) => item.id === payment.categoryId);
              const updateFormId = `one-time-payment-update-${payment.id}`;

              return (
                <EntityCard key={payment.id}>
                  <EntitySummaryRow>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-50">
                        {payment.name}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <CategoryChip
                          name={category?.name || "Senza categoria"}
                          color={category?.color}
                          icon={category?.icon}
                        />
                        <DirectionBadge direction={payment.direction} />
                        <PaymentTypeBadge type={payment.type} />
                        {payment.isCash ? (
                          <Badge className="gap-1 border-amber-300/30 bg-amber-300/10 text-amber-200">
                            <Banknote className="h-3.5 w-3.5" aria-hidden />
                            Contanti
                          </Badge>
                        ) : null}
                      </div>
                      {payment.note ? (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-400">{payment.note}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-base font-semibold sm:text-lg",
                          payment.direction === "income" ? "text-emerald-200" : "text-rose-200",
                        )}
                      >
                        {payment.direction === "income" ? "+" : "-"}
                        {formatCurrency(payment.amountCents, currency)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-400">
                        {formatDate(payment.date)}
                      </p>
                    </div>
                  </EntitySummaryRow>
                  <div className="border-t border-white/10 p-4">
                    <form id={updateFormId} action={updateOneTimePaymentAction} className="space-y-4">
                      <input type="hidden" name="id" value={payment.id} />
                      <FormGrid>
                        <Field label="Nome">
                          <Input name="name" defaultValue={payment.name} required />
                        </Field>
                        <Field label="Categoria">
                          <CategorySelect categories={data.categories} defaultValue={payment.categoryId} />
                        </Field>
                        <Field label="Direzione">
                          <DirectionSelect defaultValue={payment.direction} />
                        </Field>
                        <Field label="Tipo">
                          <TypeSelect defaultValue={payment.type} />
                        </Field>
                        <Field label="Data">
                          <Input name="date" type="date" defaultValue={payment.date} required />
                        </Field>
                        <Field label="Importo">
                          <MoneyInput name="amount" defaultValue={centsToInputValue(payment.amountCents)} />
                        </Field>
                        <Field label="Pagamento">
                          <CashField defaultChecked={payment.isCash} />
                        </Field>
                        <Field label="Note" className="sm:col-span-2 xl:col-span-4">
                          <Textarea name="note" defaultValue={payment.note} />
                        </Field>
                      </FormGrid>
                    </form>
                    <ActionBar>
                      <Button type="submit" form={updateFormId} variant="secondary">
                        <Save className="h-4 w-4" />
                        Salva movimento
                      </Button>
                      <form action={deleteOneTimePaymentAction}>
                        <input type="hidden" name="id" value={payment.id} />
                        <Button type="submit" variant="danger" size="sm">
                          <Trash2 className="h-4 w-4" />
                          Elimina
                        </Button>
                      </form>
                    </ActionBar>
                  </div>
                </EntityCard>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
