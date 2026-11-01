"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, CalendarDays } from "lucide-react"
import Link from "next/link"
import { FavoriteButton } from "@/components/favorite-button"

export type EventItem = {
  id: string
  name: string
  venueName: string | null
  city: string | null
  startsAt: string
  bannerUrl: string | null
  organizationName: string
  minPrice: number
  commentCount: number
  commenterAvatars: string[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatPrice(price: number) {
  if (price === 0) return "Gratis"
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price)
}

export function EventCard({ event }: { event: EventItem }) {
  function handleClick(e: React.MouseEvent) {
    if (!window.matchMedia("(min-width: 768px)").matches) {
      e.preventDefault()
      window.location.assign(`/events/${event.id}`)
    }
  }

  return (
    <Link href={`/events/${event.id}`} onClick={handleClick}>
      <Card className="overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-0 gap-0">
        <div className="relative h-52 w-full overflow-hidden">
          {event.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.bannerUrl} alt={event.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}

          <div className="absolute top-2 left-2">
            <Badge className="text-[10px] h-5 px-1.5 bg-black/60 text-white border-0 backdrop-blur-sm">
              By : {event.organizationName}
            </Badge>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-6">
            <div className="flex items-center gap-1 text-[10px] text-white/90">
              <CalendarDays className="h-2.5 w-2.5 shrink-0" />
              <span>{formatDate(event.startsAt)}</span>
            </div>
            {(event.venueName || event.city) && (
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-white/90">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="line-clamp-1">
                  {[event.venueName, event.city].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
          </div>

          <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
            <FavoriteButton eventId={event.id} size={14} className="text-white" />
          </div>
        </div>

        <div className="flex min-h-[60px] items-start justify-between gap-2 p-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h3 className="text-sm font-semibold leading-tight line-clamp-2">
              {event.name}
            </h3>
            {event.commentCount > 0 && (
              <div className="flex w-fit items-center gap-1.5 rounded-full bg-neutral-100 py-0.5 pl-0.5 pr-2">
                {event.commenterAvatars.length > 0 && (
                  <div className="flex -space-x-2">
                    {event.commenterAvatars.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={src}
                        alt=""
                        className="h-5 w-5 rounded-full border border-white object-cover"
                      />
                    ))}
                  </div>
                )}
                <span className="text-[10px] font-semibold text-neutral-700">
                  {event.commentCount > event.commenterAvatars.length
                    ? `+${event.commentCount - event.commenterAvatars.length} di Wall`
                    : `${event.commentCount} di Wall`}
                </span>
              </div>
            )}
          </div>
          <div className="shrink-0 text-right">
            <span className="text-[10px] text-muted-foreground">Mulai Dari</span>
            <p className="text-sm font-bold" style={{ color: "#a853ba" }}>
              {formatPrice(event.minPrice)}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
