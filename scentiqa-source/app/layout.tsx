import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui";
import { AuthProvider } from "@/components/auth";
import { Footer, Header, MobileBottomNav } from "@/components/layout";
import { getStats, getBanner } from "@/lib/data";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap" });

// Applies saved/OS theme BEFORE first paint — no white flash in dark mode.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('scentiqa-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL("https://scentiqa.in"),
  title: { default: "Scentiqa — India's Perfume Encyclopedia & Dupe Finder", template: "%s | Scentiqa" },
  description: "Discover perfumes in India: honest reviews, lab-tested dupe similarity scores, INR prices from verified sellers, and climate testing for Indian heat.",
  openGraph: { type: "website", siteName: "Scentiqa", locale: "en_IN" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const stats = await getStats().catch(() => ({ perfumes: 0, houses: 0, reviews: 0, members: 0 }));
  const banner = await getBanner().catch(() => ({ text: '', link: '', enabled: false }));
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col floral-bg">
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
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
            <Footer stats={stats} />
            <MobileBottomNav />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
