"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EventCard, EventCardSkeleton, type EventItem } from "@/components/event-card"
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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedCat, setSelectedCat] = useState(activeCategory)

  useEffect(() => {
    setSelectedCat(activeCategory)
  }, [activeCategory])

  function categoryHref(id: string) {
    const params = new URLSearchParams()
    if (id !== "terkini") params.set("category", id)
    if (query) params.set("q", query)
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function handleCategoryClick(e: React.MouseEvent, id: string) {
    e.preventDefault()
    const href = categoryHref(id)
    setSelectedCat(id)
    startTransition(() => {
      router.push(href, { scroll: false })
    })
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-2 flex-1">
          {categories.map((cat) => {
            const href = categoryHref(cat.id)
            const isActive = selectedCat === cat.id
            return (
              <Link
                key={cat.id}
                href={href}
                scroll={false}
                onClick={(e) => handleCategoryClick(e, cat.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-foreground text-background shadow-sm"
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

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
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

export function EventSectionSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-2 flex-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-7 w-20 shrink-0 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
      </div>
      <div className="mt-6 mb-4 h-6 w-36 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </section>
  )
}
