import Link from 'next/link';
import { Card, SectionHeading } from '@/components/ui';
import { Breadcrumbs } from '@/components';
import { PerfumeCard } from '@/components/domain';

// 2026 Awards — Ultimate Winner: My Perfume Secrets Tygar
// Best Clone of Bvlgari Tygar

export default function Awards2026Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Awards', href: '/awards/2026' }, { label: '2026' }]} />
      <SectionHeading kicker="Scentiqa Awards" title="2026 Ultimate Winner" />
      
      <Card className="mb-8 overflow-hidden">
        <div className="bg-gradient-to-br from-gold-600/20 via-gold-500/10 to-transparent p-8 sm:p-12 text-center">
          <p className="mb-2 text-6xl">🏆</p>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-300">
            Ultimate Winner 2026
          </p>
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            My Perfume Secrets Tygar
          </h2>
          <p className="mt-3 text-lg text-stone-600 dark:text-stone-300">
            Best Clone of Bvlgari Tygar
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold-600/15 px-6 py-2.5">
            <span className="text-2xl">⭐</span>
            <span className="font-bold text-gold-700 dark:text-gold-300">Scentiqa's Choice 2026</span>
          </div>
        </div>
        
        <div className="p-8 sm:p-12">
          <h3 className="mb-4 font-display text-2xl font-bold">Why Tygar Won</h3>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl bg-stone-100/70 p-6 dark:bg-white/[0.04]">
              <p className="mb-2 text-3xl">🎯</p>
              <h4 className="mb-2 font-bold">Uncanny Accuracy</h4>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Captures the grapefruit-ginger-ambroxan DNA of Bvlgari Tygar with remarkable fidelity.
              </p>
            </div>
            <div className="rounded-2xl bg-stone-100/70 p-6 dark:bg-white/[0.04]">
              <p className="mb-2 text-3xl">💰</p>
              <h4 className="mb-2 font-bold">Incredible Value</h4>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Luxury niche experience at a fraction of the designer price. True democratization of perfumery.
              </p>
            </div>
            <div className="rounded-2xl bg-stone-100/70 p-6 dark:bg-white/[0.04]">
              <p className="mb-2 text-3xl">⚡</p>
              <h4 className="mb-2 font-bold">Beast Performance</h4>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Long-lasting longevity and powerful sillage that rivals the original.
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Link 
              href="/house/my-perfume-secrets"
              className="inline-block rounded-full bg-gold-600 px-8 py-3 font-bold text-white hover:bg-gold-700 transition-colors"
            >
              Explore My Perfume Secrets →
            </Link>
          </div>
        </div>
      </Card>
      
      <Card className="p-8 text-center">
        <p className="text-stone-500 dark:text-stone-400">
          The 2026 Scentiqa Awards celebrate the finest Indian clone fragrances.
          <br />
          <span className="font-semibold text-stone-700 dark:text-stone-200">
            My Perfume Secrets Tygar stands alone as this year's ultimate winner.
          </span>
        </p>
      </Card>
    </div>
  );
}
