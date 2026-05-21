import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPerson, faPersonDress, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { categoryIconFor } from "@/lib/category-icons";
import { ownerLabel, recurrenceLabel } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import type { AppSettings, Owner, Recurrence } from "@/types/domain";

const ownerIcons = {
  mine: faPerson,
  partner: faPersonDress,
  shared: faUserGroup,
} satisfies Record<Owner, typeof faPerson>;

const coloredOwnerClasses: Record<Owner, string> = {
  mine: "border-sky-300/30 bg-sky-300/10 text-sky-100",
  partner: "border-pink-300/30 bg-pink-300/10 text-pink-100",
  shared: "border-[#2dd4bf]/35 bg-[#2dd4bf]/10 text-[#2dd4bf]",
};

export function OwnerChip({
  owner,
  settings,
  variant = "neutral",
}: {
  owner: Owner;
  settings: AppSettings;
  variant?: "neutral" | "colored";
}) {
  const label = ownerLabel(owner, settings);

  return (
    <Badge
      title={label}
      className={cn(
        "gap-1",
        variant === "colored"
          ? coloredOwnerClasses[owner]
          : "border-white/10 bg-white/[0.035] text-slate-300",
      )}
    >
      <FontAwesomeIcon icon={ownerIcons[owner]} className="h-3.5 w-3.5" aria-hidden />
      {label}
    </Badge>
  );
}

export function CategoryChip({
  name,
  color,
  icon,
  className,
}: {
  name: string;
  color?: string;
  icon?: string;
  className?: string;
}) {
  const categoryIcon = categoryIconFor(icon);

  return (
    <Badge
      className={cn("gap-1 border-white/10 bg-white/[0.04] text-slate-100", className)}
      style={
        color
          ? {
              borderColor: `${color}66`,
              backgroundColor: `${color}1f`,
            }
          : undefined
      }
    >
      <FontAwesomeIcon
        icon={categoryIcon.icon}
        className="h-3.5 w-3.5"
        style={color ? { color } : undefined}
        aria-hidden
      />
      <span>{name}</span>
    </Badge>
  );
}

export function RecurrenceChip({ recurrence }: { recurrence: Recurrence }) {
  return (
    <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
      {recurrenceLabel(recurrence)}
    </Badge>
  );
}

export function EntityCard({
  active = true,
  className,
  ...props
}: ComponentPropsWithoutRef<"details"> & {
  active?: boolean;
}) {
  return (
    <details
      data-active={active ? "true" : "false"}
      className={cn(
        "rounded-lg border border-l-4 bg-white/[0.035] transition-colors",
        active
          ? "border-white/10 border-l-emerald-400/60 shadow-sm shadow-black/10"
          : "border-slate-700/60 border-l-slate-600 bg-slate-950/35 opacity-70 saturate-50",
        className,
      )}
      {...props}
    />
  );
}

export function EntitySummaryRow({
  className,
  ...props
}: ComponentPropsWithoutRef<"summary">) {
  return (
    <summary
      className={cn(
        "grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3",
        className,
      )}
      {...props}
    />
  );
}

export function ActionBar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-4 flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

export function SectionTitle({
  children,
  className,
  icon: Icon,
}: {
  children: ReactNode;
  className?: string;
  icon: LucideIcon;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Icon className="h-4 w-4 text-cyan-300" aria-hidden />
      <span>{children}</span>
    </span>
  );
}
