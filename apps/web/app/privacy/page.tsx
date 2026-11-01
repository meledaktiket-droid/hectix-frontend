import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PrivacySettings } from "@/components/settings/privacy-settings"
import { SignInGate } from "@/components/sign-in-gate"
import { getSession } from "@/lib/api"
import Link from "next/link"
import { ScrollText } from "lucide-react"

export default async function PrivacyPage() {
  const session = await getSession()

  if (!session) {
    return (
      <>
        <Navbar title="Privasi" variant="home" />
        <SignInGate
          title="Masuk untuk mengatur privasi"
          description="Kelola informasi apa saja yang tampil di profilmu setelah masuk."
          callbackURL="/privacy"
        />
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar title="Privasi" variant="home" />
      <div
        className="-mt-[60px] pb-16"
        style={{
          background: "linear-gradient(to bottom, #527599 0%, #D4D7D9 68%, #E5E5E5 100%)",
        }}
      >
        <div className="mx-auto max-w-2xl px-4 pt-[88px]">
          <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(12,45,87,0.06)]">
            <div className="bg-gradient-to-b from-[#E8F0FB] to-white px-6 pb-8 pt-7 md:px-10">
              <nav className="text-sm text-neutral-500">
                <Link href="/profile" className="hover:underline">
                  Profil
                </Link>
                <span className="mx-1.5 text-neutral-400">›</span>
                <span className="font-semibold text-[#0C2D57]">Privasi</span>
              </nav>
              <h1 className="mt-3 text-3xl font-bold text-[#0C2D57] md:text-4xl">Privasi</h1>
            </div>

            <div className="px-6 pb-8 pt-2 md:px-10">
              <PrivacySettings />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-3xl bg-[#ECECEC] px-6 py-5 md:px-8">
            <div>
              <p className="max-w-md text-sm text-neutral-500">
                Kelola informasi akun dan preferensi Anda di sini. Pastikan data Anda selalu terbaru
                untuk pengalaman yang lebih aman dan optimal.
              </p>
              <p className="mt-3 text-sm font-semibold text-[#0C2D57]">Hectix.id</p>
            </div>
            <ScrollText className="h-10 w-10 shrink-0 text-[#e92a67]" strokeWidth={1.5} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
