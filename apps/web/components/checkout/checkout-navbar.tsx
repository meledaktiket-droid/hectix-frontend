import Image from "next/image"
import { ChevronLeft } from "lucide-react"

export function CheckoutNavbar({
  title,
  onBack,
}: {
  title: string
  onBack?: () => void
}) {
  return (
    <header
      className="w-full backdrop-blur-sm rounded-full"
      style={{ backgroundColor: "RGBA(255,255,255,0.56)" }}
    >
      <div className="relative flex h-11 items-center justify-between px-4">
        <button
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#0C2D57] transition-colors md:border md:border-border md:hover:bg-muted"
        >
          <ChevronLeft className="h-5 w-5 md:h-4 md:w-4" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[18px] leading-none md:text-[22px] md:leading-9 font-bold font-ibm tracking-[-2.1%] text-[#0C2D57]">
          {title}
        </span>
        <div className="w-[22px] overflow-hidden md:w-[72px]">
          <Image src="/logo-dark-full.png" width={72} height={20} alt="Hectix" className="max-w-none" />
        </div>
      </div>
    </header>
  )
}
