import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Hectix Admin",
    template: "%s · Hectix Admin",
  },
  description: "Hectix platform administration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className={geist.className}>{children}</body>
    </html>
  );
}
