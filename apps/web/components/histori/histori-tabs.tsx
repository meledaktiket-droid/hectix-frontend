"use client"

import Link from "next/link"

const TABS = [
  { key: "aktif", label: "Aktif" },
  { key: "selesai", label: "Selesai" },
  { key: "favorit", label: "Favorit" },
] as const

export function HistoriTabs({ active }: { active: string }) {
  return (
    <div className="flex w-full md:inline-flex md:w-auto rounded-2xl bg-[#E5E7EB] p-1">
      {TABS.map((t) => {
        const isActive = t.key === active
        return (
          <Link
            key={t.key}
            href={`/histori?tab=${t.key}`}
            className={
              "flex-1 text-center px-0 md:flex-none md:px-12 py-2.5 rounded-xl text-sm font-semibold transition-colors " +
              (isActive ? "bg-white text-[#0C2D57] shadow-sm" : "text-[#6B7280] hover:text-[#0C2D57]")
            }
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
