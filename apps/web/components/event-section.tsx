"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EventCard, type EventItem } from "@/components/event-card"
import { categories } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function EventSection({
  events,
  showExplore = true,
  query,
  activeCategory = "terkini",
}: {
  events: EventItem[]
  showExplore?: boolean
  query?: string
  activeCategory?: string
}) {
  const pathname = usePathname()

  function categoryHref(id: string) {
    const params = new URLSearchParams()
    if (id !== "terkini") params.set("category", id)
    if (query) params.set("q", query)
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-2 flex-1">
          {categories.map((cat) => {
            const href = categoryHref(cat.id)
            return (
              <Link
                key={cat.id}
                href={href}
                scroll={false}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                  activeCategory === cat.id
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {cat.label}
              </Link>
            )
          })}
        </div>
        <Select>
          <SelectTrigger aria-label="Urutkan acara" className="ml-auto w-28 h-8 text-xs shrink-0">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="terbaru">Terbaru</SelectItem>
            <SelectItem value="terdekat">Terdekat</SelectItem>
            <SelectItem value="populer">Terpopuler</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <h2 className="mt-6 mb-4 text-lg font-bold">
        {query ? `Hasil untuk "${query}" — ${events.length} acara` : "Event Untukmu"}
      </h2>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          {query
            ? `Tidak ada acara yang cocok dengan "${query}".`
            : "Belum ada event tersedia."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {showExplore && (
        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline" className="px-10 rounded-full text-sm">
            <Link href="/events">Jelajahi Acara</Link>
          </Button>
        </div>
      )}
    </section>
  )
}
