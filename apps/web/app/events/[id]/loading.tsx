export default function EventLoading() {
  return (
    <main className="min-h-screen">
      <div className="h-[60px] w-full border-b bg-background" />
      <div className="mx-6 md:mx-10 pt-6">
        <div className="md:grid md:grid-cols-7 md:gap-8 mt-2 md:mt-5">
          <div className="col-span-3 md:w-96 md:mx-auto">
            <div className="aspect-square w-full animate-pulse rounded-2xl bg-muted" />
          </div>
          <div className="col-span-4 space-y-4 px-4 py-5 md:px-8">
            <div className="h-10 w-3/4 animate-pulse rounded-lg bg-muted" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-44 w-full animate-pulse rounded-2xl bg-muted mt-6" />
          </div>
        </div>
      </div>
    </main>
  )
}
