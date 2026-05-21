import { Plus, Save, Settings2, Tags, Trash2 } from "lucide-react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  updateSettingsAction,
} from "@/app/actions/mutations";
import { CategoryIconInput } from "@/components/category-icon-picker";
import { ActionBar, CategoryChip, SectionTitle } from "@/components/entity-ui";
import { Field, FormGrid } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAppData } from "@/lib/repository";

export default async function SettingsPage() {
  const data = await getAppData();
  const settings = data.settings;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header>
        <p className="text-sm font-medium text-cyan-300">Impostazioni</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-50">
          Profili, quote e categorie
        </h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>
            <SectionTitle icon={Settings2}>Profili e quota comune</SectionTitle>
          </CardTitle>
          <CardDescription>
            La quota comune ripartisce entrate e spese condivise nelle viste personali.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateSettingsAction} className="space-y-4">
            <FormGrid>
              <Field label="Nome profilo 1">
                <Input name="mineName" defaultValue={settings.profileNames.mine} required />
              </Field>
              <Field label="Nome profilo 2">
                <Input name="partnerName" defaultValue={settings.profileNames.partner} required />
              </Field>
              <Field label={`Quota ${settings.profileNames.mine}`}>
                <Input
                  name="mineRatio"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={settings.sharedRatio.mine}
                  required
                />
              </Field>
              <Field label="Valuta">
                <Input name="currency" maxLength={3} defaultValue={settings.currency} required />
              </Field>
            </FormGrid>
            <p className="text-sm text-slate-400">
              Quota {settings.profileNames.partner}: {settings.sharedRatio.partner}%.
            </p>
            <Button type="submit" variant="secondary">
              Salva impostazioni
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <SectionTitle icon={Tags}>Categorie</SectionTitle>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <details className="rounded-lg border border-white/10 bg-white/[0.03]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-semibold text-slate-50">Nuova categoria</p>
                <p className="text-sm text-slate-400">Nome, colore e icona.</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                <Plus className="h-4 w-4" aria-hidden />
              </div>
            </summary>
            <div className="border-t border-white/10 p-4">
              <form
                action={createCategoryAction}
                className="grid gap-3 lg:grid-cols-[120px_minmax(0,1fr)_minmax(0,1.2fr)_auto] lg:items-end"
              >
                <Field label="Colore">
                  <Input name="color" type="color" defaultValue="#0f766e" required />
                </Field>
                <Field label="Nome">
                  <Input name="name" placeholder="Es. Assicurazioni" required />
                </Field>
                <Field label="Icona">
                  <CategoryIconInput />
                </Field>
                <Button type="submit">
                  <Plus className="h-4 w-4" />
                  Aggiungi
                </Button>
              </form>
            </div>
          </details>

          <div className="space-y-3">
            {data.categories.map((category) => {
              const updateFormId = `category-update-${category.id}`;

              return (
                <details
                  key={category.id}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <CategoryChip
                        name={category.name}
                        color={category.color}
                        icon={category.icon}
                      />
                    </div>
                    <span className="text-xs text-slate-500">Anteprima categoria</span>
                  </summary>
                  <div className="mt-3 border-t border-white/10 pt-3">
                    <div className="grid gap-3 lg:grid-cols-[120px_minmax(0,1fr)_minmax(0,1.2fr)_auto] lg:items-end">
                      <form
                        id={updateFormId}
                        action={updateCategoryAction}
                        className="contents"
                      >
                        <input type="hidden" name="id" value={category.id} />
                        <Field label="Colore">
                          <Input name="color" type="color" defaultValue={category.color} required />
                        </Field>
                        <Field label="Nome">
                          <Input name="name" defaultValue={category.name} required />
                        </Field>
                        <Field label="Icona">
                          <CategoryIconInput defaultValue={category.icon} />
                        </Field>
                      </form>
                      <ActionBar className="mt-0">
                        <Button type="submit" form={updateFormId} variant="secondary">
                          <Save className="h-4 w-4" />
                          Salva
                        </Button>
                        <form action={deleteCategoryAction}>
                          <input type="hidden" name="id" value={category.id} />
                          <Button type="submit" variant="danger" size="sm">
                            <Trash2 className="h-4 w-4" />
                            Elimina
                          </Button>
                        </form>
                      </ActionBar>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
