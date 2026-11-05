export default function Loading() {
  return (
    <main className="min-h-screen">
      {/* Navbar placeholder */}
      <div className="h-[60px] w-full border-b bg-background/80 backdrop-blur" />

      {/* Hero Skeleton */}
      <div
        className="relative -mt-[60px] pt-[60px] pb-12"
        style={{ background: "linear-gradient(to bottom, #527599 0%, #D4D7D9 68%, #E5E5E5 100%)" }}
      >
        <section className="relative flex min-h-[380px] flex-col items-center justify-center text-center px-4">
          <div className="mb-4 h-16 w-16 animate-pulse rounded-full bg-white/20" />
          <div className="h-10 w-64 md:w-96 animate-pulse rounded-lg bg-white/30" />
          <div className="mt-4 h-5 w-72 md:w-80 animate-pulse rounded bg-white/20" />
        </section>

        {/* Carousel Skeleton */}
        <div className="mx-auto max-w-5xl px-4 mt-4">
          <div className="h-44 md:h-64 w-full animate-pulse rounded-2xl bg-white/30" />
        </div>
      </div>

      {/* Events Skeleton */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex gap-2 pb-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-muted" />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border p-3">
              <div className="h-48 w-full animate-pulse rounded-lg bg-muted" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
