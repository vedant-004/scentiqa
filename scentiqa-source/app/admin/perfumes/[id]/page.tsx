import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase';
import { updatePerfume, deletePerfume } from '../../actions';
import { PerfumeForm } from '../form';
import { DeleteConfirm } from './delete-form';
import { SectionTitle } from '../../components';

export const metadata = { title: 'Edit perfume · Admin' };

export default async function EditPerfume({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getSupabaseServer(true)!;
  const { data: p } = await c.from('perfumes').select('*').eq('id', id).maybeSingle();
  if (!p) notFound();
  const update = updatePerfume.bind(null, id);
  const del = deletePerfume.bind(null, id);

  return (
    <div>
      <SectionTitle action={<Link href={`/perfume/${p.slug}`} className="text-sm font-bold text-gold-700 hover:underline dark:text-gold-300">View live page →</Link>}>
        Edit · {p.name}
      </SectionTitle>
      <PerfumeForm initial={p} action={update} submitLabel="Save changes" />
      <DeleteConfirm name={p.name} action={del} />
    </div>
  );
}
