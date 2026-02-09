// Bulk Create Test Users for Analytics
// Run this with: node scripts/create-test-users.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const testUsers = [
    { email: 'john.doe@test.com', username: 'john_doe', firstName: 'John', lastName: 'Doe' },
    { email: 'jane.smith@test.com', username: 'jane_smith', firstName: 'Jane', lastName: 'Smith' },
    { email: 'bob.wilson@test.com', username: 'bob_wilson', firstName: 'Bob', lastName: 'Wilson' },
    { email: 'alice.brown@test.com', username: 'alice_brown', firstName: 'Alice', lastName: 'Brown' },
    { email: 'charlie.davis@test.com', username: 'charlie_davis', firstName: 'Charlie', lastName: 'Davis' },
    { email: 'emma.johnson@test.com', username: 'emma_johnson', firstName: 'Emma', lastName: 'Johnson' },
    { email: 'david.miller@test.com', username: 'david_miller', firstName: 'David', lastName: 'Miller' },
    { email: 'sarah.garcia@test.com', username: 'sarah_garcia', firstName: 'Sarah', lastName: 'Garcia' },
    { email: 'michael.martinez@test.com', username: 'michael_martinez', firstName: 'Michael', lastName: 'Martinez' },
    { email: 'lisa.anderson@test.com', username: 'lisa_anderson', firstName: 'Lisa', lastName: 'Anderson' },
];

const password = 'Test123!'; // Same password for all test users

async function createTestUsers() {
    console.log('🚀 Starting to create test users...\n');

    const createdUsers = [];

    for (const user of testUsers) {
        try {
            console.log(`Creating user: ${user.email}...`);

            // Sign up the user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: user.email,
                password: password,
                options: {
                    data: {
                        username: user.username,
                        first_name: user.firstName,
                        last_name: user.lastName
                    }
                }
            });

            if (authError) {
                console.error(`❌ Error creating ${user.email}:`, authError.message);
                continue;
            }

            if (authData?.user) {
                // Create user profile
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .insert([{
                        user_id: authData.user.id,
                        username: user.username,
                        first_name: user.firstName,
                        last_name: user.lastName
                    }]);

                if (profileError) {
                    console.error(`❌ Error creating profile for ${user.email}:`, profileError.message);
                } else {
                    console.log(`✅ Created: ${user.email}`);
                    createdUsers.push({ ...user, id: authData.user.id });
                }
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error(`❌ Unexpected error for ${user.email}:`, error.message);
        }
    }

    console.log(`\n✨ Successfully created ${createdUsers.length} test users!`);
    console.log('\nTest user credentials:');
    console.log(`Email: any of the above | Password: ${password}`);

    return createdUsers;
}

createTestUsers()
    .then(() => {
        console.log('\n✅ Done! You can now run the insert_fake_data.sql script to add purchases and subscriptions.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
