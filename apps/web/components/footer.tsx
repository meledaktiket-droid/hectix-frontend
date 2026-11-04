"use client"

import { Mail, Instagram, Music2 } from "lucide-react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

type Social = { href: string; Icon: typeof Mail; external: boolean; label: string }
type FooterLink = { label: string; href?: string; external?: boolean }

export function Footer({ showUpper = true }: { showUpper?: boolean }) {
  const { data } = useQuery<{
    contactEmail: string
    instagramUrl: string
    tiktokUrl: string
    whatsappNumber: string
  }>({
    queryKey: ["config"],
    queryFn: ({ signal }) => fetch("/api/config", { signal }).then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  })

  const waHref = data?.whatsappNumber
    ? `https://wa.me/${data.whatsappNumber}?text=${encodeURIComponent(
        "Halo, saya tertarik untuk membuat acara di Hectix."
      )}`
    : undefined

  const columns: { heading: string; items: FooterLink[] }[] = [
    {
      heading: "Jelajahi",
      items: [
        { label: "Jelajahi Acara", href: "/events" },
        { label: "Acara Terdekat", href: "/events" },
        { label: "Acara Populer", href: "/events" },
        { label: "Kategori Acara", href: "/events" },
      ],
    },
    {
      heading: "Pengguna",
      items: [
        { label: "Cara Beli Tiket" },
        { label: "Metode Pembayaran" },
        { label: "FAQ", href: "/help/faq" },
        { label: "Syarat & Ketentuan", href: "/help/terms" },
        { label: "Kebijakan Privasi", href: "/help/privacy" },
      ],
    },
    {
      heading: "Promotor",
      items: [
        { label: "Daftarkan Acara", href: waHref, external: true },
        { label: "Fitur Untuk Promotor" },
        { label: "Bantuan Promotor" },
        { label: "Hubungi Tim", href: waHref, external: true },
      ],
    },
  ]

  const socials = (
    [
      data?.contactEmail && { href: `mailto:${data.contactEmail}`, Icon: Mail, external: false, label: "Email Hectix" },
      data?.instagramUrl && { href: data.instagramUrl, Icon: Instagram, external: true, label: "Instagram Hectix" },
      data?.tiktokUrl && { href: data.tiktokUrl, Icon: Music2, external: true, label: "TikTok Hectix" },
    ] as (Social | "" | undefined)[]
  ).filter(Boolean) as Social[]

  return (
    <footer>
      {showUpper && <div className="bg-[#F2F2F2] px-6 py-10 md:px-16 md:py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark-croud.png" alt="Hectix" className="h-14" />
          </div>

          {columns.map(({ heading, items }) => (
            <div key={heading}>
              <h4 className="mb-4 text-base font-bold text-[#0C2D57]">{heading}</h4>
              <ul className="space-y-3">
                {items.map((item) => {
                  const cls = "text-sm text-[#0C2D57] hover:opacity-70 transition-opacity"
                  return (
                    <li key={item.label}>
                      {!item.href ? (
                        <span className={cls}>{item.label}</span>
                      ) : item.external ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
                          {item.label}
                        </a>
                      ) : (
                        <Link href={item.href} prefetch={false} className={cls}>
                          {item.label}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>}

      <div className="bg-[#0C2D57] px-6 py-4 md:px-16 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white">Hectix. All right reserved. 2026</p>
        <div className="flex items-center gap-4">
          {socials.map(({ href, Icon, external, label }) => (
            <a
              key={href}
              href={href}
              aria-label={label}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="text-white hover:opacity-70 transition-opacity"
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
