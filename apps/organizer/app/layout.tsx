import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Providers } from "./providers";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Hectix",
    template: "%s · Hectix",
  },
  description: "Event management for organizers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className={geist.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
