"use client"

import { useState, useRef, useEffect } from "react"
import { User, Home, Clock, Shield, Settings, HelpCircle, LogOut, Menu } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { authClient } from "@/lib/auth-client"
import { SearchBar } from "@/components/search-bar"

export function Navbar({ title, variant = "default", search = false }: { title?: string, variant?: "default" | "home", search?: boolean }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
  })

  const user = session?.data?.user ?? null

  const { data: config } = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const res = await fetch("/api/config")
      return res.json() as Promise<{ whatsappNumber: string, serviceFee: number, taxPercent: number }>
    },
    staleTime: 5 * 60 * 1000,
  })

  const whatsappNumber = config?.whatsappNumber ?? ""
  const buatAcaraHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Halo, saya tertarik untuk membuat acara di Hectix.")}`
    : "/organizer"

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const TOP_THRESHOLD = 8
    const SCROLL_DELTA = 6
    function onScroll() {
      const y = window.scrollY
      const atTop = y <= TOP_THRESHOLD
      setScrolled(!atTop)
      if (atTop) {
        setHidden(false)
      } else if (Math.abs(y - lastY.current) > SCROLL_DELTA) {
        setHidden(y > lastY.current)
      }
      lastY.current = y
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className="pointer-events-none sticky top-0 z-50 h-[60px] w-full"
      style={{
        transform: hidden ? "translateY(-110%)" : "translateY(0)",
        transition: "transform 260ms cubic-bezier(0.33, 1, 0.68, 1)",
        willChange: "transform",
      }}
    >
      <div
        className={`absolute inset-x-0 top-0 ${scrolled ? "px-0 pt-0" : "px-6 md:px-10 pt-4"} ${hidden ? "" : "pointer-events-auto"}`}
        style={{ transition: "padding 260ms cubic-bezier(0.33, 1, 0.68, 1)" }}
      >
      <div
        className={`${scrolled
          ? "rounded-none border-b border-black/[0.06] shadow-none"
          : "rounded-full ring-1 ring-black/[0.04] shadow-[0_8px_30px_rgba(12,45,87,0.08)]"
          }`}
        style={{
          backgroundColor: scrolled ? "RGBA(255,255,255,0.92)" : "RGBA(255,255,255,0.88)",
          transition: "border-radius 300ms ease-out, background-color 300ms ease-out, box-shadow 300ms ease-out",
        }}
      >
        <div
          className={`relative flex items-center justify-between ${scrolled ? "h-14 px-10" : "h-11 px-4"
            }`}
          style={{ transition: "height 300ms ease-out, padding 300ms ease-out" }}
        >
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image src="/logo-dark-full.png" width={90} height={26} alt="logo" />
            </Link>
            {search && (
              <SearchBar className="hidden md:block w-56 lg:w-72" />
            )}
          </div>

          {title && (
            <span className="hidden md:block absolute left-1/2 -translate-x-1/2 text-[18px] font-bold font-ibm leading-9 tracking-[-2.1%] text-[#0C2D57]">
              {title}
            </span>
          )}

          {variant === "home" ? (
            <div className="flex items-center gap-2">
              <Link
                href={buatAcaraHref}
                {...(whatsappNumber ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="hidden md:flex cursor-pointer items-center gap-1.5 mr-2 text-sm font-bold text-[#ED5AB3] hover:opacity-80"
              >
                <svg className="h-4 w-auto shrink-0" viewBox="0 0 26 17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M17.5 14C19.1139 14 20.4898 13.4311 21.6277 12.2932C22.7656 11.1553 23.3341 9.77978 23.3333 8.16667C23.3326 6.55356 22.7636 5.17806 21.6265 4.04017C20.4894 2.90228 19.1139 2.33333 17.5 2.33333C16.975 2.33333 16.4648 2.40139 15.9693 2.5375C15.4739 2.67361 15.0119 2.86806 14.5833 3.12083C15.1472 3.82083 15.5801 4.59861 15.8818 5.45417C16.1836 6.30972 16.3341 7.21389 16.3333 8.16667C16.3326 9.11944 16.1821 10.0236 15.8818 10.8792C15.5816 11.7347 15.1488 12.5125 14.5833 13.2125C15.0111 13.4653 15.4731 13.6597 15.9693 13.7958C16.4656 13.9319 16.9758 14 17.5 14ZM12.8333 11.6667C13.2028 11.1806 13.4898 10.6408 13.6943 10.0473C13.8989 9.45389 14.0008 8.827 14 8.16667C13.9992 7.50633 13.8973 6.87944 13.6943 6.286C13.4913 5.69256 13.2043 5.15278 12.8333 4.66667C12.4639 5.15278 12.1773 5.69256 11.9735 6.286C11.7697 6.87944 11.6674 7.50633 11.6667 8.16667C11.6659 8.827 11.7682 9.45428 11.9735 10.0485C12.1788 10.6427 12.4654 11.1821 12.8333 11.6667ZM8.16667 14C8.69167 14 9.20228 13.9319 9.6985 13.7958C10.1947 13.6597 10.6563 13.4653 11.0833 13.2125C10.5194 12.5125 10.087 11.7347 9.786 10.8792C9.485 10.0236 9.33411 9.11944 9.33333 8.16667C9.33256 7.21389 9.48344 6.30972 9.786 5.45417C10.0886 4.59861 10.521 3.82083 11.0833 3.12083C10.6556 2.86806 10.1939 2.67361 9.6985 2.5375C9.20306 2.40139 8.69244 2.33333 8.16667 2.33333C6.55278 2.33333 5.17728 2.90228 4.04017 4.04017C2.90306 5.17806 2.33411 6.55356 2.33333 8.16667C2.33256 9.77978 2.9015 11.1557 4.04017 12.2943C5.17883 13.433 6.55433 14.0016 8.16667 14ZM8.16667 16.3333C5.89167 16.3333 3.962 15.5412 2.37767 13.9568C0.793334 12.3725 0.00077835 10.4424 5.71895e-07 8.16667C-0.000777206 5.89089 0.791779 3.96122 2.37767 2.37767C3.96356 0.794111 5.89322 0.00155556 8.16667 0C9.04167 0 9.87311 0.126389 10.661 0.379166C11.4489 0.631944 12.173 0.991667 12.8333 1.45833C13.4944 0.991667 14.2189 0.631944 15.0068 0.379166C15.7947 0.126389 16.6258 0 17.5 0C19.775 0 21.7051 0.792556 23.2902 2.37767C24.8753 3.96278 25.6674 5.89245 25.6667 8.16667C25.6659 10.4409 24.8737 12.3709 23.2902 13.9568C21.7066 15.5427 19.7766 16.3349 17.5 16.3333C16.625 16.3333 15.7939 16.2069 15.0068 15.9542C14.2197 15.7014 13.4952 15.3417 12.8333 14.875C12.1722 15.3417 11.4481 15.7014 10.661 15.9542C9.87389 16.2069 9.04244 16.3333 8.16667 16.3333Z" fill="currentColor" />
                </svg>
                Buat Acaramu
              </Link>

              <Link
                href={buatAcaraHref}
                {...(whatsappNumber ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="md:hidden rounded-full px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90"
                style={{ backgroundColor: "#9E3C77" }}
              >
                Buat Acara
              </Link>

              {user ? (
                <div className="relative hidden md:block" ref={dropdownRef}>
                  <button
                    onClick={() => setOpen((v) => !v)}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full text-white hover:opacity-90"
                    style={{ backgroundColor: "#0C2D57" }}
                  >
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt={user.name ?? ""} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </button>

                  {open && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white shadow-xl z-50 overflow-hidden">
                      <Link
                        href="/profile"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-4 hover:bg-neutral-50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-200 overflow-hidden">
                          {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.image} alt={user.name ?? ""} className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-neutral-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-neutral-900">{user.name}</p>
                          <p className="truncate text-xs text-neutral-500">{user.email}</p>
                        </div>
                      </Link>

                      <div className="h-px bg-neutral-100" />

                      <div className="py-1">
                        {[
                          { icon: Home, label: "Beranda", href: "/" },
                          { icon: Clock, label: "Histori Tiket", href: "/histori" },
                          { icon: Shield, label: "Privasi", href: "/privacy" },
                          { icon: Settings, label: "Setelan Akun", href: "/settings" },
                          { icon: HelpCircle, label: "Pusat Bantuan", href: "/help" },
                        ].map(({ icon: Icon, label, href }) => (
                          <Link
                            key={label}
                            href={href}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-800 hover:bg-neutral-50"
                          >
                            <Icon className="h-4 w-4 text-neutral-500" />
                            {label}
                          </Link>
                        ))}
                      </div>

                      <div className="h-px bg-neutral-100" />

                      <button
                        onClick={async () => {
                          await authClient.signOut()
                          window.location.href = "/"
                        }}
                        className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-neutral-800 hover:bg-neutral-100"
                      >
                        <LogOut className="h-4 w-4 text-neutral-500" />
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/" })}
                  className="hidden md:block cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90"
                  style={{ backgroundColor: "#0C2D57" }}
                >
                  Masuk
                </button>
              )}
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
      </div>
    </header>
  )
}
