"use client"

import { Heart } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"

export function FavoriteButton({
  eventId,
  className,
  size = 24,
}: {
  eventId: string
  className?: string
  size?: number
}) {
  const qc = useQueryClient()
  const { data: ids } = useQuery<string[]>({
    queryKey: ["favorite-ids"],
    queryFn: () => fetch("/api/favorites/ids").then((r) => r.json()),
    staleTime: 60_000,
  })
  const isFav = !!ids?.includes(eventId)

  const toggle = useMutation({
    mutationFn: async () => {
      if (isFav) {
        await fetch(`/api/favorites/${eventId}`, { method: "DELETE" })
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        })
      }
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["favorite-ids"] })
      const prev = qc.getQueryData<string[]>(["favorite-ids"]) ?? []
      qc.setQueryData<string[]>(["favorite-ids"], isFav ? prev.filter((id) => id !== eventId) : [...prev, eventId])
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["favorite-ids"], ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["favorite-ids"] })
      qc.invalidateQueries({ queryKey: ["favorites"] })
    },
  })

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle.mutate()
      }}
      aria-label={isFav ? "Hapus dari favorit" : "Simpan ke favorit"}
      className={cn("transition-colors", className)}
    >
      <Heart
        style={{ width: size, height: size }}
        className={isFav ? "fill-[#e92a67] text-[#e92a67]" : "text-current"}
      />
    </button>
  )
}
