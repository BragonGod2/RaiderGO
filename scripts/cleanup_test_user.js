
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function removeCourse() {
    const email = 'johndoe12@gmail.com';

    console.log(`Searching for user: ${email}`);

    // 1. Get user ID from auth (using service role key we can access auth.users indirectly via listing or just searching if there's a profile)
    // Since we might not have a public profiles table, let's try to find them in purchases first or use the admin API
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Error listing users:', authError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User not found');
        return;
    }

    console.log(`Found user: ${user.id}`);

    // 2. Delete from purchases
    const { error: deleteError } = await supabase
        .from('purchases')
        .delete()
        .eq('user_id', user.id);

    if (deleteError) {
        console.error('Error deleting purchases:', deleteError);
    } else {
        console.log(`Successfully removed all courses from ${email}`);
    }
}

removeCourse();
