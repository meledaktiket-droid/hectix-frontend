import { Geist_Mono, Inter } from "next/font/google"
import localFont from "next/font/local"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { BottomNav } from "@/components/bottom-nav"
import { Providers } from "./providers"
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const fontHeading = localFont({
  src: [
    { path: "../public/fonts/IBMPlexSansKR-Medium.ttf", weight: "500" },
    { path: "../public/fonts/IBMPlexSansKR-SemiBold.ttf", weight: "600" },
    { path: "../public/fonts/IBMPlexSansKR-Bold.ttf", weight: "700" },
  ],
  variable: "--font-ibm",
})

const fontPretendard = localFont({
  src: [
    { path: "../public/fonts/Pretendard-Medium.otf", weight: "500" },
    { path: "../public/fonts/Pretendard-SemiBold.otf", weight: "600" },
    { path: "../public/fonts/Pretendard-Bold.otf", weight: "700" },
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
      lang="en"
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
