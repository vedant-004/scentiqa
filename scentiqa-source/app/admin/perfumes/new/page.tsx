import { createPerfume } from '../../actions';
import { PerfumeForm } from '../form';
import { SectionTitle } from '../../components';

export const metadata = { title: 'Add perfume · Admin' };

export default function NewPerfume() {
  return (
    <div>
      <SectionTitle>Add a new perfume</SectionTitle>
      <p className="mb-4 text-sm text-stone-500">Slug and ID are generated from the name. Fill what you know — every field stays editable later.</p>
      <PerfumeForm action={createPerfume} submitLabel="Create perfume" />
    </div>
  );
}
