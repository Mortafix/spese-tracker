import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-50 outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10",
        className,
      )}
      {...props}
    />
  );
}
