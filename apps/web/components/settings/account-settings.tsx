"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const COMING_SOON = "Fitur ini akan segera tersedia."

function Field({
  label,
  type = "text",
  placeholder,
}: {
  label: string
  type?: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#0C2D57]">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-800 outline-none transition-colors placeholder:text-neutral-400 focus:border-[#0C2D57]/40 focus:ring-2 focus:ring-[#0C2D57]/10"
      />
    </label>
  )
}

function AccordionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-[0_4px_20px_rgba(12,45,87,0.05)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left md:px-6"
      >
        <span className="text-sm font-semibold text-[#0C2D57]">{title}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-neutral-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && <div className="border-t border-neutral-100 px-5 pb-5 pt-4 md:px-6">{children}</div>}
    </div>
  )
}

function StubButton({ children }: { children: React.ReactNode }) {
  const [clicked, setClicked] = useState(false)
  return (
    <div>
      <button
        type="button"
        onClick={() => setClicked(true)}
        className="rounded-full bg-[#0C2D57] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2547]"
      >
        {children}
      </button>
      {clicked && <p className="mt-3 text-sm text-neutral-500">{COMING_SOON}</p>}
    </div>
  )
}

function ChangePhone() {
  return (
    <div className="space-y-4">
      <Field label="Nomor telepon baru" type="tel" placeholder="+62 8xx xxxx xxxx" />
      <p className="text-xs text-neutral-500">Kami akan mengirim kode OTP untuk verifikasi.</p>
      <StubButton>Kirim OTP</StubButton>
    </div>
  )
}

function ChangePassword() {
  return (
    <div className="space-y-4">
      <Field label="Kata sandi saat ini" type="password" placeholder="••••••••" />
      <Field label="Kata sandi baru" type="password" placeholder="••••••••" />
      <Field label="Konfirmasi kata sandi baru" type="password" placeholder="••••••••" />
      <StubButton>Simpan</StubButton>
    </div>
  )
}

function DeleteAccount() {
  const [open, setOpen] = useState(false)
  const [clicked, setClicked] = useState(false)
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-[0_4px_20px_rgba(12,45,87,0.05)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center px-5 py-4 text-left md:px-6"
      >
        <span className="text-sm font-semibold text-[#0C2D57]">Hapus Akun</span>
      </button>
      {open && (
        <div className="border-t border-neutral-100 px-5 pb-5 pt-4 md:px-6">
          <p className="text-sm text-neutral-600">
            Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Semua data akun Anda akan
            dihapus.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setClicked(true)}
              className="rounded-full bg-[#e92a67] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d11f59]"
            >
              Hapus Akun Permanen
            </button>
            {clicked && <p className="mt-3 text-sm text-neutral-500">{COMING_SOON}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export function AccountSettings() {
  return (
    <div className="space-y-3">
      <AccordionCard title="Ganti Nomor Telpon">
        <ChangePhone />
      </AccordionCard>
      <AccordionCard title="Ganti Kata Sandi">
        <ChangePassword />
      </AccordionCard>
      <DeleteAccount />
    </div>
  )
}
