import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui";
import { Footer, Header, MobileBottomNav } from "@/components/layout";
import { getStats } from "@/lib/data";

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
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col floral-bg">
        <ToastProvider>
          <Header stats={stats} />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <Footer stats={stats} />
          <MobileBottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
