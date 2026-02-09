const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupFakePurchases() {
    console.log('🧹 Cleaning up fake purchase data...\n');

    try {
        // Get count before deletion
        const { count: beforeCount, error: countError } = await supabase
            .from('purchases')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error counting purchases:', countError);
            return;
        }

        console.log(`📊 Found ${beforeCount} purchases in database`);

        // Delete all purchases
        const { error: deleteError } = await supabase
            .from('purchases')
            .delete()
            .gte('created_at', '1970-01-01'); // Delete all records (created after 1970)

        if (deleteError) {
            console.error('❌ Error deleting purchases:', deleteError);
            return;
        }

        // Verify deletion
        const { count: afterCount } = await supabase
            .from('purchases')
            .select('*', { count: 'exact', head: true });

        console.log(`✅ Successfully deleted ${beforeCount} purchases`);
        console.log(`📊 Remaining purchases: ${afterCount || 0}\n`);

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

cleanupFakePurchases();
