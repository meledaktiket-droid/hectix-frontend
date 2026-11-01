"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Check } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { CheckoutNavbar } from "@/components/checkout/checkout-navbar"
import { CheckoutStepper } from "@/components/checkout/checkout-stepper"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"
import { Typography } from "@/components/ui/typography"

type OrderData = {
  id: string
  status: string
  paymentMethod: string
  bank: string | null
  referenceNumber: string | null
  total: number
  eventId: string
  eventName: string
  eventStartsAt: string
  eventBannerUrl: string | null
  items: { ticketTypeName: string; price: number; quantity: number }[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric"
  })
}

function fmt(n: number) {
  return "Rp" + n.toLocaleString("id-ID")
}

export default function SuccessPage() {
  const params = useParams<{ orderId: string }>()
  const router = useRouter()

  const { data: order } = useQuery<OrderData>({
    queryKey: ["order", params.orderId],
    queryFn: () => fetch(`/api/orders/${params.orderId}`).then((r) => r.json()),
  })

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
  })

  if (!order) return <div className="mx-4 md:mx-10 pt-6" />

  const ticketCount = order.items.reduce((s, i) => s + i.quantity, 0)
  const tierNames = order.items.map((i) => i.ticketTypeName).join(", ")
  const email = session?.data?.user?.email ?? ""
  const payVia =
    order.paymentMethod === "va_bank"
      ? `VA Bank ${(order.bank ?? "").toUpperCase()}`
      : order.paymentMethod === "qris"
        ? "QRIS"
        : order.paymentMethod
  const statusLabel = order.status === "paid" ? "Sukses" : order.status

  return (
    <div>
      <div className="mx-4 md:mx-10 pt-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <CheckoutNavbar
            title="Tiket Berhasil Dibeli"
            onBack={() => router.push(`/events/${order.eventId}`)}
          />
          <CheckoutStepper current={3} />

          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0C2D57]">
              <Check className="h-8 w-8 text-white" strokeWidth={3} />
            </div>
            <Typography variant="heading-s-bold" color="#0C2D57">Pembayaran Berhasil !</Typography>
            <Typography variant="body-xl-medium" color="#0C2D57">Tiketmu siap digunakan</Typography>
          </div>

          <div className="space-y-4 rounded-[16px] bg-white/55 p-4">
            <div className="space-y-2.5 rounded-[20px] border border-[#737373] bg-[#E5E5E5] p-2.5">
              <div className="flex items-start gap-3 rounded-[16px] border border-[#D6D6D6] bg-[#FAFAFA] p-3">
                {order.eventBannerUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={order.eventBannerUrl} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                )}
                <div className="min-w-0">
                  <Typography variant="heading-s-bold">{order.eventName}</Typography>
                  <Typography variant="body-xl-medium" color="#424242">
                    {tierNames} <span className="text-[#2a8af6]">x{ticketCount}</span>
                  </Typography>
                  <Typography variant="body-xl-medium" color="#424242">
                    {formatDate(order.eventStartsAt)}
                  </Typography>
                </div>
              </div>

              <div className="rounded-[16px] bg-[#FAFAFA] p-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between gap-2">
                    <Typography variant="body-xl-bold" color="#303030">{order.eventName}</Typography>
                    <Typography variant="body-l-medium" color="#424242" className="shrink-0 text-right">
                      {formatDate(order.eventStartsAt)}
                    </Typography>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Typography variant="body-xl-medium" color="#1F1F1F">{tierNames}</Typography>
                    <Typography variant="body-xl-semibold" color="#256EFF">X{ticketCount}</Typography>
                  </div>
                </div>

                <div className="my-2 h-px bg-[#D6D6D6]" />
                <div className="flex justify-between gap-2">
                  <Typography variant="body-xl-medium" color="#575757">Total</Typography>
                  <Typography variant="body-xl-semibold" color="#1F1F1F">{fmt(order.total)}</Typography>
                </div>

                <div className="my-2 h-px bg-[#D6D6D6]" />
                <div className="flex justify-between gap-2">
                  <Typography variant="body-xl-medium" color="#575757">Bayar Via</Typography>
                  <Typography variant="body-xl-semibold" color="#1F1F1F">{payVia}</Typography>
                </div>

                <div className="my-2 h-px bg-[#D6D6D6]" />
                <div className="flex justify-between gap-2">
                  <Typography variant="body-xl-medium" color="#575757">Kode Transaksi</Typography>
                  <Typography variant="body-xl-semibold" color="#1F1F1F" className="text-right break-all">
                    {order.referenceNumber ?? "-"}
                  </Typography>
                </div>

                <div className="my-2 h-px bg-[#D6D6D6]" />
                <div className="flex justify-between gap-2">
                  <Typography variant="body-xl-medium" color="#575757">Status</Typography>
                  <Typography variant="body-xl-semibold" color="#256EFF">{statusLabel}</Typography>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-[#424242]">Tiket dan bukti pembayaran dikirim ke :</p>
              {email && (
                <p className="mt-1 text-sm text-[#424242]">
                  Email : <span className="font-bold">{email}</span>
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push("/histori")}
                className="h-12 w-full rounded-full bg-[#0C2D57] font-bold text-white hover:bg-slate-900"
              >
                Histori
              </Button>
              <Button
                onClick={() => { window.location.href = `/events/${order.eventId}` }}
                className="h-12 w-full rounded-full bg-[#0C2D57] font-bold text-white hover:bg-slate-900"
              >
                Komen Acara
              </Button>
              <Button
                onClick={() => router.push("/")}
                className="h-12 w-full rounded-full bg-[#9E3C77] font-bold text-white hover:bg-rose-700"
              >
                Beranda
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <Footer />
      </div>
    </div>
  )
}
