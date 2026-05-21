import { cn } from "@/lib/utils";

type ProgressProps = {
  value: number;
  className?: string;
};

export function Progress({ value, className }: ProgressProps) {
  const safeValue = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-800", className)}
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-cyan-300 transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
