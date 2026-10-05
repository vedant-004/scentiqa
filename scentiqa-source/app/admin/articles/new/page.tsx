import { createArticle } from '../../actions';
import { ArticleForm } from '../form';
import { SectionTitle } from '../../components';

export const metadata = { title: 'New article · Admin' };

export default function NewArticle() {
  return (
    <div>
      <SectionTitle>Write a new article</SectionTitle>
      <p className="mb-4 text-sm text-stone-500">Slug and ID are generated from the title. Uncheck “Published” to save as a draft.</p>
      <ArticleForm action={createArticle} submitLabel="Create article" />
    </div>
  );
}
