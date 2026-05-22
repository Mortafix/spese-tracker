import { CalendarClock, Plus, ReceiptText, Save, Trash2 } from "lucide-react";
import {
  createExpenseAction,
  deleteExpenseAction,
  updateExpenseAction,
} from "@/app/actions/mutations";
import {
  ActionBar,
  CategoryChip,
  EntityCard,
  EntitySummaryRow,
  OwnerChip,
  RecurrenceChip,
  SectionTitle,
} from "@/components/entity-ui";
import { ExpenseListControls } from "@/components/expenses/expense-list-controls";
import {
  ActiveField,
  Field,
  FormGrid,
  MoneyInput,
  OwnerSelect,
  RecurrenceSelect,
} from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  expenseMonthlyImpact,
  expenseMonthlyTotalCents,
  expenseMatchesCategoryFilter,
  nextExpenseDueDate,
  ownerMatchesExpenseView,
  parseViewMode,
  recurrencePeriodLabel,
} from "@/lib/calculations";
import { formatDate } from "@/lib/dates";
import { centsToInputValue, formatCurrency } from "@/lib/money";
import { getAppData } from "@/lib/repository";
import type { AppSettings, ViewMode } from "@/types/domain";

type ExpensesPageProps = {
  searchParams: Promise<{
    category?: string;
    details?: string;
    view?: string;
  }>;
};

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

