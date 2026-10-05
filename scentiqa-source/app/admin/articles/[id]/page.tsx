import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase';
import { updateArticle, deleteArticle } from '../../actions';
import { ArticleForm } from '../form';
import { DeleteConfirm } from './delete-form';
import { SectionTitle } from '../../components';

export const metadata = { title: 'Edit article · Admin' };

export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getSupabaseServer(true)!;
  const { data: a } = await c.from('articles').select('*').eq('id', id).maybeSingle();
  if (!a) notFound();
  const update = updateArticle.bind(null, id);
  const del = deleteArticle.bind(null, id);

  return (
    <div>
      <SectionTitle action={a.is_published ? <Link href={`/news/${a.slug}`} className="text-sm font-bold text-gold-700 hover:underline dark:text-gold-300">View live →</Link> : undefined}>
        Edit · {a.title}
      </SectionTitle>
      <ArticleForm initial={a} action={update} submitLabel="Save changes" />
      <DeleteConfirm title={a.title} action={del} />
    </div>
  );
}
