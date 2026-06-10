import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pihvkjmtvjuxpvczqtar.supabase.co';
const supabaseKey = 'sb_publishable_4JSAyXbLTXDdwNo98rEeRQ__BFd1wyU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStorage() {
  const { data, error } = await supabase.storage.createBucket('product-images', { public: true });
  console.log('Bucket created:', data, 'Error:', error);
}

fixStorage();
