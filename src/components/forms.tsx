import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { recurrenceLabel, recurrenceOptions } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import type { AppSettings, Owner, Recurrence } from "@/types/domain";

export function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function OwnerSelect({
  settings,
  defaultValue = "shared",
}: {
  settings: AppSettings;
  defaultValue?: Owner;
}) {
  return (
    <Select name="owner" defaultValue={defaultValue}>
      <option value="mine">{settings.profileNames.mine}</option>
      <option value="partner">{settings.profileNames.partner}</option>
      <option value="shared">Entrambi</option>
    </Select>
  );
}

export function RecurrenceSelect({ defaultValue = "monthly" }: { defaultValue?: Recurrence }) {
  return (
    <Select name="recurrence" defaultValue={defaultValue}>
      {recurrenceOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}

export function WeekdaySelect({ defaultValue = 1 }: { defaultValue?: number }) {
  return (
    <Select name="weekday" defaultValue={String(defaultValue)}>
      <option value="1">Lunedi</option>
      <option value="2">Martedi</option>
      <option value="3">Mercoledi</option>
      <option value="4">Giovedi</option>
      <option value="5">Venerdi</option>
      <option value="6">Sabato</option>
      <option value="7">Domenica</option>
    </Select>
  );
}

export function ActiveField({ defaultChecked = true }: { defaultChecked?: boolean }) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-300">
      <input
        type="checkbox"
        name="active"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-white/10 accent-cyan-300"
      />
      Attiva
    </label>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      className={cn(
        active
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-slate-500/40 bg-slate-500/10 text-slate-300",
      )}
    >
      {active ? "Attiva" : "Disattiva"}
    </Badge>
  );
}

export function CategoryBadge({
  name,
  color,
}: {
  name: string;
  color?: string;
}) {
  return (
    <Badge
      className="border-white/10 bg-white/[0.04] text-slate-200"
      style={color ? { borderColor: `${color}66`, color } : undefined}
    >
      {name}
    </Badge>
  );
}

export function RecurrenceBadge({ recurrence }: { recurrence: Recurrence }) {
  return (
    <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
      {recurrenceLabel(recurrence)}
    </Badge>
  );
}

export function MoneyInput({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  return (
    <Input
      name={name}
      type="number"
      min="0"
      step="0.01"
      inputMode="decimal"
      defaultValue={defaultValue}
      required
    />
  );
}

export function SignedMoneyInput({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  return (
    <Input
      name={name}
      type="number"
      step="0.01"
      inputMode="decimal"
      defaultValue={defaultValue}
      required
    />
  );
}

export function OwnerBadge({ owner, settings }: { owner: Owner; settings: AppSettings }) {
  const label =
    owner === "mine"
      ? settings.profileNames.mine
      : owner === "partner"
        ? settings.profileNames.partner
        : "Entrambi";

  return (
    <Badge
      className={cn(
        owner === "mine" && "border-sky-400/30 bg-sky-400/10 text-sky-200",
        owner === "partner" && "border-pink-400/30 bg-pink-400/10 text-pink-200",
        owner === "shared" && "border-teal-400/30 bg-teal-400/10 text-teal-200",
      )}
    >
      {label}
    </Badge>
  );
}
