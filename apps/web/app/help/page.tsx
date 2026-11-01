import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const items = [
  { label: "Pusat Bantuan (FAQ)", href: "/help/faq" },
  { label: "Hubungi Kami", href: "/help/contact" },
  { label: "Syarat & Ketentuan", href: "/help/terms" },
  { label: "Kebijakan Privasi", href: "/help/privacy" },
]

export default function HelpPage() {
  return (
    <>
      <Navbar title="Bantuan" variant="home" />
      <div className="-mt-[60px] pb-16">
        <div className="mx-auto max-w-2xl px-4 pt-[88px]">
          <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(12,45,87,0.06)]">
            <div className="bg-gradient-to-b from-[#E8F0FB] to-white px-6 pb-8 pt-7 md:px-10">
              <nav className="text-sm text-neutral-500">
                <Link href="/profile" className="hover:underline">
                  Profil
                </Link>
                <span className="mx-1.5 text-neutral-300">/</span>
                <span className="font-semibold text-[#0C2D57]">Bantuan</span>
              </nav>
              <h1 className="mt-3 text-3xl font-bold text-[#0C2D57] md:text-4xl">Bantuan</h1>
            </div>

            <div className="space-y-3 px-6 pb-8 md:px-10">
              {items.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-5 py-4 text-sm font-medium text-[#0C2D57] transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                >
                  {label}
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-3xl bg-[#ECECEC] px-6 py-5 md:px-8">
            <div>
              <p className="max-w-md text-sm text-neutral-500">
                Temukan jawaban Anda di Pusat Bantuan, atau hubungi tim kami untuk dukungan lebih
                lanjut.
              </p>
              <p className="mt-3 text-sm font-semibold text-[#0C2D57]">Hectix.id</p>
            </div>
            <div className="h-14 w-14 shrink-0 rounded-full bg-gradient-to-br from-[#cdd6e3] via-[#9fb0c6] to-[#5b6b85]" />
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
