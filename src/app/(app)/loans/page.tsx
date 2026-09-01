import { Landmark, Plus, Save, Trash2 } from "lucide-react";
import {
  createLoanAction,
  deleteLoanAction,
  updateLoanAction,
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
} from "@/components/forms";
import { PrivacyDetails, PrivateValue } from "@/components/privacy-mode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { estimatedLoanEndDate, paidInstallments } from "@/lib/calculations";
import { formatDate } from "@/lib/dates";
import { centsToInputValue, formatCurrency } from "@/lib/money";
import { getAppData } from "@/lib/repository";

export default async function LoansPage() {
  const data = await getAppData();
  const currency = data.settings.currency;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header>
        <p className="text-sm font-medium text-cyan-300">Mutui e finanziamenti</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-50">
          Rate attive
        </h1>
      </header>

      <PrivacyDetails className="rounded-xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/20">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-50">Nuovo finanziamento</h2>
            <p className="text-sm text-slate-400">Apri il pannello per aggiungere una rata.</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
            <Plus className="h-4 w-4" aria-hidden />
          </div>
        </summary>
        <div className="border-t border-white/10 p-4">
          <form action={createLoanAction} className="space-y-4">
            <FormGrid>
              <Field label="Nome">
                <Input name="name" required placeholder="Es. Mutuo casa" />
              </Field>
              <Field label="Rata mensile">
                <MoneyInput name="paymentAmount" />
              </Field>
              <Field label="Owner">
                <OwnerSelect settings={data.settings} />
              </Field>
              <Field label="Giorno pagamento">
                <Input name="paymentDayOfMonth" type="number" min="1" max="31" defaultValue="1" />
              </Field>
              <Field label="Prima rata">
                <Input name="firstPaymentDate" type="date" required />
              </Field>
              <Field label="Rate totali">
                <Input name="totalInstallments" type="number" min="1" max="600" required />
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
              Aggiungi finanziamento
            </Button>
          </form>
        </div>
      </PrivacyDetails>

      <Card>
        <CardHeader>
          <CardTitle>
            <SectionTitle icon={Landmark}>Finanziamenti configurati</SectionTitle>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.loans.length === 0 ? (
            <p className="text-sm text-slate-400">Nessun finanziamento inserito.</p>
          ) : (
            data.loans.map((loan) => {
              const paid = paidInstallments(loan);
              const progress = Math.round((paid / loan.totalInstallments) * 100);
              const updateFormId = `loan-update-${loan.id}`;

              return (
                <EntityCard key={loan.id} active={loan.active}>
                  <EntitySummaryRow>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-50">{loan.name}</p>
                        <OwnerChip owner={loan.owner} settings={data.settings} variant="colored" />
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {paid}/{loan.totalInstallments} rate · fine stimata{" "}
                        {formatDate(estimatedLoanEndDate(loan))}
                      </p>
                      <div className="mt-3 flex max-w-xl items-center gap-3">
                        <Progress value={progress} className="flex-1" />
                        <span className="min-w-12 text-right text-sm font-semibold text-cyan-200">
                          <PrivateValue>{progress}%</PrivateValue>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-slate-50 sm:text-lg">
                        <PrivateValue>
                          {formatCurrency(loan.paymentCents, currency)}
                        </PrivateValue>
                        <span className="ml-1 text-xs font-medium text-slate-400">/ mese</span>
                      </p>
                      {!loan.active ? (
                        <p className="mt-1 text-xs font-medium text-slate-500">Disattivo</p>
                      ) : null}
                    </div>
                  </EntitySummaryRow>
                  <div className="border-t border-white/10 p-4">
                    <form id={updateFormId} action={updateLoanAction} className="space-y-4">
                      <input type="hidden" name="id" value={loan.id} />
                      <FormGrid>
                        <Field label="Nome">
                          <Input name="name" defaultValue={loan.name} required />
                        </Field>
                        <Field label="Rata mensile">
                          <MoneyInput
                            name="paymentAmount"
                            defaultValue={centsToInputValue(loan.paymentCents)}
                          />
                        </Field>
                        <Field label="Owner">
                          <OwnerSelect settings={data.settings} defaultValue={loan.owner} />
                        </Field>
                        <Field label="Giorno pagamento">
                          <Input
                            name="paymentDayOfMonth"
                            type="number"
                            min="1"
                            max="31"
                            defaultValue={loan.paymentDayOfMonth}
                          />
                        </Field>
                        <Field label="Prima rata">
                          <Input
                            name="firstPaymentDate"
                            type="date"
                            defaultValue={loan.firstPaymentDate}
                            required
                          />
                        </Field>
                        <Field label="Rate totali">
                          <Input
                            name="totalInstallments"
                            type="number"
                            min="1"
                            max="600"
                            defaultValue={loan.totalInstallments}
                            required
                          />
                        </Field>
                        <Field label="Stato">
                          <ActiveField defaultChecked={loan.active} />
                        </Field>
                        <Field label="Descrizione" className="sm:col-span-2 xl:col-span-4">
                          <Textarea name="description" defaultValue={loan.description} />
                        </Field>
                      </FormGrid>
                    </form>
                    <ActionBar>
                      <Button type="submit" form={updateFormId} variant="secondary">
                        <Save className="h-4 w-4" />
                        Salva modifiche
                      </Button>
                      <form action={deleteLoanAction}>
                        <input type="hidden" name="id" value={loan.id} />
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
