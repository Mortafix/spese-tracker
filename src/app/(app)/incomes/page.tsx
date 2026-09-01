import { Plus, Save, Trash2, WalletCards } from "lucide-react";
import {
  createIncomeAction,
  deleteIncomeAction,
  updateIncomeAction,
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
import { Textarea } from "@/components/ui/textarea";
import { centsToInputValue, formatCurrency } from "@/lib/money";
import { getAppData } from "@/lib/repository";

export default async function IncomesPage() {
  const data = await getAppData();
  const currency = data.settings.currency;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header>
        <p className="text-sm font-medium text-cyan-300">Entrate</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-50">
          Budget mensile
        </h1>
      </header>

      <PrivacyDetails className="rounded-xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/20">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-50">Nuova entrata</h2>
            <p className="text-sm text-slate-400">Apri il pannello per aggiungere un income.</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
            <Plus className="h-4 w-4" aria-hidden />
          </div>
        </summary>
        <div className="border-t border-white/10 p-4">
          <form action={createIncomeAction} className="space-y-4">
            <FormGrid>
              <Field label="Nome">
                <Input name="name" required placeholder="Es. Stipendio" />
              </Field>
              <Field label="Importo mensile">
                <MoneyInput name="monthlyAmount" />
              </Field>
              <Field label="Owner">
                <OwnerSelect settings={data.settings} defaultValue="mine" />
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
              Aggiungi entrata
            </Button>
          </form>
        </div>
      </PrivacyDetails>

      <Card>
        <CardHeader>
          <CardTitle>
            <SectionTitle icon={WalletCards}>Entrate configurate</SectionTitle>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.incomes.length === 0 ? (
            <p className="text-sm text-slate-400">Nessuna entrata inserita.</p>
          ) : (
            data.incomes.map((income) => {
              const updateFormId = `income-update-${income.id}`;

              return (
                <EntityCard key={income.id} active={income.active}>
                  <EntitySummaryRow>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-50">{income.name}</p>
                        <OwnerChip owner={income.owner} settings={data.settings} variant="colored" />
                      </div>
                      <p className="mt-1 text-sm text-slate-400">Entrata mensile</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-slate-50 sm:text-lg">
                        <PrivateValue>
                          {formatCurrency(income.monthlyAmountCents, currency)}
                        </PrivateValue>
                        <span className="ml-1 text-xs font-medium text-slate-400">/ mese</span>
                      </p>
                      {!income.active ? (
                        <p className="mt-1 text-xs font-medium text-slate-500">Disattiva</p>
                      ) : null}
                    </div>
                  </EntitySummaryRow>
                  <div className="border-t border-white/10 p-4">
                    <form id={updateFormId} action={updateIncomeAction} className="space-y-4">
                      <input type="hidden" name="id" value={income.id} />
                      <FormGrid>
                        <Field label="Nome">
                          <Input name="name" defaultValue={income.name} required />
                        </Field>
                        <Field label="Importo mensile">
                          <MoneyInput
                            name="monthlyAmount"
                            defaultValue={centsToInputValue(income.monthlyAmountCents)}
                          />
                        </Field>
                        <Field label="Owner">
                          <OwnerSelect settings={data.settings} defaultValue={income.owner} />
                        </Field>
                        <Field label="Stato">
                          <ActiveField defaultChecked={income.active} />
                        </Field>
                        <Field label="Descrizione" className="sm:col-span-2 xl:col-span-4">
                          <Textarea name="description" defaultValue={income.description} />
                        </Field>
                      </FormGrid>
                    </form>
                    <ActionBar>
                      <Button type="submit" form={updateFormId} variant="secondary">
                        <Save className="h-4 w-4" />
                        Salva modifiche
                      </Button>
                      <form action={deleteIncomeAction}>
                        <input type="hidden" name="id" value={income.id} />
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
