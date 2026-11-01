import Link from "next/link"
import { formatDateID } from "@/lib/format"

export type HistoriOrder = {
  orderId: string
  referenceNumber: string | null
  eventId: string
  eventName: string
  eventBannerUrl: string | null
  eventStartsAt: string
  tiers: { ticketTypeName: string; quantity: number }[]
  ticketCount: number
  statusLabel: string
}

export function OrderCard({ order, done = false }: { order: HistoriOrder; done?: boolean }) {
  return (
    <div className={"rounded-xl bg-white border border-border overflow-hidden " + (done ? "opacity-70" : "")}>
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4">
        <div className="hidden md:block text-[#2a8af6] font-bold text-lg whitespace-nowrap pr-4 border-r border-border">
          {order.ticketCount} Tiket
        </div>
        <div className="flex items-center gap-4 min-w-0 md:contents">
          {order.eventBannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={order.eventBannerUrl} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-xl font-bold text-neutral-900 truncate">{order.eventName}</h3>
              <span className="md:hidden shrink-0 text-sm font-bold text-[#2a8af6] whitespace-nowrap">
                {order.ticketCount} Tiket
              </span>
            </div>
            <div className="mt-1 space-y-0.5">
              {order.tiers.map((t, i) => (
                <p key={i} className="text-[#424242]">
                  {t.ticketTypeName} <span className="text-[#a853ba] font-semibold">x{t.quantity}</span>
                </p>
              ))}
            </div>
            <p className="text-sm text-neutral-500">{formatDateID(order.eventStartsAt)}</p>
          </div>
        </div>
        {done ? (
          <button
            disabled
            className="w-full md:w-auto rounded-full bg-neutral-200 text-neutral-400 font-bold px-6 py-2.5 cursor-not-allowed"
          >
            Lihat Tiket
          </button>
        ) : (
          <Link
            href={`/histori/${order.orderId}`}
            className="block w-full md:w-auto text-center rounded-full bg-[#0C2D57] hover:bg-slate-900 text-white font-bold px-6 py-2.5"
          >
            Lihat Tiket
          </Link>
        )}
      </div>
      <div className="flex items-center justify-between bg-[#A3A3A3] px-4 py-1.5">
        <span className="text-sm font-semibold text-[#0C2D57]">{order.referenceNumber ?? "-"}</span>
        <span className="text-sm font-semibold text-[#0C2D57]">{order.statusLabel}</span>
      </div>
    </div>
  )
}
