import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PrivacyContent, privacyToc } from "@/components/help/privacy-content"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <>
      <Navbar title="Kebijakan Privasi" variant="home" />
      <div className="-mt-[60px] pb-16">
        <div className="mx-auto max-w-6xl px-4 pt-[88px]">
          <nav className="text-sm text-neutral-500">
            <Link href="/help" className="hover:underline">
              Bantuan
            </Link>
            <span className="mx-1.5 text-neutral-400">›</span>
            <span className="font-semibold text-[#0C2D57]">Kebijakan Privasi</span>
          </nav>

          <h1 className="mt-3 text-3xl font-bold text-[#0C2D57] md:text-[40px] md:leading-tight">
            Kebijakan Privasi
          </h1>

          <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
            <aside className="h-max lg:sticky lg:top-24">
              <nav className="rounded-2xl bg-[#F2F2F3] p-6 shadow-[0_4px_20px_rgba(12,45,87,0.05)]">
                <h2 className="text-lg font-bold text-[#0C2D57]">Daftar Isi</h2>
                <ol className="mt-4 space-y-3 text-[15px] text-neutral-700">
                  {privacyToc.map((t, i) => (
                    <li key={t}>
                      <a
                        href={`#sec-${i + 1}`}
                        className="flex gap-2 transition-colors hover:text-[#0C2D57]"
                      >
                        <span className="shrink-0 tabular-nums">{i + 1}.</span>
                        <span>{t}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>

            <div className="rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(12,45,87,0.05)] md:p-10">
              <PrivacyContent />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
