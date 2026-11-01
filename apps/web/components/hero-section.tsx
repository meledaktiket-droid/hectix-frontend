export function HeroSection() {
  return (
    <section className="relative flex min-h-[440px] flex-col items-center justify-center overflow-hidden pb-24 text-center">
      <div className="relative z-10 flex flex-col items-center px-8 py-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="mb-5 flex h-[88px] w-[88px] items-center justify-center overflow-hidden">
          <img src="/logo-white.png" alt="hectix" className="w-full scale-[4.4]" />
        </div>
        <h1 className="font-ibm text-[36px] md:text-[56px] font-bold leading-[64px] text-[#0C2D57]">
          Find Your Crowd
        </h1>
        <p
          className="mt-4 max-w-xl text-[14px] md:text-[18px] font-semibold leading-[28px] text-[#FAFAFA]"
          style={{ fontFamily: "var(--font-pretendard)" }}
        >
          Kami menghubungkan kamu dengan energi panggung,<br />
          keramaian festival, dan cerita yang akan kamu ingat selamanya.
        </p>
      </div>
    </section>
  )
}
