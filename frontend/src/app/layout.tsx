import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SiteChrome } from "@/components/layout/SiteChrome";

// Self-hosted at build time (no runtime request to Google's CDN) - used only
// by the /staff dashboard. The storefront keeps its serif display identity;
// a management screen needs a face built for scanning dense data, not one
// carrying the couture branding.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Best Choice — Clothing, Cosmetics & Accessories",
  description: "Clothing, cosmetics and mobile accessories delivered across Tamil Nadu, with store pickup at our Spencer Plaza branch in Chennai.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable}`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <SiteChrome><Header /></SiteChrome>
          <main className="flex-1">{children}</main>
          <SiteChrome><Footer /></SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