function viewModeLabel(view: ViewMode, settings: AppSettings) {
  if (view === "mine") return settings.profileNames.mine;
  if (view === "partner") return settings.profileNames.partner;
  return "Comune";
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = await searchParams;
  const view = parseViewMode(params.view);
  const data = await getAppData();
  const currency = data.settings.currency;
  const selectedCategory = data.categories.find((category) => category.id === params.category);
  const selectedCategoryId = selectedCategory?.id;
  const showDetails = params.details === "1";
  const visibleExpenses = data.expenses
    .filter((expense) => ownerMatchesExpenseView(expense.owner, view))
    .filter((expense) => expenseMatchesCategoryFilter(expense, selectedCategoryId))
    .sort((a, b) => expenseMonthlyImpact(b) - expenseMonthlyImpact(a));
  const activeVisibleExpenseCount = visibleExpenses.filter((expense) => expense.active).length;
  const monthlyTotalCents = expenseMonthlyTotalCents(
    data.expenses,
    view,
    data.settings,
    selectedCategoryId,
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header>
        <p className="text-sm font-medium text-cyan-300">Spese</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-50">
          Spese ricorrenti
        </h1>
      </header>

      <details className="rounded-xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/20">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-50">Nuova spesa</h2>
            <p className="text-sm text-slate-400">Apri il pannello quando devi aggiungerne una.</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
            <Plus className="h-4 w-4" aria-hidden />
          </div>
        </summary>
        <div className="border-t border-white/10 p-4">
          <form action={createExpenseAction} className="space-y-4">
            <FormGrid>
              <Field label="Nome">
                <Input name="name" required placeholder="Es. Affitto" />
              </Field>
              <Field label="Categoria">
                <CategorySelect categories={data.categories} />
              </Field>
              <Field label="Importo">
                <MoneyInput name="amount" />
              </Field>
              <Field label="Owner">
                <OwnerSelect settings={data.settings} />
              </Field>
              <Field label="Cadenza">
                <RecurrenceSelect />
              </Field>
              <Field label="Prima scadenza">
                <Input name="firstDueDate" type="date" required />
              </Field>
              <Field label="Stato">
                <ActiveField />
              </Field>
              <Field label="Descrizione" className="sm:col-span-2 xl:col-span-4">
                <Textarea name="description" placeholder="Note facoltative" />
              </Field>
            </FormGrid>
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Aggiungi spesa
            </Button>
          </form>
        </div>
      </details>

      <Card>
        <CardHeader>
          <CardTitle>
            <SectionTitle icon={ReceiptText}>Spese attive e passive</SectionTitle>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ExpenseListControls categories={data.categories} />
          <div className="grid gap-3 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="text-sm font-medium text-cyan-100">Totale mensile attivo</p>
              <p className="mt-1 text-xs text-slate-400">
                Vista {viewModeLabel(view, data.settings)} ·{" "}
                {selectedCategory ? selectedCategory.name : "Tutte le categorie"} ·{" "}
                {activeVisibleExpenseCount} spese attive
              </p>
            </div>
            <p className="text-2xl font-semibold tracking-normal text-slate-50">
              {formatCurrency(monthlyTotalCents, currency)}
            </p>
          </div>
          {visibleExpenses.length === 0 ? (
            <p className="text-sm text-slate-400">Nessuna spesa per questa vista.</p>
          ) : (
            visibleExpenses.map((expense) => {
              const category = data.categories.find((item) => item.id === expense.categoryId);
              const nextDue = nextExpenseDueDate(expense);
              const updateFormId = `expense-update-${expense.id}`;

              return (
                <EntityCard
                  key={expense.id}
                  active={expense.active}
                >
                  <EntitySummaryRow>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-50">
                        {expense.name}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <CategoryChip
                          name={category?.name || "Senza categoria"}
                          color={category?.color}
                          icon={category?.icon}
                        />
                        <OwnerChip owner={expense.owner} settings={data.settings} />
                      </div>
                      {showDetails ? (
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                          <CalendarClock className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
                          <span>Prossimo pagamento {formatDate(nextDue)}</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-slate-50 sm:text-lg">
                        {formatCurrency(expense.amountCents, currency)}
                        <span className="ml-1 text-xs font-medium text-slate-400">
                          / {recurrencePeriodLabel(expense.recurrence)}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatCurrency(expenseMonthlyImpact(expense), currency)} / mese
                      </p>
                      {!expense.active ? (
                        <p className="mt-1 text-xs font-medium text-slate-500">Disattiva</p>
                      ) : null}
                      {showDetails ? (
                        <div className="mt-2 flex justify-end">
                          <RecurrenceChip recurrence={expense.recurrence} />
                        </div>
                      ) : null}
                    </div>
                  </EntitySummaryRow>
                  <div className="border-t border-white/10 p-4">
                    <form id={updateFormId} action={updateExpenseAction} className="space-y-4">
                      <input type="hidden" name="id" value={expense.id} />
                      <FormGrid>
                        <Field label="Nome">
                          <Input name="name" defaultValue={expense.name} required />
                        </Field>
                        <Field label="Categoria">
                          <CategorySelect categories={data.categories} defaultValue={expense.categoryId} />
                        </Field>
                        <Field label="Importo">
                          <MoneyInput name="amount" defaultValue={centsToInputValue(expense.amountCents)} />
                        </Field>
                        <Field label="Owner">
                          <OwnerSelect settings={data.settings} defaultValue={expense.owner} />
                        </Field>
                        <Field label="Cadenza">
                          <RecurrenceSelect defaultValue={expense.recurrence} />
                        </Field>
                        <Field label="Prima scadenza">
                          <Input
                            name="firstDueDate"
                            type="date"
                            defaultValue={
                              expense.firstDueDate || nextDue.toISOString().slice(0, 10)
                            }
                            required
                          />
                        </Field>
                        <Field label="Stato">
                          <ActiveField defaultChecked={expense.active} />
                        </Field>
                        <Field label="Descrizione" className="sm:col-span-2 xl:col-span-4">
                          <Textarea name="description" defaultValue={expense.description} />
                        </Field>
                      </FormGrid>
                    </form>
                    <ActionBar>
                      <Button type="submit" form={updateFormId} variant="secondary">
                        <Save className="h-4 w-4" />
                        Salva modifiche
                      </Button>
                      <form action={deleteExpenseAction}>
                        <input type="hidden" name="id" value={expense.id} />
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
