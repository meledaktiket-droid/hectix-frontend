"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft } from "lucide-react"
import { Barcode } from "./barcode"
import { formatDateID, formatRupiah } from "@/lib/format"

type DetailData = {
  id: string
  referenceNumber: string | null
  barcode: string | null
  paymentMethod: string
  bank: string | null
  subtotal: number
  tax: number
  serviceFee: number
  total: number
  voucherDiscount: number
  createdAt: string
  eventId: string
  eventName: string
  eventStartsAt: string
  eventBannerUrl: string | null
  eventVenueName: string | null
  eventCity: string | null
  buyerName: string
  items: { ticketTypeName: string; price: number; quantity: number }[]
}

export function OrderDetail({ orderId }: { orderId: string }) {
  const router = useRouter()
  const { data, isLoading } = useQuery<DetailData>({
    queryKey: ["histori-detail", orderId],
    queryFn: () => fetch(`/api/histori/${orderId}`).then((r) => r.json()),
  })

  if (isLoading || !data) return <div className="py-20 text-center text-neutral-500">Memuat…</div>

  const ticketCount = data.items.reduce((s, i) => s + i.quantity, 0)
  const paymentLabel = data.paymentMethod === "qris" ? "QRIS" : `${(data.bank ?? "").toUpperCase()} VA`
  const eventId = data.eventId

  function handleEventClick(e: React.MouseEvent) {
    if (!window.matchMedia("(min-width: 768px)").matches) {
      e.preventDefault()
      window.location.assign(`/events/${eventId}`)
    }
  }

  return (
    <div className="rounded-2xl bg-white/60 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/histori?tab=aktif")} className="flex items-center gap-1 text-[#0C2D57] font-semibold">
          <ChevronLeft className="h-5 w-5" /> Kembali
        </button>
        <span className="text-lg font-bold text-[#0C2D57]">Detail Tiket</span>
      </div>

      <div className="mt-4 rounded-xl bg-white border border-border p-4 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="hidden md:block text-[#2a8af6] font-bold text-lg pr-4 border-r border-border">{ticketCount} Tiket</div>
        <div className="flex items-center gap-4 min-w-0 md:contents">
          {data.eventBannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.eventBannerUrl} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-2xl font-bold truncate">{data.eventName}</h2>
              <span className="md:hidden shrink-0 text-sm font-bold text-[#2a8af6] whitespace-nowrap">{ticketCount} Tiket</span>
            </div>
            <p className="text-[#424242]">
              {data.items.map((i) => i.ticketTypeName).join(", ")} <span className="text-[#a853ba] font-semibold">x{ticketCount}</span>
            </p>
            <p className="text-sm text-neutral-500">{formatDateID(data.eventStartsAt)}</p>
          </div>
        </div>
        <Link href={`/events/${data.eventId}`} onClick={handleEventClick} className="block w-full md:w-auto text-center rounded-full bg-[#0C2D57] text-white font-bold px-6 py-2.5">
          Lihat Acara
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-4 md:grid md:grid-cols-7 md:gap-6">
        <div className="md:col-span-4 rounded-xl bg-white border border-border overflow-hidden">
          <div className="flex items-center justify-between bg-[#E5E7EB] px-4 py-2.5">
            <span className="font-bold text-[#0C2D57]">Detail Pembelian</span>
            <span className="font-semibold text-[#0C2D57]">{ticketCount} Tiket</span>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <div><p className="text-neutral-500">Nomor</p><p className="font-semibold text-[#2a8af6]">{data.referenceNumber ?? "-"}</p></div>
              <div><p className="text-neutral-500">Tanggal Transaksi</p><p className="font-semibold">{formatDateID(data.createdAt)}</p></div>
              <div><p className="text-neutral-500">Metode Pembayaran</p><p className="font-semibold">{paymentLabel}</p></div>
              <div><p className="text-neutral-500">Status</p><p className="font-semibold">Pembayaran Selesai</p></div>
              <a
                href={data.barcode ? `/api/histori/${orderId}/ticket.pdf` : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!data.barcode}
                className={`mt-2 block w-full rounded-full py-2.5 text-center font-bold text-white ${
                  data.barcode ? "bg-[#9E3C77]" : "bg-neutral-300 pointer-events-none"
                }`}
              >
                Cetak Tiket
              </a>
            </div>
            <div className="space-y-2 text-sm">
              {data.items.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <div>
                    <p className="font-semibold">{it.ticketTypeName}</p>
                    <p className="text-[#2a8af6]">{formatRupiah(it.price)}</p>
                  </div>
                  <span className="text-[#a853ba] font-semibold">x{it.quantity}</span>
                </div>
              ))}
              <div className="h-px bg-border" />
              <Row label="Subtotal" value={formatRupiah(data.subtotal)} />
              {data.voucherDiscount > 0 && <Row label="Diskon Voucher" value={"-" + formatRupiah(data.voucherDiscount)} />}
              <Row label="Pajak" value={formatRupiah(data.tax)} />
              <Row label="Biaya layanan" value={formatRupiah(data.serviceFee)} />
              <div className="flex justify-between font-bold text-[#2a8af6]">
                <span>Total ({ticketCount} tiket)</span><span>{formatRupiah(data.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-4">
          <div className="rounded-xl bg-[#0C2D57] text-white p-5">
            <h3 className="text-center font-bold">{data.eventName}</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/80">
              <div><p>Nama</p><p className="text-white font-semibold">{data.buyerName}</p></div>
              <div><p>Tanggal</p><p className="text-white font-semibold">{formatDateID(data.eventStartsAt)}</p></div>
              <div><p>Lokasi</p><p className="text-white font-semibold">{data.eventVenueName}</p><p>{data.eventCity}</p></div>
              <div><p>Jumlah</p><p className="text-white font-semibold">{ticketCount} Tiket</p></div>
            </div>
            {data.barcode ? (
              <div className="mt-4 rounded-lg bg-white p-3">
                <Barcode value={data.barcode} />
                <p className="mt-1 text-center text-xs font-semibold text-[#2a8af6]">{data.referenceNumber}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-lg bg-white/10 p-6 text-center text-sm">Tiket sedang disiapkan…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-600">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
