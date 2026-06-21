import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) { env[match[1].trim()] = match[2].trim(); }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  if (error) console.error('Error fetching orders:', error);
  else if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    // try to get columns using rpc or inserting a fake order
    console.log('No orders. Insert a fake one to test schema.');
    const { error: insertErr } = await supabase.from('orders').insert({ order_number: 'TEST', total: 0, status: 'Processing' });
    console.log('Insert error:', insertErr);
    
    const { data: cols } = await supabase.from('orders').select('*').limit(1);
    if (cols && cols.length > 0) console.log('Columns after insert:', Object.keys(cols[0]));
  }
}

test();
