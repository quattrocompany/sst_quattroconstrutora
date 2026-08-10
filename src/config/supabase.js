const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// O uso da service_role garante permissões administrativas no servidor Node.js
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;