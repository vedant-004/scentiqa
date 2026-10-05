import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Browse all sections of Scentiqa.',
};

const SECTIONS: { href: string; label: string; desc: string }[] = [
  { href: '/find-alternative', label: 'Find a Dupe', desc: 'Find a cheaper alternative to any perfume' },
  { href: '/battles', label: 'Scent Battles', desc: 'Weekly head-to-head fragrance tournaments' },
  { href: '/climate', label: 'Heat Lab', desc: 'Which perfumes survive Indian summer?' },
  { href: '/blindbuy', label: 'Blind-Buy Guide', desc: 'Safest blind buys under ₹2,000' },
  { href: '/diary', label: 'Wear Diary', desc: 'Log your scent of the day, build a streak' },
  { href: '/houses', label: 'Houses', desc: 'Browse all perfume houses' },
  { href: '/notes', label: 'Notes', desc: 'Explore the notes encyclopedia' },
  { href: '/accords', label: 'Accords', desc: 'Discover accord profiles' },
  { href: '/sellers', label: 'Sellers', desc: 'Verified Indian sellers' },
  { href: '/news', label: 'News', desc: 'Latest from the fragrance world' },
  { href: '/forum', label: 'Community', desc: 'Join the conversation' },
  { href: '/awards/2026', label: 'Awards', desc: "Scentiqa Readers' Choice Awards 2026" },
  { href: '/about', label: 'About', desc: 'Our methodology and story' },
  { href: '/contact', label: 'Contact', desc: 'Get in touch' },
];

export default function MenuPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
        Menu
      </h1>
      <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
        Browse every section of Scentiqa.
      </p>
      <nav className="mt-6 space-y-2" aria-label="Site menu">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block rounded-2xl border border-stone-200/70 bg-white/60 px-5 py-4 transition hover:border-gold-400 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]"
          >
            <span className="block text-lg font-bold text-stone-900 dark:text-white">
              {s.label}
            </span>
            <span className="mt-0.5 block text-sm text-stone-500 dark:text-stone-400">
              {s.desc}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
