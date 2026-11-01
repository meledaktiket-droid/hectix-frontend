import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { FeaturedCarousel } from "@/components/featured-carousel"
import { EventSection } from "@/components/event-section"
import { FeaturesSection } from "@/components/features-section"
import { Footer } from "@/components/footer"
import { getActiveBanners, getPublishedEvents } from "@/lib/events"

export const revalidate = 60

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const [events, banners] = await Promise.all([
    getPublishedEvents(undefined, category),
    getActiveBanners(),
  ])

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
            style={{ backgroundImage: "url('/hero-desktop.png')" }}
          />
          <HeroSection />
          <FeaturedCarousel slides={banners} />
        </div>
        <EventSection events={events} activeCategory={category ?? "terkini"} />
        <FeaturesSection />
      </main>
      <Footer />
    </>
  )
}
