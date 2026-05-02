require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteMods() {
  const slugsToDelete = [
    'fc-26-anth-james-v7-full-gameplay-package-tu-1-5-3',
    'fc-26-rjw-realistic-transfers-mod-v1-5-3-fix2-0',
    'fifer-s-fc26-realism-mod-1-0-alpha-18-tu-1-5-4-chto-novogo'
  ];

  const { data, error } = await supabase
    .from('mods')
    .delete()
    .in('slug', slugsToDelete)
    .select();

  console.log('Deleted:', data?.map(m => m.name));
}

deleteMods().catch(console.error);
