import { ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { normalizeCategoryIcon } from "@/lib/category-icons";

export function CategoryIconInput({
  defaultValue,
  name = "icon",
  id,
}: {
  defaultValue?: string;
  name?: string;
  id?: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
      <Input
        id={id}
        name={name}
        defaultValue={normalizeCategoryIcon(defaultValue)}
        placeholder="Es. house, fa-house, faHouse"
      />
      <a
        href="https://fontawesome.com/search?s=solid&ic=free-collection"
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-4 text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        Icone
      </a>
    </div>
  );
}
