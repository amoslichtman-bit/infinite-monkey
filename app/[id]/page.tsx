import { createClient } from '@supabase/supabase-js';
import PlayableText from '../components/PlayableText';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function WorkPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Safely extract the ID using the new Next.js Promise requirement
  const resolvedParams = await params;
  const playId = resolvedParams.id;

  const { data: work } = await supabase
    .from('works')
    .select('*')
    .eq('id', playId)
    .single();

  // If the URL doesn't match a play in the database, show standard 404
  if (!work) {
    notFound();
  }

  const items = [{ text: work.content }];

  return (
    <main className="min-h-screen bg-slate-50 selection:bg-slate-200">
      <PlayableText 
        title={work.title} 
        items={items} 
        isIndex={false}
      />
    </main>
  );
}