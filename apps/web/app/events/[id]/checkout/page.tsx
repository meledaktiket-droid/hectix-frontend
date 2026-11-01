"use client"

import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { CheckoutNavbar } from "@/components/checkout/checkout-navbar"
import { CheckoutStepper } from "@/components/checkout/checkout-stepper"
import { StackedPanel } from "@/components/checkout/stacked-panel"
import { BuyerDetailCard } from "@/components/checkout/buyer-detail-card"
import { PaymentMethodSelector, type PaymentMethod, type Bank } from "@/components/checkout/payment-method-selector"
import { OrderSummary } from "@/components/checkout/order-summary"
import { VoucherInput } from "@/components/checkout/voucher-input"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"
import { Typography } from "@/components/ui/typography"

type EventData = {
  id: string
  name: string
  startsAt: string
  tickets: { id: string; name: string; price: number; quantity: number }[]
}

function parseTicketsParam(raw: string | null): Record<string, number> {
  if (!raw) return {}
  return Object.fromEntries(
    raw.split(",").map((part) => {
      const [id, qty] = part.split(":")
      return [id, parseInt(qty, 10)]
    })
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric"
  })
}

export default function CheckoutPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const ticketsParam = parseTicketsParam(searchParams.get("tickets"))

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
  })

  const { data: eventData } = useQuery<EventData>({
    queryKey: ["event", params.id],
    queryFn: () => fetch(`/api/events/${params.id}`).then((r) => r.json()),
  })

  const { data: config } = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const res = await fetch("/api/config")
      return res.json() as Promise<{ whatsappNumber: string; serviceFee: number; taxPercent: number }>
    },
    staleTime: 5 * 60 * 1000,
  })

  const serviceFee = config?.serviceFee ?? 7120
  const taxPercent = config?.taxPercent ?? 10

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("va_bank")
  const [bank, setBank] = useState<Bank>("mandiri")
  const [voucherCode, setVoucherCode] = useState("")
  const [voucherDiscount, setVoucherDiscount] = useState(0)
  const [appliedCode, setAppliedCode] = useState<string | null>(null)
  const [voucherStatus, setVoucherStatus] = useState<"idle" | "success" | "error">("idle")
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedItems = eventData
    ? eventData.tickets
      .filter((t) => ticketsParam[t.id] > 0)
      .map((t) => ({ ticketTypeId: t.id, ticketTypeName: t.name, price: t.price, quantity: ticketsParam[t.id] }))
    : []

  const grossSubtotal = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const subtotal = grossSubtotal - voucherDiscount
  const tax = Math.round(subtotal * taxPercent / 100)
  const total = subtotal + tax + serviceFee
  const ticketCount = selectedItems.reduce((s, i) => s + i.quantity, 0)

  async function handleRedeem(code: string) {
    if (!code.trim()) return
    setIsRedeeming(true)
    setVoucherStatus("idle")
    setVoucherMessage(null)
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: params.id, code, subtotal: grossSubtotal }),
      })
      const data = await res.json()
      if (data.valid) {
        setVoucherCode(data.code)
        setVoucherDiscount(data.discount)
        setAppliedCode(data.code)
        setVoucherStatus("success")
        setVoucherMessage(data.message ?? "Voucher diterapkan")
      } else {
        setVoucherCode("")
        setVoucherDiscount(0)
        setAppliedCode(null)
        setVoucherStatus("error")
        setVoucherMessage(data.message ?? "Kode tidak valid")
      }
    } catch {
      setVoucherStatus("error")
      setVoucherMessage("Gagal memvalidasi kode")
    } finally {
      setIsRedeeming(false)
    }
  }

  function handleClearVoucher() {
    setVoucherCode("")
    setVoucherDiscount(0)
    setAppliedCode(null)
    setVoucherStatus("idle")
    setVoucherMessage(null)
  }

  async function handleSubmit() {
    if (!session?.data?.user || !eventData) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: params.id,
          items: selectedItems.map((i) => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity })),
          paymentMethod,
          bank: paymentMethod === "va_bank" ? bank : undefined,
          voucherCode: voucherCode || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error ?? "Gagal membuat pesanan. Silakan coba lagi.")
        return
      }
      if (data.orderId) {
        router.push(`/orders/${data.orderId}/pay`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogin() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.href,
    })
  }

  const user = session?.data?.user ?? null
  const isLoggedIn = !!user
  const canSubmit = isLoggedIn && acceptTerms && ticketCount > 0

  const tierLabel = selectedItems[0]?.ticketTypeName ?? ""

  return (
    <div className="pb-28 md:pb-0">
      <div className="mx-4 md:mx-10 pt-6 space-y-6">
        <CheckoutNavbar
          title="Selesaikan Pembelianmu"
          onBack={() => { window.location.href = `/events/${params.id}` }}
        />
        <StackedPanel stackBehind={2} className="bg-white/55 pt-6 px-4 pb-6 md:pb-24 rounded-[16px]">
          <CheckoutStepper current={1} />

          <div className="flex flex-col gap-6 md:grid md:grid-cols-12 md:gap-6 mt-4">
            <div className="contents md:block md:col-span-8 md:space-y-6">
              <div className="order-1 md:order-none">
                <BuyerDetailCard user={user ? { name: user.name, email: user.email } : null} />
              </div>
              <div className="order-2 md:order-none">
                <PaymentMethodSelector
                  method={paymentMethod}
                  bank={bank}
                  onMethodChange={setPaymentMethod}
                  onBankChange={setBank}
                />
              </div>
            </div>

            <div className="contents md:block md:col-span-4 md:space-y-4.5">
              <div className="order-4 md:order-none">
                {eventData && (
                  <OrderSummary
                    eventName={eventData.name}
                    eventDate={formatDate(eventData.startsAt)}
                    items={selectedItems}
                    subtotal={subtotal}
                    tax={tax}
                    serviceFee={serviceFee}
                    total={total}
                    voucherDiscount={voucherDiscount}
                    ticketCount={ticketCount}
                  />
                )}
              </div>

              <div className="order-3 md:order-none">
                <VoucherInput
                  onRedeem={handleRedeem}
                  onClear={handleClearVoucher}
                  isLoading={isRedeeming}
                  status={voucherStatus}
                  message={voucherMessage}
                  appliedCode={appliedCode}
                />
              </div>

              <div className="order-5 md:order-none space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1.5 h-4 w-4 shrink-0 accent-[#0C2D57]"
                  />
                  <Typography variant="body-xl-medium" color="303030">
                    Saya telah membaca dan menyetujui syarat & ketentuan pembelian, dan kebijakan privasi.
                  </Typography>
                </label>
              </div>

              <div className="hidden md:block md:order-none">
                {isLoggedIn ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className="w-full bg-[#9E3C77] hover:bg-rose-700 text-white font-bold text-lg h-12 rounded-full"
                  >
                    {isSubmitting ? "Memproses..." : "Bayar Sekarang"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleLogin}
                    className="w-full bg-[#9E3C77] hover:bg-rose-700 text-white font-bold text-lg h-12 rounded-full"
                  >
                    Masuk Dulu
                  </Button>
                )}
              </div>
            </div>
          </div>
        </StackedPanel>
      </div>
      <div className="mt-10">
        <Footer />
      </div>

      <div
        className="fixed bottom-0 inset-x-0 z-40 md:hidden rounded-t-[28px] border-t border-x border-white/50 bg-gradient-to-b from-[#9E3C77] to-[#E2D0DB] shadow-[0_-6px_24px_rgba(12,45,87,0.14)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
      >
        <div className="flex items-center justify-between px-5 pt-3.5 pb-2">
          <Typography variant="body-l-semibold" color="#FFFFFF">{tierLabel}</Typography>
          <Typography variant="body-l-semibold" color="#FFFFFF">{ticketCount} Tiket</Typography>
        </div>
        <div className="px-4 pt-1">
          <button
            type="button"
            onClick={isLoggedIn ? handleSubmit : handleLogin}
            disabled={isLoggedIn && (!canSubmit || isSubmitting)}
            className="w-full bg-[#0C2D57] text-white font-preterand font-bold text-[18px] h-11 rounded-full disabled:opacity-40"
          >
            {isLoggedIn ? (isSubmitting ? "Memproses..." : "Bayar Sekarang") : "Masuk Dulu"}
          </button>
          <p className="mt-1.5 text-center text-[12px] text-[#9E9E9E]">
            Pembayaran anda aman &amp; terenkripsi
          </p>
        </div>
      </div>
    </div>
  )
}
