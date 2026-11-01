"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"
import { CheckoutNavbar } from "@/components/checkout/checkout-navbar"
import { CheckoutStepper } from "@/components/checkout/checkout-stepper"
import { StackedPanel } from "@/components/checkout/stacked-panel"
import { CountdownTimer } from "@/components/checkout/countdown-timer"
import { VaPaymentCard } from "@/components/checkout/va-payment-card"
import { CancelOrderModal } from "@/components/checkout/cancel-order-modal"
import { OrderSummary } from "@/components/checkout/order-summary"
import { Footer } from "@/components/footer"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Typography } from "@/components/ui/typography"

type OrderData = {
  id: string
  status: string
  paymentMethod: string
  bank: string
  vaNumber: string
  subtotal: number
  tax: number
  serviceFee: number
  total: number
  voucherDiscount: number
  expiresAt: string
  qrisUrl: string | null
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

function PaymentInstructions({ bank }: { bank: string }) {
  const methods = ["ATM", "Internet Banking", "Mobile Banking"]
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="rounded-xl border border-border bg-white p-4 space-y-2">
      <Typography variant="body-xl-semibold">Cara Pembayaran</Typography>
      {methods.map((m) => (
        <div key={m} className="border-b border-[#D6D6D6] pb-2">
          <button
            className="flex w-full items-center justify-between py-1"
            onClick={() => setOpen(open === m ? null : m)}
          >
            <Typography variant="body-xl-medium">{bank.toUpperCase()}-{m}</Typography>
            {open === m ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {open === m && (
            <Typography variant="body-s-medium" color="#757575" className="mt-1 pl-2">
              Ikuti instruksi pembayaran melalui {m} untuk bank {bank.toUpperCase()}.
            </Typography>
          )}
        </div>
      ))}
    </div>
  )
}

export default function PayPage() {
  const params = useParams<{ orderId: string }>()
  const router = useRouter()
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const { data: order } = useQuery<OrderData>({
    queryKey: ["order", params.orderId],
    queryFn: () => fetch(`/api/orders/${params.orderId}`).then((r) => r.json()),
    refetchInterval: 5000,
  })

  useEffect(() => {
    if (order?.status === "paid") {
      router.replace(`/orders/${params.orderId}/success`)
    }
  }, [order?.status, params.orderId, router])

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  async function handleCancelConfirm() {
    setIsCancelling(true)
    try {
      await fetch(`/api/orders/${params.orderId}`, { method: "DELETE" })
      router.push(`/events/${order?.eventId}/checkout`)
    } finally {
      setIsCancelling(false)
      setCancelModalOpen(false)
    }
  }

  const handleExpire = useCallback(() => {
    if (order) router.push(`/events/${order.eventId}`)
  }, [router, order])

  if (!order) return <div className="mx-10 pt-6" />

  const ticketCount = order.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div>
      <div className="mx-4 md:mx-10 pt-6 space-y-6">
        <CheckoutNavbar
          title="Pesanan Berhasil Dibuat"
          onBack={() => setCancelModalOpen(true)}
        />
        <StackedPanel stackBehind={1} className="bg-white/55 pt-6 px-4 pb-6 md:pb-24 rounded-[16px] flex flex-col gap-4 md:block">
          <div className="order-1 md:order-none">
            <CheckoutStepper current={2} />
          </div>
          {order.paymentMethod === "qris" && (
            <div className="order-2 md:order-none">
              <CountdownTimer
                expiresAt={order.expiresAt}
                onExpire={handleExpire}
              />
            </div>
          )}

          <div className="order-4 md:order-none md:mt-4 rounded-[20px] border border-[#737373] bg-[#E5E5E5] p-2.5">
            <div className="mb-2.5 flex items-center justify-between px-1">
              <Typography variant="heading-s-bold" color="#1F1F1F">Detail Item</Typography>
              <Typography variant="body-xl-semibold" color="#0C2D57">{ticketCount} Tiket</Typography>
            </div>
            <div className="flex items-start gap-3 rounded-[16px] bg-[#FAFAFA] p-3">
              {order.eventBannerUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.eventBannerUrl} alt="" className="h-20 w-20 rounded-lg object-cover shrink-0" />
              )}
              <div className="min-w-0">
                <Typography variant="heading-s-bold">{order.eventName}</Typography>
                <Typography variant="body-xl-medium" color="#424242">
                  {order.items.map((i) => i.ticketTypeName).join(", ")}{" "}
                  <span className="text-[#2a8af6]">x{ticketCount}</span>
                </Typography>
                <Typography variant="body-xl-medium" color="#424242">
                  {formatDate(order.eventStartsAt)}
                </Typography>
              </div>
            </div>
          </div>

          <div className="contents md:grid md:grid-cols-7 md:gap-6 md:mt-4">
            <div className="contents md:block md:col-span-4 md:space-y-4">
              {order.paymentMethod === "va_bank" && order.bank && (
                <>
                  <div className="order-3 md:order-none">
                    <VaPaymentCard
                      bank={order.bank}
                      vaNumber={order.vaNumber ?? ""}
                      recipientName="PT. Hectix Indonesia"
                      expiresAt={order.expiresAt}
                      onExpire={handleExpire}
                    />
                  </div>
                  <div className="order-6 md:order-none">
                    <PaymentInstructions bank={order.bank} />
                  </div>
                </>
              )}
              {order.paymentMethod === "qris" && order.qrisUrl && (
                <div className="order-3 md:order-none rounded-xl border border-border bg-white p-6 flex flex-col items-center gap-4">
                  <Typography variant="body-xl-semibold">Scan QR untuk membayar</Typography>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={order.qrisUrl} alt="QRIS" className="w-56 h-56 object-contain" />
                  <Typography variant="body-s-medium" color="#757575">
                    Gunakan aplikasi e-wallet atau mobile banking apapun
                  </Typography>
                </div>
              )}
            </div>

            <div className="contents md:block md:col-span-3 md:space-y-4">
              <div className="order-5 md:order-none">
                <OrderSummary
                  eventName={order.eventName}
                  eventDate={formatDate(order.eventStartsAt)}
                  items={order.items}
                  subtotal={order.subtotal}
                  tax={order.tax}
                  serviceFee={order.serviceFee}
                  total={order.total}
                  voucherDiscount={order.voucherDiscount}
                  ticketCount={ticketCount}
                />
              </div>
              <div className="order-7 md:order-none rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                <span className="text-2xl">📋</span>
                <p className="text-sm text-[#424242]">
                  Tiket dan bukti pembayaran akan otomatis dikirim ke email / whatsapp kamu.
                </p>
              </div>
            </div>
          </div>
        </StackedPanel>
      </div>

      <div className="mt-10">
        <Footer />
      </div>

      <CancelOrderModal
        open={cancelModalOpen}
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelModalOpen(false)}
        isLoading={isCancelling}
      />
    </div>
  )
}
