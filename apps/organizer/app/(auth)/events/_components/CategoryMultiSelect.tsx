"use client";

import { ChevronDown, X } from "lucide-react";
import { EVENT_CATEGORIES } from "../../../../lib/categories";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@repo/ui/dropdown-menu";

export function CategoryMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const selected = EVENT_CATEGORIES.filter((c) => value.includes(c.slug));

  function toggle(slug: string) {
    onChange(value.includes(slug) ? value.filter((s) => s !== slug) : [...value, slug]);
  }

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <span className={selected.length === 0 ? "text-muted-foreground" : ""}>
              {selected.length === 0 ? "Pilih kategori" : `${selected.length} kategori dipilih`}
            </span>
            <ChevronDown className="size-4 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
          {EVENT_CATEGORIES.map((c) => (
            <DropdownMenuCheckboxItem
              key={c.slug}
              checked={value.includes(c.slug)}
              onCheckedChange={() => toggle(c.slug)}
              onSelect={(e) => e.preventDefault()}
            >
              {c.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((c) => (
            <span
              key={c.slug}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
            >
              {c.label}
              <button
                type="button"
                onClick={() => toggle(c.slug)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${c.label}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
