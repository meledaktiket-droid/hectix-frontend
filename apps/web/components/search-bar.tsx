"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Search, Loader2 } from "lucide-react"

type Suggestion = {
  id: string
  name: string
  city: string | null
  organizationName: string
  bannerUrl: string | null
}

export function SearchBar({
  className = "",
  defaultValue = "",
}: {
  className?: string
  defaultValue?: string
}) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)
  const [debounced, setDebounced] = useState(defaultValue.trim())
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value.trim()), 250)
    return () => clearTimeout(t)
  }, [value])

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debounced)}`)
      if (!res.ok) return []
      return res.json() as Promise<Suggestion[]>
    },
    enabled: debounced.length >= 2,
    staleTime: 30 * 1000,
  })

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  function goToResults() {
    const q = value.trim()
    setOpen(false)
    router.push(q ? `/events?q=${encodeURIComponent(q)}` : "/events")
  }

  function goToEvent(id: string) {
    setOpen(false)
    router.push(`/events/${id}`)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.min(h + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, -1))
    } else if (e.key === "Enter") {
      if (highlight >= 0 && results[highlight]) goToEvent(results[highlight].id)
      else goToResults()
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const showDropdown = open && debounced.length >= 2

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2 rounded-full bg-black/[0.04] px-3 py-1.5 ring-1 ring-black/[0.06] focus-within:ring-black/15">
        <Search className="h-4 w-4 shrink-0 text-neutral-400" />
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setOpen(true)
            setHighlight(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Cari acara, kota, atau venue..."
          className="w-full bg-transparent text-sm text-[#0C2D57] placeholder:text-neutral-400 focus:outline-none"
        />
        {isFetching && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-neutral-300" />}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/[0.06]">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-neutral-400">
              {isFetching ? "Mencari..." : `Tidak ada hasil untuk "${debounced}"`}
            </p>
          ) : (
            <>
              {results.map((r, i) => (
                <button
                  key={r.id}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => goToEvent(r.id)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${
                    i === highlight ? "bg-neutral-50" : ""
                  }`}
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {r.bannerUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.bannerUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#0C2D57]">{r.name}</p>
                    <p className="truncate text-xs text-neutral-400">
                      {r.organizationName}
                      {r.city ? ` · ${r.city}` : ""}
                    </p>
                  </div>
                </button>
              ))}
              <button
                onClick={goToResults}
                className="block w-full border-t border-neutral-100 px-4 py-2.5 text-left text-sm font-medium text-[#9E3C77] hover:bg-neutral-50"
              >
                Lihat semua hasil →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
