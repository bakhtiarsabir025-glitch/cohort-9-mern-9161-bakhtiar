require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize the Supabase client using the URL and service role key for backend operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL and Service Role Key must be provided in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
