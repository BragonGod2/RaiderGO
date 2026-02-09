import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    try {
        console.log('🚀 Running user profile trigger migration...\n');

        // Read the SQL file
        const sql = readFileSync('database/migrations/create_user_profile_trigger.sql', 'utf8');

        // Execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // If RPC doesn't exist, try direct query
            console.log('ℹ️  RPC method not available, executing SQL directly...\n');

            // Split SQL into statements and execute each
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                console.log(`Executing: ${statement.substring(0, 100)}...`);
                const { error: execError } = await supabase.rpc('exec', { query: statement });

                if (execError) {
                    console.error(`❌ Error executing statement:`, execError);
                    console.error(`Statement was: ${statement}`);
                    throw execError;
                }
            }
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('\nℹ️  The trigger will now automatically create user profiles when users sign up.');

    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        console.error('\n⚠️  Please run the SQL manually in the Supabase Dashboard:');
        console.error('   1. Go to https://supabase.com/dashboard');
        console.error('   2. Select your project');
        console.error('   3. Navigate to SQL Editor');
        console.error('   4. Copy and paste the contents of database/migrations/create_user_profile_trigger.sql');
        console.error('   5. Click "Run"');
        process.exit(1);
    }
}

runMigration();
