const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials:', { 
    url: !!supabaseUrl, 
    key: !!supabaseKey 
  });
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key starts with:', supabaseKey?.substring(0, 20));

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
