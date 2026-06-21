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
  const { data: orders, error: err1 } = await supabase.from('orders').select('id, status').limit(1);
  if (err1) { console.error('Fetch error:', err1); return; }
  if (!orders || orders.length === 0) { console.log('No orders found'); return; }
  
  const orderId = orders[0].id;
  console.log('Trying to update order:', orderId, 'from', orders[0].status, 'to Delivered');
  
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'Delivered', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select('*')
    .single();
    
  if (error) {
    console.error('Error updating:', error);
  } else {
    console.log('Success:', data.status);
    await supabase.from('orders').update({ status: orders[0].status }).eq('id', orderId);
  }
}

test();
