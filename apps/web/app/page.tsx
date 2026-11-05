import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { FeaturedCarousel } from "@/components/featured-carousel"
import { EventSection, EventSectionSkeleton } from "@/components/event-section"
import { FeaturesSection } from "@/components/features-section"
import { Footer } from "@/components/footer"
import { getActiveBanners, getPublishedEvents } from "@/lib/events"

export const revalidate = 60

async function EventsList({ category }: { category?: string }) {
  const events = await getPublishedEvents(undefined, category)
  return <EventSection events={events} activeCategory={category ?? "terkini"} />
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const banners = await getActiveBanners()

  return (
    <>
      <main>
        <Navbar variant="home" search />
        <div
          className="relative -mt-[60px] pt-[60px]"
          style={{ background: "linear-gradient(to bottom, #527599 0%, #D4D7D9 68%, #E5E5E5 100%)" }}
        >
          <div
            className="pointer-events-none absolute inset-x-2 md:inset-x-6 bottom-2 top-[80px] rounded-xl bg-cover bg-top bg-no-repeat"
            style={{ backgroundImage: "url('/hero-desktop.webp')" }}
          />
          <HeroSection />
          <FeaturedCarousel slides={banners} />
        </div>
        <Suspense fallback={<EventSectionSkeleton />}>
          <EventsList category={category} />
        </Suspense>
        <FeaturesSection />
      </main>
      <Footer />
    </>
  )
}
