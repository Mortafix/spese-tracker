"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPerson, faPersonDress, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";
import type { AppSettings, ViewMode } from "@/types/domain";

const views: Array<{ value: ViewMode; icon: IconDefinition }> = [
  { value: "mine", icon: faPerson },
  { value: "partner", icon: faPersonDress },
  { value: "common", icon: faUserGroup },
];

function labelFor(view: ViewMode, settings: AppSettings) {
  if (view === "mine") return settings.profileNames.mine;
  if (view === "partner") return settings.profileNames.partner;
  return "Comune";
}

export function ProfileSwitcher({ settings }: { settings: AppSettings }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("view") || "common") as ViewMode;

  function setView(view: ViewMode) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-3 rounded-lg border border-white/10 bg-slate-950/70 p-1 lg:grid-cols-1">
      {views.map((view) => {
        const active = current === view.value;

        return (
          <button
            key={view.value}
            type="button"
            title={`Vista ${labelFor(view.value, settings)}`}
            onClick={() => setView(view.value)}
            className={cn(
              "flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-slate-400 transition hover:text-slate-100 lg:justify-start lg:px-3",
              active && "bg-cyan-300 text-slate-950 shadow-sm hover:text-slate-950",
            )}
          >
            <FontAwesomeIcon icon={view.icon} className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{labelFor(view.value, settings)}</span>
          </button>
        );
      })}
    </div>
  );
}
