require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanMods() {
  const { data, error } = await supabase
    .from('mods')
    .delete()
    .in('author', ['FIFA MODS', 'GAMEKOT', 'Gamekot'])
    .select();

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(`Deleted ${data?.length || 0} old mods.`);
  }
}

cleanMods().catch(console.error);
