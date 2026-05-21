"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { CategoryChip } from "@/components/entity-ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/domain";

const ALL_CATEGORIES = "__all";

export function ExpenseListControls({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get("category");
  const currentCategory = rawCategory && categories.some((category) => category.id === rawCategory)
    ? rawCategory
    : ALL_CATEGORIES;
  const showDetails = searchParams.get("details") === "1";

  function updateParam(key: string, value?: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={currentCategory === ALL_CATEGORIES}
          onClick={() => updateParam("category")}
          className={cn(
            "cursor-pointer rounded-md transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50",
            currentCategory === ALL_CATEGORIES ? "opacity-100" : "opacity-45 hover:opacity-80",
          )}
        >
          <Badge
            className="pointer-events-none border-white/10 bg-white/[0.04] text-slate-200"
          >
            Tutte
          </Badge>
        </button>
        {categories.map((category) => {
          const active = currentCategory === category.id;

          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={active}
              onClick={() => updateParam("category", category.id)}
              className={cn(
                "cursor-pointer rounded-md transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50",
                active ? "opacity-100" : "opacity-45 hover:opacity-80",
              )}
            >
              <CategoryChip
                name={category.name}
                color={category.color}
                icon={category.icon}
                className="pointer-events-none"
              />
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant={showDetails ? "primary" : "secondary"}
          onClick={() => updateParam("details", showDetails ? undefined : "1")}
          className={cn("justify-start sm:justify-center", showDetails && "text-slate-950")}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Info aggiuntive
        </Button>
        <p className="text-xs text-slate-500">Categoria e dettagli seguono la vista selezionata.</p>
      </div>
    </div>
  );
}
