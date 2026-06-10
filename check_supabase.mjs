import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pihvkjmtvjuxpvczqtar.supabase.co';
const supabaseKey = 'sb_publishable_4JSAyXbLTXDdwNo98rEeRQ__BFd1wyU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  console.log('Profiles:', profiles, 'Error:', error);
}

check();
