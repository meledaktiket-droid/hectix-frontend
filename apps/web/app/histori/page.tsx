import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HistoriTabs } from "@/components/histori/histori-tabs"
import { HistoriClient } from "@/components/histori/histori-client"
import { SignInGate } from "@/components/sign-in-gate"
import { getSession } from "@/lib/api"

export default async function HistoriPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await getSession()

  if (!session) {
    return (
      <>
        <Navbar variant="home" />
        <SignInGate
          title="Masuk untuk melihat histori"
          description="Tiket dan event favoritmu tersimpan di akunmu. Masuk untuk melihatnya."
          callbackURL="/histori"
        />
        <Footer />
      </>
    )
  }

  const { tab } = await searchParams
  const active = tab === "selesai" || tab === "favorit" ? tab : "aktif"

  return (
    <>
      <Navbar variant="home" />
      <div className="mx-4 md:mx-10 pt-6 pb-16">
        <div className="mt-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0C2D57]">Histori</h1>
          <p className="text-neutral-600 mt-1">
            Temukan kembali tiket yang pernah Anda beli dan event yang Anda sukai — semuanya tersimpan di sini.
          </p>
        </div>
        <div className="mt-6">
          <HistoriTabs active={active} />
        </div>
        <div className="mt-6 rounded-2xl bg-white/60 p-4">
          <HistoriClient tab={active} />
        </div>
      </div>
      <Footer />
    </>
  )
}
