import { Navbar } from "@/components/navbar"
import { EventSection } from "@/components/event-section"
import { Footer } from "@/components/footer"
import { SearchBar } from "@/components/search-bar"
import { getPublishedEvents } from "@/lib/events"

export const revalidate = 60

export default async function EventsPage(props: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { q, category } = await props.searchParams
  const events = await getPublishedEvents(q, category)

  return (
    <>
      <main>
        <Navbar variant="home" search />
        <div className="mt-4 min-h-screen bg-background">
          <div className="px-4 pt-2 md:hidden">
            <SearchBar defaultValue={q ?? ""} />
          </div>
          <EventSection
            events={events}
            showExplore={false}
            query={q}
            activeCategory={category ?? "terkini"}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
