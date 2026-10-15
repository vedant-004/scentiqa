import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Playfair_Display, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui";
import { AuthProvider } from "@/components/auth";
import { Footer, Header, MobileBottomNav } from "@/components/layout";
import { getSiteStats, getBanner } from "@/lib/data";
import { SITE_URL } from "@/lib/site-url";
import { PwaRegister } from "./pwa-register";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap" });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["500", "600", "700"], display: "swap" });

// Applies saved/OS theme BEFORE first paint — no white flash in dark mode.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('scentarchy-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Scentarchy — India's Perfume Encyclopedia & Dupe Finder", template: "%s | Scentarchy" },
  description: "Discover perfumes in India: honest reviews, dupe matches, INR prices from Indian sellers, and heat-performance scores for Indian weather.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    siteName: "Scentarchy",
    locale: "en_IN",
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630, alt: "Scentarchy — India's Perfume Encyclopedia" }],
  },
  twitter: { card: "summary_large_image", site: "@scentarchy", title: "Scentarchy — India's Perfume Encyclopedia & Dupe Finder", description: "Discover perfumes in India: honest reviews, dupe matches, INR prices from Indian sellers, and heat-performance scores for Indian weather." },
  themeColor: "#F01348",
  icons: { apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Scentarchy" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const stats = await getSiteStats();
  const banner = await getBanner().catch(() => ({ text: '', link: '', enabled: false }));
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col floral-bg">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-stone-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">Skip to main content</a>
        <PwaRegister />
        <ToastProvider>
          <AuthProvider>
            {banner.enabled && banner.text && (
              <div className="bg-gold-700 px-4 py-2 text-center text-sm font-semibold text-white dark:bg-gold-600">
                {banner.link ? (
                  banner.link.startsWith('/') ? (
                    <Link href={banner.link} className="underline decoration-white/50 underline-offset-2 hover:decoration-white">{banner.text}</Link>
                  ) : (
                    <a href={banner.link} className="underline decoration-white/50 underline-offset-2 hover:decoration-white">{banner.text}</a>
                  )
                ) : (
                  banner.text
                )}
              </div>
            )}
            <Header stats={stats} />
            <main id="main-content" className="flex-1 pb-20 md:pb-0">{children}</main>
            <Footer stats={stats} />
            <MobileBottomNav />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
