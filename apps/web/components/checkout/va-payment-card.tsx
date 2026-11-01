"use client"

import { Copy, Timer } from "lucide-react"
import { useEffect, useState } from "react"
import Image from "next/image"

type Props = {
  bank: string
  vaNumber: string
  recipientName: string
  expiresAt: string
  onExpire?: () => void
}

const BANK_LABELS: Record<string, string> = {
  bca: "Bank BCA Virtual Account",
  mandiri: "Bank Mandiri Virtual Account",
  bri: "Bank BRI Virtual Account",
  bsi: "Bank BSI Virtual Account",
  bni: "Bank BNI Virtual Account",
}

const BANK_LOGOS: Record<string, { src: string; w: number; h: number }> = {
  bca: { src: "/bca.png", w: 40, h: 28 },
  mandiri: { src: "/mandiri.png", w: 56, h: 28 },
  bri: { src: "/bri.png", w: 40, h: 28 },
  bsi: { src: "/logo-bsi.png", w: 40, h: 28 },
  bni: { src: "/bni.png", w: 40, h: 28 },
}

export function VaPaymentCard({ bank, vaNumber, recipientName, expiresAt, onExpire }: Props) {
  const [copied, setCopied] = useState(false)
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now())
      setRemaining(diff)
      if (diff === 0) onExpire?.()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt, onExpire])

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

  const logo = BANK_LOGOS[bank]

  function copy() {
    navigator.clipboard.writeText(vaNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#7C7C7C] via-[#5C5C5C] to-[#454545] text-white p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-[68%] text-sm md:text-base font-medium leading-snug">
          Segera lakukan pembayaran sebelum waktu habis
        </p>
        <div className="flex shrink-0 items-center gap-1.5 font-bold text-[#FF7A1A]">
          <Timer className="h-5 w-5" />
          <span className="text-lg">{display}</span>
          <span>!</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {logo && (
          <div className="flex h-9 shrink-0 items-center rounded-lg bg-white px-2">
            <Image src={logo.src} width={logo.w} height={logo.h} alt={bank} className="object-contain" />
          </div>
        )}
        <p className="text-base md:text-lg font-bold">{BANK_LABELS[bank] ?? bank}</p>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm md:text-base text-[#D6D6D6]">Nomor VA :</span>
          <button onClick={copy} className="flex shrink-0 items-center gap-1.5 hover:opacity-70">
            {copied && <span className="text-xs text-green-300">Disalin!</span>}
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 break-all text-xl md:text-2xl font-bold leading-tight">{vaNumber}</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="shrink-0 text-sm md:text-base text-[#D6D6D6]">Nama Penerima</span>
        <span className="text-right font-semibold">{recipientName}</span>
      </div>
    </div>
  )
}
