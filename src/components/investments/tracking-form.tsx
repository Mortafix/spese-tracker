"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createInvestmentTrackingAction } from "@/app/actions/mutations";
import { Field, FormGrid, MoneyInput } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { centsToInputValue } from "@/lib/money";

const movementPresets = [50, 100, 250, 500, 1000, -50, -100, -250, -500, -1000];

function signedPresetLabel(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

export function InvestmentTrackingForm({
  investmentId,
  defaultCurrentValueCents,
  defaultTrackedAt,
}: {
  investmentId: string;
  defaultCurrentValueCents: number;
  defaultTrackedAt: string;
}) {
  const [movement, setMovement] = useState("0.00");

  return (
    <form action={createInvestmentTrackingAction} className="space-y-4">
      <input type="hidden" name="investmentId" value={investmentId} />
      <div className="flex flex-wrap gap-2">
        {movementPresets.map((preset) => (
          <Button
            key={preset}
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setMovement(preset.toFixed(2))}
            className={preset < 0 ? "text-rose-200" : undefined}
          >
            {signedPresetLabel(preset)}
          </Button>
        ))}
      </div>
      <FormGrid>
        <Field label="Data tracking">
          <Input name="trackedAt" type="date" defaultValue={defaultTrackedAt} required />
        </Field>
        <Field label="Movimento">
          <Input
            name="movement"
            type="number"
            step="0.01"
            inputMode="decimal"
            value={movement}
            onChange={(event) => setMovement(event.target.value)}
            required
          />
        </Field>
        <Field label="Valore attuale">
          <MoneyInput
            name="currentValue"
            defaultValue={centsToInputValue(defaultCurrentValueCents)}
          />
        </Field>
        <Field label="Note" className="sm:col-span-2 xl:col-span-1">
          <Textarea name="note" placeholder="Nota facoltativa" />
        </Field>
      </FormGrid>
      <Button type="submit">
        <Plus className="h-4 w-4" />
        Aggiungi tracking
      </Button>
    </form>
  );
}
