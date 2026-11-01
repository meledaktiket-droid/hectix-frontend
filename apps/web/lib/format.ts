export function formatDateID(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

export function formatDayID(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { weekday: "long" })
}

export function formatRupiah(n: number) {
  return "Rp" + n.toLocaleString("id-ID")
}
