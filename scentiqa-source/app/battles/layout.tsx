import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Fragrance Battles: Vote for India's Favourite Perfumes",
  description: "Weekly perfume tournaments — vote for your favourites, see live brackets, and discover new fragrances the community loves.",
  alternates: { canonical: `${SITE_URL}/battles` },
  openGraph: {
    title: "Fragrance Battles: Vote for India's Favourite Perfumes | Scentarchy",
    description: "Weekly perfume tournaments voted by the Indian fragrance community.",
    url: `${SITE_URL}/battles`,
  },
};

export default function BattlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
