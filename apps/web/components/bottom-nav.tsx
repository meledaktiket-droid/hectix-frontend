"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, History, User } from "lucide-react"
import { cn } from "@/lib/utils"

const ITEMS: {
  label: string
  href: string
  icon: typeof Home
  isActive: (p: string) => boolean
}[] = [
  { label: "Beranda", href: "/", icon: Home, isActive: (p) => p === "/" },
  { label: "Pencarian", href: "/events", icon: Search, isActive: (p) => p.startsWith("/events") },
  { label: "History", href: "/histori", icon: History, isActive: (p) => p.startsWith("/histori") },
  { label: "Profile", href: "/profile", icon: User, isActive: (p) => p.startsWith("/profile") },
]

export function BottomNav() {
  const pathname = usePathname()

  if (!["/", "/events", "/histori", "/profile"].includes(pathname)) return null

  return (
    <>
      <div aria-hidden className="h-16 md:hidden" />

      <nav
        className="fixed bottom-0 inset-x-0 z-40 border-t border-black/[0.06] bg-white/90 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex">
          {ITEMS.map((item, i) => {
            const active = item.isActive(pathname)
            const Icon = item.icon
            return (
              <Link
                key={i}
                href={item.href}
                prefetch={false}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-[#0C2D57]" : "text-neutral-400 hover:text-[#0C2D57]"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
