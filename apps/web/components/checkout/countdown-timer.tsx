"use client"

import { useEffect, useState } from "react"

type Props = {
  expiresAt: string
  onExpire?: () => void
}

export function CountdownTimer({ expiresAt, onExpire }: Props) {
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

  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-orange-500">⏰ {display} !</p>
      <p className="text-sm text-[#424242] mt-1">
        Segera lakukan pembayaran sebelum waktu habis
      </p>
    </div>
  )
}
