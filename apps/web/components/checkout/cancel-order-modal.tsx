"use client"

import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function CancelOrderModal({ open, onConfirm, onCancel, isLoading }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-80 space-y-4 shadow-xl">
        <p className="text-base font-bold text-[#0C2D57] text-center">
          Batalkan pesanan?
        </p>
        <p className="text-sm text-[#424242] text-center">
          Kembali akan membatalkan pesananmu. Yakin ingin kembali?
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Tidak
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-[#e92a67] hover:bg-rose-600 text-white"
          >
            {isLoading ? "..." : "Ya, batalkan"}
          </Button>
        </div>
      </div>
    </div>
  )
}
