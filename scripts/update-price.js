
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Using anon key might not work if RLS prevents update, usually need service role key for admin tasks
// Let's try to use the service role key if available, or just anon check
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function updatePrice() {
    console.log('Updating course price to 1.00...');

    const { data, error } = await supabase
        .from('courses')
        .update({ price: 1.00 })
        .eq('id', 'b9c3730e-4de2-4ff6-afbe-5a60909bd962')
        .select();

    if (error) {
        console.error('Error updating price:', error);
    } else {
        console.log('Success! Updated course:', data);
    }
}

updatePrice();
