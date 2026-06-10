import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pihvkjmtvjuxpvczqtar.supabase.co';
const supabaseKey = 'sb_publishable_4JSAyXbLTXDdwNo98rEeRQ__BFd1wyU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log(`Signing up with ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error('Auth Error:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log(`Signed up successfully. User ID: ${userId}`);

  console.log('Checking if profile was created by trigger...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Profile Error:', profileError);
  } else {
    console.log('Profile:', profile);
  }
}

testSupabase();
