"use client"

import { useState } from "react"
import { sanitizeDescription } from "../../lib/sanitize"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ChevronUp, ChevronDown, Minus, Plus, MapPin, CalendarDays, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PerformerGrid } from "@/components/performer-grid"
import { FavoriteButton } from "@/components/favorite-button"
import { CommentModal } from "@/components/event/comment-modal"
import type { EventDetail } from "@/components/event/event-detail-body"

function formatEventDate(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    dayOfWeek: d.toLocaleDateString("id-ID", { weekday: "long" }),
  }
}

export function EventPanel({
  eventId,
  onBuy,
}: {
  eventId: string
  onBuy?: (href: string) => void
}) {
  const router = useRouter()
  const [ticketsOpen, setTicketsOpen] = useState(true)
  const [quantities, setQuantities] = useState<number[]>([])
  const [benefitsOpen, setBenefitsOpen] = useState<boolean[]>([])
  const [commentOpen, setCommentOpen] = useState(false)

  const { data: event, isLoading } = useQuery<EventDetail>({
    queryKey: ["event", eventId],
    queryFn: () => fetch(`/api/events/${eventId}`).then((r) => r.json()),
  })

  if (isLoading) {
    return (
      <div className="space-y-4 px-5 pt-14 pb-8">
        <div className="aspect-square w-full animate-pulse rounded-2xl bg-muted" />
        <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-40 w-full animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  if (!event || !event.id) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-lg font-semibold text-[#303030]">Acara tidak ditemukan</p>
        <p className="text-sm text-[#9E9E9E]">Acara ini mungkin telah dihapus atau tidak tersedia.</p>
      </div>
    )
  }

  const { date, dayOfWeek } = formatEventDate(event.startsAt)
  const eventEnded = new Date(event.endsAt ?? event.startsAt) <= new Date()

  const wallAvatars = [
    ...event.commenterAvatars,
    "https://picsum.photos/seed/a1/64/64",
    "https://picsum.photos/seed/a2/64/64",
    "https://picsum.photos/seed/a3/64/64",
  ].slice(0, 3)

  function adjust(index: number, delta: number) {
    if (eventEnded) return
    setQuantities((prev) => {
      const base = prev.length === event!.tickets.length ? prev : event!.tickets.map(() => 0)
      return base.map((q, i) => (i === index ? Math.max(0, q + delta) : q))
    })
  }

  const effectiveQuantities =
    quantities.length === event.tickets.length ? quantities : event.tickets.map(() => 0)
  const totalTickets = effectiveQuantities.reduce((a, b) => a + b, 0)
  const totalPrice = event.tickets.reduce((sum, t, i) => sum + t.price * effectiveQuantities[i], 0)

  function handleBuy() {
    if (!event || eventEnded) return
    const ticketsParam = event.tickets
      .map((t, i) => (effectiveQuantities[i] > 0 ? `${t.id}:${effectiveQuantities[i]}` : null))
      .filter(Boolean)
      .join(",")
    const href = `/events/${event.id}/checkout?tickets=${ticketsParam}`
    if (onBuy) onBuy(href)
    else router.push(href)
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[#EEEEEE] bg-white/90 px-4 py-2.5 backdrop-blur">
        <a
          href={`/events/${event.id}`}
          className="inline-flex items-center gap-1 rounded-full border border-[#E5E5E5] px-3 py-1 text-[13px] font-medium text-[#424242] hover:bg-[#F5F5F5]"
        >
          Halaman Acara
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
        <div className="ml-auto pr-8" />
      </div>

      <div className="space-y-5 px-5 pt-5 pb-10">
        <div className="overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.bannerUrl ?? ""}
            alt={event.name}
            className="aspect-square w-full"
          />
        </div>

        <h1 className="font-ibm text-[28px] font-bold leading-tight text-[#1A1A1A]">
          {event.name}
        </h1>

        <div className="flex items-center justify-between">
          <div className="rounded-full bg-[#F0F0F0] px-3 py-1 text-[13px] font-semibold text-[#525252]">
            By : {event.organizationName}
          </div>
          <FavoriteButton eventId={event.id} size={22} className="text-[#9E3C77] hover:opacity-80" />
        </div>

        <div className="space-y-3 rounded-2xl border border-[#EEEEEE] p-4">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#525252]" />
            <div>
              <p className="font-ibm text-[16px] font-semibold text-[#1A1A1A]">{date}</p>
              <p className="text-[14px] text-[#737373]">{dayOfWeek}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#525252]" />
            <div>
              <p className="font-ibm text-[16px] font-semibold text-[#1A1A1A]">{event.venueName}</p>
              {(event.city || event.address) && (
                <p className="text-[14px] text-[#737373]">
                  {[event.city, event.address].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCommentOpen(true)}
          className="flex w-full items-center gap-2 rounded-2xl border border-[#EEEEEE] p-3 text-left hover:bg-[#FAFAFA]"
        >
          <div className="flex -space-x-2">
            {wallAvatars.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" className="h-8 w-8 rounded-full object-cover" />
            ))}
          </div>
          <p className="text-[14px] font-medium text-[#424242]">
            {event.commentCount} orang di Wall, bergabunglah!
          </p>
          <ArrowUpRight className="ml-auto h-4 w-4 text-[#9E9E9E]" />
        </button>

        <div className="rounded-2xl border border-[#EEEEEE] p-4">
          <button
            onClick={() => setTicketsOpen((o) => !o)}
            className="flex w-full items-center justify-between font-ibm text-[18px] font-bold text-[#1A1A1A]"
          >
            Pilih Tiket
            {ticketsOpen ? (
              <ChevronUp className="h-4 w-4 text-[#9E9E9E]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#9E9E9E]" />
            )}
          </button>

          {eventEnded && (
            <p className="mt-2 text-[13px] font-semibold text-[#DB0000]">
              Acara telah berakhir. Tiket tidak lagi tersedia.
            </p>
          )}

          {ticketsOpen && (
            <div className="mt-3 space-y-3">
              {event.tickets.map((tier, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="text-[15px] font-semibold text-[#303030]">{tier.name}</p>
                        {!eventEnded && typeof tier.remaining === "number" && tier.remaining > 0 && tier.remaining < 10 && (
                          <span className="text-[12px] font-semibold text-[#DB0000]">
                            {tier.remaining} tersisa!
                          </span>
                        )}
                      </div>
                      <p className="text-[15px] font-bold text-[#0C2D57]">
                        {"Rp" + tier.price.toLocaleString("id-ID")}
                      </p>
                      {tier.benefits && tier.benefits.length > 0 && (
                        <button
                          onClick={() =>
                            setBenefitsOpen((prev) => {
                              const next = [...prev]
                              next[i] = !next[i]
                              return next
                            })
                          }
                          className="text-[12px] font-medium text-[#7e341b] hover:underline"
                        >
                          {benefitsOpen[i] ? "Lebih Sedikit" : "Lebih Banyak"}
                        </button>
                      )}
                      {tier.benefits && tier.benefits.length > 0 && benefitsOpen[i] && (
                        <ul className="mt-1 space-y-0.5">
                          {tier.benefits.map((b) => (
                            <li key={b} className="flex items-center gap-1.5 text-[12px] text-[#737373]">
                              <span className="h-1 w-1 shrink-0 rounded-full bg-[#9E9E9E]" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => adjust(i, -1)}
                        disabled={eventEnded}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E5E5E5] hover:bg-[#F5F5F5] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-sm font-medium">{effectiveQuantities[i]}</span>
                      <button
                        onClick={() => adjust(i, 1)}
                        disabled={eventEnded}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E5E5E5] hover:bg-[#F5F5F5] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  {i < event.tickets.length - 1 && <div className="h-px bg-[#EEEEEE]" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {event.description && (
          <section>
            <p className="mb-2 font-ibm text-[18px] font-bold text-[#1A1A1A]">Tentang Acara</p>
            <div
              className="prose-event text-[#424242]"
              dangerouslySetInnerHTML={{
                __html: sanitizeDescription(event.description),
              }}
            />
          </section>
        )}

        {event.performers.length > 0 && (
          <section>
            <p className="mb-2 font-ibm text-[18px] font-bold text-[#1A1A1A]">Pengisi Acara</p>
            <PerformerGrid
              performers={event.performers.map((p) => ({ name: p.name, image: p.imageUrl ?? "" }))}
            />
          </section>
        )}
      </div>

      <div className="sticky bottom-0 mt-auto border-t border-[#EEEEEE] bg-white px-5 py-3">
        {totalTickets > 0 && (
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[14px] text-[#525252]">{totalTickets} tiket</span>
            <span className="text-[16px] font-bold text-[#0C2D57]">
              Rp{totalPrice.toLocaleString("id-ID")}
            </span>
          </div>
        )}
        <Button
          disabled={totalTickets === 0 || eventEnded}
          onClick={handleBuy}
          className="h-11 w-full rounded-full bg-[#9E3C77] text-[16px] font-bold text-white hover:bg-[#0C2D57] disabled:opacity-40"
        >
          {eventEnded
            ? "Acara Telah Berakhir"
            : totalTickets === 0
              ? "Pilih Tiket"
              : `Beli ${totalTickets} Tiket`}
        </Button>
      </div>

      <CommentModal
        eventId={event.id}
        open={commentOpen}
        onOpenChange={setCommentOpen}
        canComment={event.canComment}
      />
    </div>
  )
}
