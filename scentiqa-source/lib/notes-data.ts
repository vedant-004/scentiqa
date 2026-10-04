// Notes encyclopedia data: maps each fragrance note to the perfumes that use it.
// Built from a single scan of the catalog; cached per request.
import { cache } from 'react';
import { getSupabaseServer } from './supabase';

export interface NotePerfumeRef {
  id: string; slug: string; name: string; house: string;
  bottleImage: string | null; ratingAvg: number;
}

export interface NoteIndexEntry {
  top: NotePerfumeRef[]; heart: NotePerfumeRef[]; base: NotePerfumeRef[];
}

const norm = (s: string) => s.toLowerCase().trim();

export interface NoteIndexData {
  index: Map<string, NoteIndexEntry>;
  /** perfume id -> set of normalized note keys used anywhere in its pyramid */
  perfumeNotes: Map<string, Set<string>>;
  /** normalized note key -> display name (first-seen casing) */
  displayNames: Map<string, string>;
}

export const getNoteIndex = cache(async (): Promise<NoteIndexData> => {
  const c = getSupabaseServer();
  const data: NoteIndexData = { index: new Map(), perfumeNotes: new Map(), displayNames: new Map() };
  if (!c) return data;
  const entry = (k: string): NoteIndexEntry => {
    let e = data.index.get(k);
    if (!e) { e = { top: [], heart: [], base: [] }; data.index.set(k, e); }
    return e;
  };
  let offset = 0;
  for (;;) {
    const { data: rows } = await c.from('perfumes')
      .select('id,slug,name,bottle_image_url,rating_avg,top_notes,heart_notes,base_notes,houses(name)')
      .range(offset, offset + 999);
    if (!rows?.length) break;
    for (const p of rows as Record<string, unknown>[]) {
      const ref: NotePerfumeRef = {
        id: p.id as string, slug: p.slug as string, name: p.name as string,
        house: ((p.houses as Record<string, string> | null)?.name) ?? '',
        bottleImage: (p.bottle_image_url as string) ?? null,
        ratingAvg: Number(p.rating_avg ?? 0),
      };
      const seen = new Set<string>();
      const push = (notes: unknown, bucket: keyof NoteIndexEntry) => {
        for (const n of (notes as string[]) ?? []) {
          const raw = String(n).trim();
          const k = norm(raw);
          if (!k) continue;
          if (!data.displayNames.has(k)) data.displayNames.set(k, raw);
          entry(k)[bucket].push(ref);
          seen.add(k);
        }
      };
      push(p.top_notes, 'top'); push(p.heart_notes, 'heart'); push(p.base_notes, 'base');
      data.perfumeNotes.set(ref.id, seen);
    }
    offset += 1000;
    if (rows.length < 1000) break;
  }
  return data;
});

export interface NoteMeta { slug: string; name: string; category: string }

export async function getNoteMetas(): Promise<NoteMeta[]> {
  try {
    const { promises: fs } = await import('fs');
    const { default: path } = await import('path');
    const raw = await fs.readFile(path.join(process.cwd(), 'public', 'ml', 'ml-notes-list.json'), 'utf8');
    return JSON.parse(raw) as NoteMeta[];
  } catch {
    return [];
  }
}

export async function getNoteDescription(slug: string): Promise<string | null> {
  try {
    const { promises: fs } = await import('fs');
    const { default: path } = await import('path');
    const raw = await fs.readFile(path.join(process.cwd(), 'public', 'ml', 'note-descriptions.json'), 'utf8');
    const map = JSON.parse(raw) as Record<string, string>;
    return map[slug] ?? null;
  } catch {
    return null;
  }
}
