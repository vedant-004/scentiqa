import { ContactPage, type ContactSettings } from '../shared';
import { getSiteSetting } from '@/lib/data-supabase';

export const metadata = { title: 'Contact us', description: 'Get in touch with the Scentiqa team.' };

export default async function Page() {
  const s = await getSiteSetting('contact');
  const settings: ContactSettings | undefined = s
    ? {
        intro: typeof s.intro === 'string' ? s.intro : undefined,
        email: typeof s.email === 'string' ? s.email : undefined,
        phoneDisplay: typeof s.phoneDisplay === 'string' ? s.phoneDisplay : undefined,
        phoneDigits: typeof s.phoneDigits === 'string' ? s.phoneDigits : undefined,
        whatsapp: typeof s.whatsapp === 'boolean' ? s.whatsapp : undefined,
        responseNote: typeof s.responseNote === 'string' ? s.responseNote : undefined,
      }
    : undefined;
  return <ContactPage settings={settings} />;
}
