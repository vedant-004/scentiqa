import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "AI Perfume Finder: Find Your Signature Scent",
  description: "Answer 10 questions and get AI-matched perfume recommendations with match scores, budget filters and Indian seller prices.",
  alternates: { canonical: `${SITE_URL}/finder` },
  openGraph: {
    title: "AI Perfume Finder: Find Your Signature Scent | Scentarchy",
    description: "Answer 10 questions and get AI-matched perfume recommendations with match scores, budget filters and Indian seller prices.",
    url: `${SITE_URL}/finder`,
    images: [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630, alt: "Scentarchy AI Perfume Finder" }],
  },
};

export default function FinderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
