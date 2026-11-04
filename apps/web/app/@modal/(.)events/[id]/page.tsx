"use client"

import { useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { EventPanel } from "@/components/event/event-panel"

export default function EventModal() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const pendingHref = useRef<string | null>(null)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        onAnimationEnd={(e) => {
          if (e.target !== e.currentTarget || open) return
          if (pendingHref.current) router.replace(pendingHref.current)
          else router.back()
        }}
        className="inset-y-0 right-0 md:inset-y-1 md:right-1 h-full md:h-auto w-full gap-0 overflow-y-auto rounded-none md:rounded-lg border-0 md:border p-0 shadow-2xl sm:max-w-[560px]"
      >
        <SheetTitle className="sr-only">Detail Acara</SheetTitle>
        <SheetDescription className="sr-only">Detail acara dan pilihan tiket</SheetDescription>
        <EventPanel
          eventId={params.id}
          onBuy={(href) => {
            pendingHref.current = href
            setOpen(false)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
