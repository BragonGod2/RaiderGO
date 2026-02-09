#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * This script executes all SQL migration files in the database/migrations directory
 * using the Supabase Management API.
 * 
 * Usage: node scripts/run-migrations.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Migration files in order
const migrationFiles = [
    'step0_drop_tables.sql',
    'step1_create_tables.sql',
    'step2_indexes_triggers.sql',
    'step3_rls_policies.sql',
    'create_user_profiles.sql',
    'admin_center_schema.sql',
    'fix_courses_table.sql',
    'courses_rls_policies.sql',
    'insert_simple_fake_data.sql',
];

async function runMigration(filename) {
    const filepath = path.join(__dirname, '..', 'database', 'migrations', filename);

    // Check if file exists
    if (!fs.existsSync(filepath)) {
        console.log(`⏭️  Skipping ${filename} (not found)`);
        return { success: true, skipped: true };
    }

    console.log(`\n📄 Running ${filename}...`);

    const sql = fs.readFileSync(filepath, 'utf8');

    try {
        // Execute SQL using Supabase RPC
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error(`❌ Error in ${filename}:`, error.message);
            return { success: false, error };
        }

        console.log(`✅ ${filename} executed successfully`);
        return { success: true };
    } catch (err) {
        console.error(`❌ Failed to execute ${filename}:`, err.message);
        return { success: false, error: err };
    }
}

async function runAllMigrations() {
    console.log('🚀 Starting database migrations...\n');
    console.log(`📍 Supabase URL: ${SUPABASE_URL}\n`);

    let successCount = 0;
    let failureCount = 0;
    let skipCount = 0;

    for (const file of migrationFiles) {
        const result = await runMigration(file);

        if (result.skipped) {
            skipCount++;
        } else if (result.success) {
            successCount++;
        } else {
            failureCount++;
            // Stop on first error
            console.error('\n❌ Migration failed. Stopping execution.');
            break;
        }

        // Small delay between migrations
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    console.log('='.repeat(50));

    if (failureCount > 0) {
        process.exit(1);
    }
}

// Run migrations
runAllMigrations().catch(err => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
});
