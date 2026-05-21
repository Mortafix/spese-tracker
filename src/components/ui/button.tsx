import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "border-cyan-300/40 bg-cyan-300 text-slate-950 hover:bg-cyan-200",
        variant === "secondary" &&
          "border-white/10 bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]",
        variant === "ghost" &&
          "border-transparent bg-transparent text-slate-300 hover:bg-white/[0.08] hover:text-slate-50",
        variant === "danger" &&
          "border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20",
        size === "md" && "h-10 px-4",
        size === "sm" && "h-8 px-3",
        size === "icon" && "h-9 w-9 p-0",
        className,
      )}
      {...props}
    />
  );
}
