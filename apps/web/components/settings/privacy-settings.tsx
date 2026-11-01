"use client"

import { useState } from "react"

const OPTIONS = [
  { key: "asalKota", label: "Tampilkan Asal Kota", default: true },
  { key: "sosmed", label: "Tampilkan Akun Sosmed", default: false },
  { key: "email", label: "Tampilkan Alamat Email", default: false },
  { key: "tahunBergabung", label: "Tampilkan Tahun Bergabung", default: false },
  { key: "eventStat", label: "Tampilkan Event Stat", default: false },
  { key: "badges", label: "Tampilkan Badges", default: false },
] as const

type Key = (typeof OPTIONS)[number]["key"]

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-[#2a8af6]" : "bg-neutral-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )
}

export function PrivacySettings() {
  const [state, setState] = useState<Record<Key, boolean>>(
    () => Object.fromEntries(OPTIONS.map((o) => [o.key, o.default])) as Record<Key, boolean>
  )
  const [saved, setSaved] = useState(false)

  const toggle = (k: Key) => {
    setState((s) => ({ ...s, [k]: !s[k] }))
    setSaved(false)
  }

  return (
    <div>
      <div className="space-y-3">
        {OPTIONS.map((o) => (
          <div
            key={o.key}
            className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-100 bg-white px-5 py-4 shadow-[0_4px_20px_rgba(12,45,87,0.05)] md:px-6"
          >
            <span className="text-sm font-medium text-[#0C2D57]">{o.label}</span>
            <Toggle on={state[o.key]} onClick={() => toggle(o.key)} label={o.label} />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => setSaved(true)}
          className="rounded-xl bg-[#0C2D57] px-10 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0a2547]"
        >
          Simpan Perubahan
        </button>
        {saved && <p className="text-sm text-neutral-500">Fitur ini akan segera tersedia.</p>}
      </div>
    </div>
  )
}
