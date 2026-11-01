"use client"

import { useState } from "react"
import { Building2, QrCode, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Typography } from "@/components/ui/typography"
import Image from "next/image"

export type PaymentMethod = "va_bank" | "qris"
export type Bank = "bca" | "mandiri" | "bri" | "bsi" | "bni"

const BANKS: { id: Bank; label: string; logo: { src: string; w: number; h: number }; disabled?: boolean }[] = [
  { id: "bca", label: "Bank Central Asia", logo: { src: "/bca.png", w: 40, h: 40 }, disabled: true },
  { id: "mandiri", label: "Mandiri", logo: { src: '/mandiri.png', w: 60, h: 40 } },
  { id: "bri", label: "Bank Rakyat Indonesia", logo: { src: "/bri.png", w: 40, h: 40 } },
  { id: "bsi", label: "Bank Syariah Indonesia", logo: { src: "/logo-bsi.png", w: 40, h: 40 }, disabled: true },
  { id: "bni", label: "Bank Negara Indonesia", logo: { src: "/bni.png", w: 40, h: 40 } },
]

type Props = {
  method: PaymentMethod
  bank: Bank
  onMethodChange: (m: PaymentMethod) => void
  onBankChange: (b: Bank) => void
}

export function PaymentMethodSelector({ method, bank, onMethodChange, onBankChange }: Props) {
  const [vaOpen, setVaOpen] = useState(true)
  const [qrisOpen, setQrisOpen] = useState(true)

  return (
    <div className="space-y-3 bg-[#E5E5E5] p-3.5 rounded-xl">
      <Typography variant="heading-s-bold" color="#0C2D57">
        Pilih Metode Pembayaran
      </Typography>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div
          className={cn(
            "rounded-xl p-4 cursor-pointer bg-[#FAFAFA]",
          )}
          onClick={() => onMethodChange("va_bank")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#303030]" />
              <Typography variant="heading-s-bold" color="#303030">VA Bank Transfer</Typography>
            </div>
            <div className="flex items-center gap-1">
              <div className="text-right">
                <Typography variant="heading-s-bold" color="#256EFF">+7%</Typography>
                <Typography variant="body-s-medium" color="#256EFF">Internet Fee</Typography>
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <Typography variant="body-s-medium" color="#757575" className="mt-1">
              Transfer melalui Virtual Account bank, Otomatis terverifikasi.
            </Typography>

            <button onClick={(e) => { e.stopPropagation(); setVaOpen((o) => !o) }}>
              {vaOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          <div className="h-px bg-[#D6D6D6]" />

          {vaOpen && (
            <div className="mt-3 divide-y divide-[#EBEBEB]">
              {BANKS.map((b) => (
                <label
                  key={b.id}
                  className={cn("flex items-center justify-between py-2.5", b.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer")}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg border border-[#E5E5E5] bg-white">
                      <Image
                        src={b.logo.src}
                        width={b.logo.w}
                        height={b.logo.h}
                        alt="logo"
                        className="h-auto max-h-7 w-auto max-w-[44px] object-contain"
                      />
                    </div>
                    <Typography variant="body-m-medium" color="#303030">{b.label}</Typography>
                  </div>
                  <input
                    type="radio"
                    name="bank"
                    disabled={b.disabled}
                    checked={method === "va_bank" && bank === b.id}
                    onChange={() => { onMethodChange("va_bank"); onBankChange(b.id) }}
                    className="appearance-none h-5 w-5 shrink-0 rounded-full border border-[#D6D6D6] bg-white checked:bg-[radial-gradient(#29BF12_0%,#29BF12_50%,transparent_55%)]"
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        <div
          className={cn(
            "rounded-xl p-4 cursor-pointer bg-[#FAFAFA]",
          )}
          onClick={() => onMethodChange("qris")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-[#303030]" />
              <Typography variant="heading-s-bold" color="#303030">Barcode</Typography>
            </div>
            <div className="text-right">
              <Typography variant="heading-s-bold" color="#256EFF">+7%</Typography>
              <Typography variant="body-s-medium" color="#256EFF">Internet Fee</Typography>
            </div>
          </div>
          <div className="flex justify-between">
            <Typography variant="body-s-medium" color="#757575" className="mt-1">
              Scan barcode untuk melakukan pembayaran tiketmu.
            </Typography>
            <button onClick={(e) => { e.stopPropagation(); setQrisOpen((o) => !o) }}>
              {qrisOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {qrisOpen && (
            <div className="mt-3 space-y-2">
              <div className="h-px bg-[#D6D6D6]" />
              <div className="mt-3">
                <label
                  className="flex items-center justify-between cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg border border-[#E5E5E5] bg-white">
                      <Image src="/qris.png" width={52} height={40} alt="QRIS" className="h-auto max-h-7 w-auto max-w-[44px] object-contain" />
                    </div>
                    <Typography variant="body-m-medium" color="#303030">QRIS Barcode GPN</Typography>
                  </div>
                  <input
                    type="radio"
                    name="qris"
                    checked={method === "qris"}
                    onChange={() => onMethodChange("qris")}
                    className="appearance-none h-5 w-5 shrink-0 rounded-full border border-[#D6D6D6] bg-white checked:bg-[radial-gradient(#29BF12_0%,#29BF12_50%,transparent_55%)]"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
