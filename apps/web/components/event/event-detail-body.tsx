"use client"

import { useState } from "react"
import { sanitizeDescription } from "../../lib/sanitize"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ChevronUp, ChevronDown, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PerformerGrid } from "@/components/performer-grid"
import { FavoriteButton } from "@/components/favorite-button"
import { cn } from "@/lib/utils"
import { Typography } from "@/components/ui/typography"
import { CommentModal } from "@/components/event/comment-modal"

export type EventDetail = {
  id: string
  name: string
  description: string | null
  bannerUrl: string | null
  venueName: string | null
  address: string | null
  city: string | null
  startsAt: string
  endsAt: string | null
  organizationName: string
  organizationLogo: string | null
  commentCount: number
  commenterAvatars: string[]
  canComment: boolean
  tickets: {
    id: string
    name: string
    price: number
    quantity: number
    remaining: number
    benefits: string[] | null
  }[]
  performers: {
    name: string
    imageUrl: string | null
  }[]
}

function MapPin({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 23 29"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.2878 28.5232C10.2878 28.5232 0 19.8588 0 11.3333C0 8.32755 1.19404 5.44487 3.31946 3.31946C5.44487 1.19404 8.32755 0 11.3333 0C14.3391 0 17.2218 1.19404 19.3472 3.31946C21.4726 5.44487 22.6667 8.32755 22.6667 11.3333C22.6667 19.8588 12.3788 28.5232 12.3788 28.5232C11.8065 29.0502 10.8644 29.0445 10.2878 28.5232ZM11.3333 16.2917C11.9845 16.2917 12.6292 16.1634 13.2308 15.9142C13.8324 15.6651 14.379 15.2998 14.8394 14.8394C15.2998 14.379 15.6651 13.8324 15.9142 13.2308C16.1634 12.6292 16.2917 11.9845 16.2917 11.3333C16.2917 10.6822 16.1634 10.0374 15.9142 9.43586C15.6651 8.83429 15.2998 8.28769 14.8394 7.82726C14.379 7.36684 13.8324 7.00161 13.2308 6.75243C12.6292 6.50325 11.9845 6.375 11.3333 6.375C10.0183 6.375 8.75713 6.89739 7.82726 7.82726C6.89739 8.75713 6.375 10.0183 6.375 11.3333C6.375 12.6484 6.89739 13.9095 7.82726 14.8394C8.75713 15.7693 10.0183 16.2917 11.3333 16.2917Z"
      />
    </svg>
  )
}

function CalendarDays({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M0 8.00065C0 5.80032 -6.95387e-08 4.70132 0.683667 4.01765C1.36733 3.33398 2.46633 3.33398 4.66667 3.33398H18.6667C20.867 3.33398 21.966 3.33398 22.6497 4.01765C23.3333 4.70132 23.3333 5.80032 23.3333 8.00065C23.3333 8.55015 23.3333 8.82548 23.163 8.99698C22.9915 9.16732 22.715 9.16732 22.1667 9.16732H1.16667C0.617167 9.16732 0.341833 9.16732 0.170333 8.99698C-1.04308e-07 8.82548 0 8.54898 0 8.00065ZM0 18.5007C0 20.701 -6.95387e-08 21.8 0.683667 22.4836C1.36733 23.1673 2.46633 23.1673 4.66667 23.1673H18.6667C20.867 23.1673 21.966 23.1673 22.6497 22.4836C23.3333 21.8 23.3333 20.701 23.3333 18.5007V12.6673C23.3333 12.1178 23.3333 11.8425 23.163 11.671C22.9915 11.5007 22.715 11.5007 22.1667 11.5007H1.16667C0.617167 11.5007 0.341833 11.5007 0.170333 11.671C-1.04308e-07 11.8425 0 12.119 0 12.6673V18.5007Z"
        fill="currentColor"
      />
      <path
        d="M5.83325 1V4.5M17.4999 1V4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function formatEventDate(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    dayOfWeek: d.toLocaleDateString("id-ID", { weekday: "long" }),
  }
}

