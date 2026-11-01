"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Typography } from "../ui/typography"

type Props = {
  onRedeem: (code: string) => void
  onClear?: () => void
  isLoading?: boolean
  status?: "idle" | "success" | "error"
  message?: string | null
  appliedCode?: string | null
}

export function VoucherInput({ onRedeem, onClear, isLoading, status = "idle", message, appliedCode }: Props) {
  const [code, setCode] = useState("")

  return (
    <div className="bg-[#E5E5E5] rounded-[16px] p-4">
      <Typography variant="body-xl-semibold" color="#303030" className="mb-2">Voucher Diskon</Typography>

      {appliedCode ? (
        <div className="flex items-center justify-between gap-2 rounded-full border border-green-500 bg-white px-4 h-12">
          <span className="flex items-center gap-2 text-sm font-semibold text-green-700">
            <Check className="size-4" />
            {appliedCode}
          </span>
          <button
            type="button"
            onClick={() => { setCode(""); onClear?.() }}
            className="rounded-full p-1 text-[#757575] hover:text-[#303030]"
            aria-label="Hapus voucher"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2 h-12">
          <Input
            placeholder="Masukan kode"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 rounded-full border border-[#D6D6D6] bg-white! h-full!"
          />
          <Button
            onClick={() => onRedeem(code)}
            disabled={!code || isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 h-full!"
          >
            {isLoading ? "..." : "Redeem"}
          </Button>
        </div>
      )}

      {message && status === "error" ? (
        <p className="text-xs text-red-600 mt-2 ml-1">{message}</p>
      ) : message && status === "success" ? (
        <p className="text-xs text-green-700 mt-2 ml-1">{message}</p>
      ) : (
        <p className="text-xs text-[#757575] mt-2 ml-1">Untuk Klaim Diskon dan Potongan harga</p>
      )}
    </div>
  )
}
