// Maps a perfume note name to its encyclopedia slug, or null if the note has no page.
import metas from '../public/ml/ml-notes-list.json';

const byName = new Map<string, string>(
  (metas as Array<{ slug: string; name: string }>).map((m) => [m.name.toLowerCase().trim(), m.slug]),
);

export function noteSlug(name: string): string | null {
  return byName.get(name.toLowerCase().trim()) ?? null;
}
