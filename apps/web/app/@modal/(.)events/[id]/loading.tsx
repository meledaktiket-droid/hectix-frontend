"use client"

import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"

export default function EventModalLoading() {
  return (
    <Sheet open={true}>
      <SheetContent
        side="right"
        className="inset-y-0 right-0 md:inset-y-1 md:right-1 h-full md:h-auto w-full gap-0 overflow-y-auto rounded-none md:rounded-lg border-0 md:border p-0 shadow-2xl sm:max-w-[560px]"
      >
        <SheetTitle className="sr-only">Memuat Acara</SheetTitle>
        <SheetDescription className="sr-only">Sedang memuat detail acara</SheetDescription>
        <div className="space-y-4 px-5 pt-14 pb-8">
          <div className="aspect-square w-full animate-pulse rounded-2xl bg-muted" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-40 w-full animate-pulse rounded-2xl bg-muted" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
