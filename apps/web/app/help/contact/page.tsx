import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ContactCards } from "@/components/help/contact-cards"
import Link from "next/link"

export default function ContactPage() {
  return (
    <>
      <Navbar title="Hubungi Kami" variant="home" />
      <div className="-mt-[60px] pb-16">
        <div className="mx-auto max-w-2xl px-4 pt-[88px]">
          <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(12,45,87,0.06)]">
            <div className="bg-gradient-to-b from-[#E8F0FB] to-white px-6 pb-8 pt-7 md:px-10">
              <nav className="text-sm text-neutral-500">
                <Link href="/help" className="hover:underline">
                  Bantuan
                </Link>
                <span className="mx-1.5 text-neutral-400">›</span>
                <span className="font-semibold text-[#0C2D57]">Hubungi Kami</span>
              </nav>
              <h1 className="mt-3 text-3xl font-bold text-[#0C2D57] md:text-4xl">Hubungi Kami</h1>
            </div>

            <div className="px-6 pb-8 md:px-10">
              <ContactCards />
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
