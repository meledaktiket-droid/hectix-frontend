import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"
import localFont from "next/font/local"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { BottomNav } from "@/components/bottom-nav"
import { Providers } from "./providers"
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: {
    default: "Hectix — Platform Tiket Konser, Musik & Event Terbaik",
    template: "%s | Hectix",
  },
  description:
    "Temukan dan beli tiket konser, festival musik, seni budaya, edukasi, dan acara seru lainnya dengan mudah dan aman di Hectix.",
  openGraph: {
    title: "Hectix — Platform Tiket Konser, Musik & Event Terbaik",
    description:
      "Temukan dan beli tiket konser, festival musik, seni budaya, edukasi, dan acara seru lainnya dengan mudah dan aman di Hectix.",
    siteName: "Hectix",
    locale: "id_ID",
    type: "website",
  },
}

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const fontHeading = localFont({
  src: [
    { path: "../public/fonts/IBMPlexSansKR-Medium.woff2", weight: "500" },
    { path: "../public/fonts/IBMPlexSansKR-SemiBold.woff2", weight: "600" },
    { path: "../public/fonts/IBMPlexSansKR-Bold.woff2", weight: "700" },
  ],
  variable: "--font-ibm",
})

const fontPretendard = localFont({
  src: [
    { path: "../public/fonts/Pretendard-Medium.woff2", weight: "500" },
    { path: "../public/fonts/Pretendard-SemiBold.woff2", weight: "600" },
    { path: "../public/fonts/Pretendard-Bold.woff2", weight: "700" },
  ],
  variable: "--font-pretendard",
})

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode
  modal: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn("antialiased", fontPretendard.variable, fontMono.variable, inter.variable, fontHeading.variable, "font-sans")}
    >
      <body>
        <Providers>
          <ThemeProvider>{children}</ThemeProvider>
          {modal}
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