export function EventDetailBody({ eventId }: { eventId: string }) {
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
      <div className="mx-6 md:mx-10 pt-6">
        <div className="md:grid md:grid-cols-7 md:gap-4 mt-2 md:mt-5">
          <div className="col-span-3 md:w-95 md:mx-auto">
            <div className="aspect-square w-full animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="col-span-4 space-y-4 px-4 py-5 md:px-14 md:py-7">
            <div className="h-12 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-40 w-full animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (!event || !event.id) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 px-6 text-center">
        <Typography variant="body-xl-semibold" color="#303030">Acara tidak ditemukan</Typography>
        <Typography variant="body-s-medium" color="#9E9E9E">Acara ini mungkin telah dihapus atau tidak tersedia.</Typography>
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

  const effectiveQuantities = quantities.length === event.tickets.length
    ? quantities
    : event.tickets.map(() => 0)

  const totalTickets = effectiveQuantities.reduce((a, b) => a + b, 0)
  const totalPrice = event.tickets.reduce((sum, t, i) => sum + t.price * effectiveQuantities[i], 0)

  function handleBuy() {
    if (!event || eventEnded) return
    const ticketsParam = event.tickets
      .map((t, i) => effectiveQuantities[i] > 0 ? `${t.id}:${effectiveQuantities[i]}` : null)
      .filter(Boolean)
      .join(",")
    router.push(`/events/${event.id}/checkout?tickets=${ticketsParam}`)
  }

  const tiersWithQty = event.tickets.filter((_, i) => effectiveQuantities[i] > 0)
  const stickyLabel =
    tiersWithQty.length === 1
      ? tiersWithQty[0]!.name
      : tiersWithQty.length > 1
        ? `${totalTickets} item`
        : "Pilih Tiket"

  return (
    <div className={cn("md:pb-0", totalTickets > 0 ? "pb-28" : "pb-0")}>
      <div className="mx-6 md:mx-10 pt-6">
        <div
          className="flex flex-col md:grid md:grid-cols-7 md:gap-4 mt-2 md:mt-5"
        >
          <div className="contents md:block col-span-3">
            <div className="order-1 md:order-none md:w-95 md:mx-auto">
              <div className="rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.bannerUrl ?? ""}
                  alt={event.name}
                  className="w-full aspect-square rounded-xl"
                />
              </div>
            </div>

            <div className="order-2 md:order-none md:w-95 md:mx-auto space-y-3">
              <div className="flex items-center justify-between mt-6">
                <div className=" bg-[#737373] rounded-[16px] px-3.5 py-1">
                  <Typography variant="body-l-semibold" color="#E5E5E5">By : {event.organizationName}</Typography>
                </div>
                <FavoriteButton eventId={event.id} size={24} className="hover:opacity-80" />
              </div>

              <div className="hidden md:block h-px bg-white shadow-[0_1px_4px_0_rgba(0,0,0,0.10)]" />
            </div>

            <div className="hidden md:block md:sticky md:top-2 md:w-95 md:mx-auto space-y-3 pt-[18px]">
              <button
                type="button"
                onClick={() => setCommentOpen(true)}
                className="flex items-center gap-2 hover:opacity-80"
              >
                <div className="flex -space-x-2">
                  {wallAvatars.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ))}
                </div>
                <div className="rounded-[10px] bg-[#E5E5E5] px-3 py-1 -ml-4">
                  <Typography variant="body-s-semibold" color="#424242">+{event.commentCount} di Wall</Typography>
                </div>
              </button>

              <p className="font-preterand font-semibold text-[18px] leading-7 tracking-normal text-[#424242]">
                {event.commentCount} Orang lebih telah memberikan komentar, Bergabunglah!
              </p>
              <Button
                onClick={() => setCommentOpen(true)}
                disabled={!event.canComment}
                className="bg-[#0c2d57] font-preterand hover:bg-rose-600 text-white text-[14px] h-8 rounded-full ml-auto block disabled:opacity-50"
              >
                Tulis Komentar
              </Button>
              {!event.canComment && (
                <Typography variant="body-s-medium" color="#9E9E9E" className="text-right block">
                  Beli tiket dulu untuk ikut berkomentar.
                </Typography>
              )}

              <div className="h-px bg-white shadow-[0_1px_4px_0_rgba(0,0,0,0.10)] my-5" />

              <div className="rounded-xl border border-border bg-white p-3 space-y-2 shadow-sm">
                {totalTickets === 0 ? (
                  <Typography variant="body-xl-medium" color="#303030">Pilih tiket</Typography>
                ) : (
                  <div className="space-y-1">
                    {event.tickets.map((t, i) => effectiveQuantities[i] > 0 && (
                      <div key={i} className="flex items-center justify-between">
                        <Typography variant="body-xl-medium" color="#303030">{effectiveQuantities[i]}× {t.name}</Typography>
                        <Typography variant="body-xl-semibold" color="#0C2D57">Rp{(t.price * effectiveQuantities[i]).toLocaleString("id-ID")}</Typography>
                      </div>
                    ))}
                    <div className="h-px bg-[#D6D6D6] mt-1" />
                    <div className="flex items-center justify-between">
                      <Typography variant="body-xl-semibold" color="#303030">Total</Typography>
                      <Typography variant="body-xl-semibold" color="#0C2D57">Rp{totalPrice.toLocaleString("id-ID")}</Typography>
                    </div>
                  </div>
                )}
                <Button
                  disabled={totalTickets === 0 || eventEnded}
                  onClick={handleBuy}
                  className="w-full bg-[#9e3c77] hover:bg-slate-900 disabled:opacity-40 text-white font-preterand font-bold text-[18px] h-9 rounded-full"
                >
                  {eventEnded
                    ? "Acara Telah Berakhir"
                    : totalTickets === 0
                      ? "Pilih Tiket"
                      : `Beli ${totalTickets} Tiket`}
                </Button>
              </div>
            </div>
          </div>
          <div
            className="contents md:block col-span-4 rounded-[16px] px-4 py-5 md:px-14 md:py-7"
            style={{
            }}
          >
            <div className="contents md:block md:flex-1 md:space-y-4">
              <p className="font-ibm font-bold text-[48px] leading-13 tracking-normal text-[#F5F5F5] mb-5 md:mb-0">{event.name}</p>

              <div className="contents md:block md:pt-7 md:space-y-3.5">
                <div className="order-4 md:order-0 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 mt-0.5 shrink-0 text-[#303030] md:h-7.5 md:w-7.5" />
                    <div>
                      <p className="font-ibm font-semibold text-[22px] leading-7.5 text-[#424242]">{event.venueName}</p>
                      <p className="font-preterand font-medium text-[16px] leading-6.5 text-[#E5E5E5]">{event.venueName}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCommentOpen(true)}
                    className="md:hidden self-center flex items-center gap-2 shrink-0 hover:opacity-80"
                  >
                    <div className="flex -space-x-2">
                      {wallAvatars.map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={src}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ))}
                    </div>
                    <div className="rounded-full bg-[#E5E5E5] px-2.5 py-0.5 -ml-2">
                      <Typography variant="body-s-semibold" color="#424242">+{event.commentCount} di Wall</Typography>
                    </div>
                  </button>
                </div>

                <div className="order-5 md:order-none mt-4 md:mt-3.5 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="h-5 w-5 mt-0.5 shrink-0 text-[#303030] md:h-7 md:w-7" />
                    <div>
                      <p className="font-ibm font-semibold text-[22px] leading-7.5 text-[#424242]">{date}</p>
                      <p className="font-preterand font-medium text-[16px] leading-6.5 text-[#E5E5E5]">{dayOfWeek}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCommentOpen(true)}
                    className="md:hidden self-center shrink-0 bg-[#0c2d57] text-white text-[13px] font-medium h-8 px-4 rounded-full"
                  >
                    Tulis Komentar
                  </button>
                </div>
              </div>

              <div className="order-6 md:0 mt-6 md:mt-4.5 rounded-xl border border-border bg-white px-5 py-4 md:px-7.5 md:py-4.5">
                <button
                  onClick={() => setTicketsOpen((o) => !o)}
                  className="flex w-full items-center justify-between pb-2.5 text-[22px] font-bold font-ibm leading-7.5 text-[#303030]"
                >
                  Pilih Tiket
                  {ticketsOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <div className="h-px bg-[#D6D6D6] shadow-[0_1px_4px_0_rgba(0,0,0,0.10)]" />

                {eventEnded && (
                  <p className="pt-2.5 text-sm font-semibold text-[#db0000]">
                    Acara telah berakhir. Tiket tidak lagi tersedia.
                  </p>
                )}

                {ticketsOpen && (
                  <div className="">
                    {event.tickets.map((tier, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className=" flex items-baseline gap-2 flex-wrap">
                              <p className="font-preterand font-semibold text-[18px] leading-7 text-[#424242]">{tier.name}</p>

                              {!eventEnded && typeof tier.remaining === "number" && tier.remaining > 0 && tier.remaining < 10 && (
                                <span className=" text-[13px] font-semibold text-[#db0000]">
                                  {tier.remaining} tiket tersisa!
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col items-start gap-1 pl-0 mt-0.5 md:flex-row md:items-center md:gap-2 md:pl-7.5">
                              <Typography variant="heading-s-bold" color="text-[#0C2D57]">
                                {"Rp" + tier.price.toLocaleString("id-ID")}
                              </Typography>
                              {tier.benefits && tier.benefits.length > 0 && (
                                <button
                                  onClick={() => setBenefitsOpen((prev) => {
                                    const next = [...prev]
                                    next[i] = !next[i]
                                    return next
                                  })}
                                  className="text-xs text-[#7e341b] font-medium hover:underline"
                                >
                                  {benefitsOpen[i] ? "Lebih Sedikit" : "Lebih Banyak"}
                                </button>
                              )}
                            </div>
                            {tier.benefits && tier.benefits.length > 0 && benefitsOpen[i] && (
                              <ul className="space-y-0.5 pl-7.5 md:pl-[25%] mt-1">
                                {tier.benefits.map((b) => (
                                  <li key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                                    {b}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => adjust(i, -1)}
                              disabled={eventEnded}
                              className="flex h-9 w-9 md:h-6 md:w-6 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 md:w-4 text-center text-sm font-medium">
                              {effectiveQuantities[i]}
                            </span>
                            <button
                              onClick={() => adjust(i, 1)}
                              disabled={eventEnded}
                              className="flex h-9 w-9 md:h-6 md:w-6 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {i < event.tickets.length - 1 && <div className="h-px bg-[#D6D6D6] shadow-[0_1px_4px_0_rgba(0,0,0,0.10)]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              className="order-7 md:0 mt-4.5 space-y-8 p-4 rounded-2xl"
              style={{
                backgroundColor: "RGBA(255,255,255,0.56)"
              }}
            >
              <section className="px-0">
                <p className="font-ibm font-bold text-[22px] leading-7.5 text-[#303030]">Tentang Acara</p>
                <div className="w-full md:w-[75%]">
                  <div
                    className="prose-event"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeDescription(event.description ?? ""),
                    }}
                  />
                </div>
              </section>

              <div className="h-px bg-[#D6D6D6] shadow-[0_1px_4px_0_rgba(0,0,0,0.10)]" />
              <section className="px-0">
                <p className="font-ibm pb-2 font-bold text-[22px] leading-7.5 text-[#303030]">Pengisi Acara</p>
                <PerformerGrid
                  performers={event.performers.map((p) => ({
                    name: p.name,
                    image: p.imageUrl ?? "",
                  }))}
                />
              </section>
            </div>
          </div>

        </div>

      </div>
      <CommentModal eventId={event.id} open={commentOpen} onOpenChange={setCommentOpen} canComment={event.canComment} />

      <div
        className={cn(
          "fixed bottom-0 inset-x-0 z-40 md:hidden rounded-t-[28px] border-t border-x border-white/50 bg-gradient-to-b from-[#9E3C77] to-[#E2D0DB] shadow-[0_-6px_24px_rgba(12,45,87,0.14)] will-change-transform transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          totalTickets > 0 ? "translate-y-0" : "translate-y-full pointer-events-none"
        )}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
      >
        <div className="flex items-center justify-between px-5 pt-3.5 pb-2">
          <Typography variant="body-l-semibold" color="#FFFFFF">{stickyLabel}</Typography>
          <Typography variant="body-l-semibold" color="#FFFFFF">{totalTickets} Tiket</Typography>
        </div>
        <div className="px-4 pt-1">
          <button
            type="button"
            onClick={handleBuy}
            className="w-full bg-[#0C2D57] text-white font-preterand font-bold text-[18px] h-11 rounded-full"
          >
            Beli Sekarang
          </button>
          <p className="mt-1.5 text-center text-[12px] text-[#9E9E9E]">
            Pembayaran anda aman &amp; terenkripsi
          </p>
        </div>
      </div>
    </div>
  )
}
