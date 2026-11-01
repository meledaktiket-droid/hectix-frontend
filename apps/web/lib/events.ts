import type { EventItem } from "@/components/event-card"
import { api } from "@/lib/api"

export type EventSuggestion = {
  id: string
  name: string
  city: string | null
  organizationName: string
  bannerUrl: string | null
}

export type BannerSlide = {
  id: string
  tag: string
  description: string
  imageUrl: string
}

function withParams(path: string, params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v)
  const s = qs.toString()
  return s ? `${path}?${s}` : path
}

export function getPublishedEvents(searchTerm?: string, category?: string): Promise<EventItem[]> {
  return api<EventItem[]>(withParams("/api/events/published", { q: searchTerm?.trim(), category }))
}

export function searchEventSuggestions(searchTerm: string): Promise<EventSuggestion[]> {
  return api<EventSuggestion[]>(withParams("/api/search", { q: searchTerm.trim() }))
}

export function getActiveBanners(): Promise<BannerSlide[]> {
  return api<BannerSlide[]>("/api/banners")
}
