import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Perfume Personality Quiz: Find Your Signature Scent",
  description: "Take the 5-question Scentarchy quiz and discover perfumes matched to your personality, with INR prices from Indian sellers.",
  alternates: { canonical: `${SITE_URL}/quiz` },
  openGraph: {
    title: "Perfume Personality Quiz: Find Your Signature Scent | Scentarchy",
    description: "Discover your signature scent in 5 questions.",
    url: `${SITE_URL}/quiz`,
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children;
}
