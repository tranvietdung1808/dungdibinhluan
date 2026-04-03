const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  console.log('Testing Admin...');
  const { data: adminData } = await supabaseAdmin.from('user_roles').select('*');
  console.log('Admin Data Length:', adminData ? adminData.length : 'error');
  
  console.log('Testing Client (RLS)...');
  const { data: clientData } = await supabaseClient.from('user_roles').select('*');
  console.log('Client Data Length:', clientData ? clientData.length : 'error');
}
test();
