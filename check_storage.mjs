import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pihvkjmtvjuxpvczqtar.supabase.co';
const supabaseKey = 'sb_publishable_4JSAyXbLTXDdwNo98rEeRQ__BFd1wyU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  const { data, error } = await supabase.storage.listBuckets();
  console.log('Buckets:', data, 'Error:', error);
}

checkStorage();
