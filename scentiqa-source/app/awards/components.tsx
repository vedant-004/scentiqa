import type { AwardNominee } from '@/lib/types';

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join('');
}

export function NomineeImg({ nominee, boxClass, textClass }: { nominee: AwardNominee; boxClass: string; textClass: string }) {
  if (nominee.kind === 'perfume' && nominee.image) {
    return (
      <span className={`flex items-center justify-center overflow-hidden ${boxClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={nominee.image} alt={nominee.name} loading="lazy" className="h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <span className={`flex items-center justify-center bg-gradient-to-br from-gold-500/30 to-gold-700/30 ${boxClass}`}>
      <span className={`font-display font-bold text-gold-700 dark:text-gold-300 ${textClass}`}>{initials(nominee.name)}</span>
    </span>
  );
}

export function nomineeHref(n: AwardNominee) {
  return n.kind === 'house' ? `/house/${n.slug}` : `/perfume/${n.slug}`;
}
