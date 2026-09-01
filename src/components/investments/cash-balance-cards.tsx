"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { upsertCashBalanceAction } from "@/app/actions/mutations";
import { OwnerChip } from "@/components/entity-ui";
import { Field, MoneyInput } from "@/components/forms";
import { PrivateValue, usePrivacyMode } from "@/components/privacy-mode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/dates";
import { centsToInputValue, formatCurrency } from "@/lib/money";
import type { AppSettings, CashBalance, Owner } from "@/types/domain";

function ownerCashLabel(owner: Owner, settings: AppSettings) {
  if (owner === "mine") return settings.profileNames.mine;
  if (owner === "partner") return settings.profileNames.partner;
  return "Entrambi";
}

export function CashBalanceCards({
  balances,
  currency,
  settings,
  today,
}: {
  balances: CashBalance[];
  currency: string;
  settings: AppSettings;
  today: string;
}) {
  const [openOwner, setOpenOwner] = useState<Owner | null>(null);
  const { enabled: privacyEnabled } = usePrivacyMode();
  const [previousPrivacyEnabled, setPreviousPrivacyEnabled] = useState(privacyEnabled);

  if (privacyEnabled !== previousPrivacyEnabled) {
    setPreviousPrivacyEnabled(privacyEnabled);
    if (privacyEnabled && openOwner !== null) {
      setOpenOwner(null);
    }
  }

  return (
    <div className="grid items-start gap-3 lg:grid-cols-3">
      {balances.map((cashBalance) => {
        const isOpen = openOwner === cashBalance.owner;

        return (
          <section
            key={cashBalance.owner}
            className="self-start rounded-lg border border-white/10 bg-white/[0.03]"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-disabled={privacyEnabled}
              disabled={privacyEnabled}
              onClick={() => {
                setOpenOwner((current) => (
                  current === cashBalance.owner ? null : cashBalance.owner
                ));
              }}
              className="flex w-full cursor-pointer flex-col gap-3 p-4 text-left disabled:cursor-not-allowed disabled:opacity-70"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-slate-400">
                    {ownerCashLabel(cashBalance.owner, settings)}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-50">
                    <PrivateValue>
                      {formatCurrency(cashBalance.balanceCents, currency)}
                    </PrivateValue>
                  </p>
                </div>
                <OwnerChip owner={cashBalance.owner} settings={settings} variant="colored" />
              </div>
              <p className="text-xs text-slate-500">
                Aggiornato al {formatDate(cashBalance.asOfDate)}
              </p>
            </button>
            {isOpen ? (
              <div className="border-t border-white/10 p-4">
                <form action={upsertCashBalanceAction} className="space-y-4">
                  <input type="hidden" name="owner" value={cashBalance.owner} />
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
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
