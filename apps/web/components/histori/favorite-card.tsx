"use client"

import Link from "next/link"
import { Heart, MapPin, CalendarDays } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { formatDateID, formatDayID } from "@/lib/format"

export type FavoriteEvent = {
  eventId: string
  name: string
  bannerUrl: string | null
  venueName: string | null
  city: string | null
  startsAt: string
}

export function FavoriteCard({ fav }: { fav: FavoriteEvent }) {
  const qc = useQueryClient()
  const unlike = useMutation({
    mutationFn: () => fetch(`/api/favorites/${fav.eventId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] })
      qc.invalidateQueries({ queryKey: ["favorite-ids"] })
    },
  })

  function handleClick(e: React.MouseEvent) {
    if (!window.matchMedia("(min-width: 768px)").matches) {
      e.preventDefault()
      window.location.assign(`/events/${fav.eventId}`)
    }
  }

  return (
    <div className="rounded-xl bg-white border border-border overflow-hidden">
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4">
        <div className="flex items-center gap-4 min-w-0 md:contents">
          <button
            onClick={() => unlike.mutate()}
            aria-label="Hapus dari favorit"
            className="shrink-0 pr-2 md:px-4 md:border-r md:border-border"
          >
            <Heart className="h-6 w-6 fill-[#e92a67] text-[#e92a67]" />
          </button>
          {fav.bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fav.bannerUrl} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-neutral-900 truncate">{fav.name}</h3>
            <div className="mt-1 flex flex-col gap-2 md:flex-row md:gap-8">
              <div className="flex items-start gap-1.5">
                <MapPin className="h-4 w-4 mt-0.5 text-neutral-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-neutral-900 truncate">{fav.venueName}</p>
                  <p className="text-sm text-neutral-500">{fav.city}</p>
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <CalendarDays className="h-4 w-4 mt-0.5 text-neutral-500 shrink-0" />
                <div>
                  <p className="text-neutral-900">{formatDateID(fav.startsAt)}</p>
                  <p className="text-sm text-neutral-500">{formatDayID(fav.startsAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Link
          href={`/events/${fav.eventId}`}
          onClick={handleClick}
          className="block w-full md:w-auto text-center rounded-full bg-[#0C2D57] hover:bg-slate-900 text-white font-bold px-6 py-2.5"
        >
          Lihat Acara
        </Link>
      </div>
      <div className="flex items-center justify-end bg-[#A3A3A3] px-4 py-1.5">
        <span className="text-sm font-semibold text-[#0C2D57]">Disukai</span>
      </div>
    </div>
  )
}
