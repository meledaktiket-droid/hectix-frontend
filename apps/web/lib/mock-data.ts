import { EVENT_CATEGORIES } from "@/lib/categories"

export const categories = [
  { id: "terkini", label: "Terkini" },
  ...EVENT_CATEGORIES.map((c) => ({ id: c.slug, label: c.label })),
]

export const events = [
  { id: 1, title: "Loud Fest 2025 by Spotify", venue: "PKDR Lampung, Bandar", city: "Lampung", date: "20 Juli 2024", price: "Rp150.000", image: "https://picsum.photos/seed/loud1/400/250", sponsor: "Spotify", interested: 40 },
  { id: 2, title: "Revolve Fest", venue: "Lapangan saturia Bandar", city: "Lampung", date: "20 Juli 2024", price: "Rp150.000", image: "https://picsum.photos/seed/revolve1/400/250", sponsor: "Spotify", interested: 90 },
  { id: 3, title: "Festival de Marsatac by Livin", venue: "Lapangan saturia Bandar", city: "Lampung", date: "20 Juli 2024", price: "Rp150.000", image: "https://picsum.photos/seed/marsatac1/400/250", sponsor: "Livin", interested: 40 },
  { id: 4, title: "Revolve Fest", venue: "PKDR Lampung, Bandar", city: "Lampung", date: "20 Juli 2024", price: "Rp150.000", image: "https://picsum.photos/seed/revolve2/400/250", sponsor: "Spotify", interested: 90 },
  { id: 5, title: "Festival de Marsatac by Livin", venue: "Lapangan saturia Bandar", city: "Lampung", date: "20 Juli 2024", price: "Rp150.000", image: "https://picsum.photos/seed/marsatac2/400/250", sponsor: "Livin", interested: 40 },
  { id: 6, title: "Loud Fest 2025 by Spotify", venue: "Lapangan saturia Bandar", city: "Lampung", date: "20 Juli 2024", price: "Rp150.000", image: "https://picsum.photos/seed/loud2/400/250", sponsor: "Spotify", interested: 40 },
  { id: 7, title: "Festival de Marsatac by Livin", venue: "Lapangan saturia Bandar", city: "Lampung", date: "20 Juli 2024", price: "Rp150.000", image: "https://picsum.photos/seed/marsatac3/400/250", sponsor: "Livin", interested: 40 },
  { id: 8, title: "Loud Fest 2025 by Spotify", venue: "Lapangan saturia Bandar", city: "Lampung", date: "20 Juli 2024", price: "Rp150.000", image: "https://picsum.photos/seed/loud3/400/250", sponsor: "Spotify", interested: 40 },
  { id: 9, title: "Revolve Fest", venue: "PKDR Lampung, Bandar", city: "Lampung", date: "20 Juli 2024", price: "Rp150.000", image: "https://picsum.photos/seed/revolve3/400/250", sponsor: "Spotify", interested: 90 },
]

export const featuredSlides = [
  { id: 1, tag: "Fitur komentar", description: "Diskusi real-time di setiap festival, konser, dan acara — temukan teman yang berbagi selera untuk nonton bersama.", image: "https://picsum.photos/seed/featured1/900/400", accent: "#e92a67" },
  { id: 2, tag: "Tiket Digital", description: "Beli tiket langsung dari aplikasi, scan QR di pintu masuk, dan simpan semua tiketmu di satu tempat.", image: "https://picsum.photos/seed/featured2/900/400", accent: "#2a8af6" },
  { id: 3, tag: "Rekomendasi Acara", description: "Temukan acara yang sesuai selera kamu berdasarkan genre, lokasi, dan acara yang pernah kamu hadiri.", image: "https://picsum.photos/seed/featured3/900/400", accent: "#a853ba" },
]

export type TicketTier = {
  name: string
  price: string
  badge: string
  badgeVariant: "low" | "high"
  benefits?: string[]
}

export type EventDetail = {
  id: number
  title: string
  image: string
  sponsor: string
  interested: number
  venue: string
  city: string
  date: string
  dayOfWeek: string
  description: string
  callout: string
  tickets: TicketTier[]
  performers: { name: string; image: string }[]
  peraturan: string
  kebijakan: string
}

export const eventDetails: EventDetail[] = [
  {
    id: 1,
    title: "Loud Fest 2025 by Spotify",
    image: "/spotify.png",
    sponsor: "Spotify",
    interested: 90,
    venue: "Lapangan PKOR",
    city: "Bandar Lampung, Lampung",
    date: "20 Januari 2026",
    dayOfWeek: "Selasa",
    description:
      "Come for the delicious bites and beverages, stay for the relaxing vibes and exemplary networking opportunities.\nExclusive benefits for Zircuit traders and holders!\nEnjoy free swag made just for you (limited quantities) and take part in exclusive activities!\nJoin our fun DIY Herbal Inhalant workshop, where you can mix natural herbal ingredients and create your very own signature inhalant to take home!",
    callout: "Don't miss out on this opportunity!",
    tickets: [
      {
        name: "Presale 1 (Reguler)",
        price: "Rp100.000",
        badge: "Lebih Sedikit",
        badgeVariant: "low",
        benefits: ["Berdiri", "Persediaan terbatas", "Early entry (diperbolehkan)"],
      },
      {
        name: "Presale 1 (Reguler)",
        price: "Rp100.000",
        badge: "Lebih Banyak",
        badgeVariant: "high",
      },
      {
        name: "Presale 1 (Reguler)",
        price: "Rp100.000",
        badge: "Lebih Banyak",
        badgeVariant: "high",
      },
    ],
    performers: [
      { name: "Hindia", image: "https://picsum.photos/seed/hindia1/80/80" },
      { name: "Hindia", image: "https://picsum.photos/seed/hindia2/80/80" },
      { name: "Hindia", image: "https://picsum.photos/seed/hindia3/80/80" },
      { name: "Hindia", image: "https://picsum.photos/seed/hindia4/80/80" },
      { name: "Hindia", image: "https://picsum.photos/seed/hindia5/80/80" },
      { name: "Hindia", image: "https://picsum.photos/seed/hindia6/80/80" },
    ],
    peraturan:
      "Themes: To be released on October 31, 2025\nWe're handpicking India's most ambitious builders. Not everyone makes the cut.",
    kebijakan:
      "Note: 100 individuals shall be selected for the Hackathon amongst the 1000 participants on 31st of Oct, 2025.\nThe registration includes everything mentioned above, plus the invaluable memories and connections that'll probably define your next career move.\nApply now. Make history with us.",
  },
]

export function getEventDetail(id: number): EventDetail | undefined {
  return eventDetails.find((e) => e.id === id)
}
