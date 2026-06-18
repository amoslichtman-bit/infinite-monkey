import { createClient } from '@supabase/supabase-js';
import PlayableText from './components/PlayableText';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function Home() {
  // Fetch the data, now including the 'type' column
  const { data: works } = await supabase
    .from('works')
    .select('id, title, type')
    .order('title');

  const safeWorks = works || [];

  // Separate the data into categories
  const plays = safeWorks.filter(w => w.type === 'play');
  const sonnets = safeWorks.filter(w => w.type === 'sonnet');

  // Build the array. Text without an 'id' automatically becomes a playable header.
  const items = [
    { text: "The Complete Works of Shakespeare" },
    
    { text: "Plays" },
    ...plays.map(work => ({ id: work.id, text: work.title })),
    
    { text: "Sonnets" },
    ...sonnets.map(work => ({ id: work.id, text: work.title }))
  ];

  return (
    <main className="min-h-screen bg-slate-50 selection:bg-slate-200">
      <PlayableText 
        title="Infinite Monkey" 
        items={items} 
        isIndex={true} 
      />
    </main>
  );
}