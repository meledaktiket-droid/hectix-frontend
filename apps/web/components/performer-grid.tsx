type Performer = {
  name: string
  image: string
}

export function PerformerGrid({ performers }: { performers: Performer[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-x-30 md:gap-y-3">
      {performers.map((p, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-border bg-[#A6A6A6] p-1"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image}
            alt={p.name}
            className="h-12 w-12 rounded-md object-cover shrink-0"
          />
          <span className="text-sm  font-bold text-[#1F1F1F] pr-4 ">{p.name}</span>
        </div>
      ))}
    </div>
  )
}
