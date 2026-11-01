"use client"

import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Typography } from "@/components/ui/typography"
import { EventDetailBody } from "@/components/event/event-detail-body"

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()

  return (
    <>
      <Navbar title="Detail Acara" variant="home" />
      <EventDetailBody eventId={params.id} />
      <div className="flex flex-wrap gap-6 md:gap-0 md:space-x-20 mt-6 justify-center">
        <Typography variant="body-xl-bold" color="#0C2D57">Beranda</Typography>
        <Typography variant="body-xl-bold" color="#0C2D57">Bantuan</Typography>
        <Typography variant="body-xl-bold" color="#0C2D57">Buat Acara</Typography>
      </div>
      <div className="mt-6">
        <Footer showUpper={false} />
      </div>
    </>
  )
}
