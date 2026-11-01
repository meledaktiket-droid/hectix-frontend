import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FaqAccordion } from "@/components/help/faq-accordion"
import Link from "next/link"

export default function FaqPage() {
  return (
    <>
      <Navbar title="Pusat Bantuan" variant="home" />
      <div className="-mt-[60px] pb-16">
        <div className="mx-auto max-w-3xl px-4 pt-[88px]">
          <nav className="text-sm text-neutral-500">
            <Link href="/help" className="hover:underline">
              Bantuan
            </Link>
            <span className="mx-1.5 text-neutral-400">›</span>
            <span className="font-semibold text-[#0C2D57]">Pusat Bantuan (FAQ)</span>
          </nav>

          <h1 className="mt-3 text-3xl font-bold text-[#0C2D57] md:text-[40px] md:leading-tight">
            Pusat Bantuan (FAQ)
          </h1>

          <div className="mt-8">
            <FaqAccordion />
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
