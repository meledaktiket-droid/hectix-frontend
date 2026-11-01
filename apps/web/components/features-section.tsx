import { Camera, Users, Puzzle } from "lucide-react"

const features = [
  {
    icon: Camera,
    title: "Bukan Cuma Tiket, Tapi Pengalaman",
    desc: "Setiap event dimulai dari cara kamu menemukannya hingga momen setelah acara selesai.",
  },
  {
    icon: Users,
    title: "Interaksi nyata antar penonton",
    desc: "Bangun koneksi dan ciptakan hype dengan audience lain yang datang ke event yang sama.",
  },
  {
    icon: Puzzle,
    title: "Platform untuk audience & promotor",
    desc: "Menghubungkan pengalaman audience dengan kebutuhan promotor dalam satu ekosistem.",
  },
]

export function FeaturesSection() {
  return (
    <section className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl rounded-3xl bg-[#0C2D57] px-8 py-16 text-white md:px-16">
        <h2 className="mb-12 text-center text-2xl font-bold">
          Mulai Keseruanmu di Hectix
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title}>
              <f.icon className="mb-6 h-8 w-8 text-white" strokeWidth={1.5} />
              <h3 className="mb-6 text-lg font-bold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-white/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
