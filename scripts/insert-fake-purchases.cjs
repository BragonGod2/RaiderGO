require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role key if available, otherwise use anon key
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!process.env.VITE_SUPABASE_URL || !supabaseKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_KEY in .env file');
    process.exit(1);
}

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    supabaseKey
);

async function insertFakePurchases() {
    console.log('🚀 Starting fake purchase generation...\n');

    // Get all users from user_profiles (which includes regular users)
    let users = [];

    // Try to get users via admin API first (requires service role key)
    try {
        const { data, error } = await supabase.auth.admin.listUsers();
        if (data && data.users) {
            users = data.users;
        }
    } catch (err) {
        // If admin API fails, get user IDs from user_profiles table
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id');

        if (profiles && profiles.length > 0) {
            users = profiles.map(p => ({ id: p.user_id }));
        }
    }

    if (users.length === 0) {
        console.error('❌ No users found!');
        console.log('💡 Please create some users first!');
        return;
    }

    console.log(`✅ Found ${users.length} users`);

    // Get all published courses
    const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, price')
        .eq('is_published', true);

    if (coursesError || !courses || courses.length === 0) {
        console.error('❌ Error fetching courses or no courses found:', coursesError);
        console.log('💡 Please run the create_courses_table.sql migration first!');
        return;
    }

    console.log(`✅ Found ${courses.length} courses`);
    console.log('\n🎲 Generating 200 fake purchases...\n');

    const purchases = [];
    const now = new Date();

    for (let i = 0; i < 200; i++) {
        // Random user and course
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomCourse = courses[Math.floor(Math.random() * courses.length)];

        // Random date in last 90 days
        const daysAgo = Math.floor(Math.random() * 90);
        const purchaseDate = new Date(now);
        purchaseDate.setDate(purchaseDate.getDate() - daysAgo);

        purchases.push({
            user_id: randomUser.id,
            course_id: randomCourse.id,
            amount: randomCourse.price,
            currency: 'USD',
            payment_status: 'completed',
            created_at: purchaseDate.toISOString()
        });

        if ((i + 1) % 50 === 0) {
            console.log(`   Created ${i + 1} purchases...`);
        }
    }

    // Insert all purchases
    const { data, error } = await supabase
        .from('purchases')
        .insert(purchases)
        .select();

    if (error) {
        console.error('\n❌ Error inserting purchases:', error);
        return;
    }

    console.log(`\n✅ Successfully inserted ${data?.length || 0} purchases!`);

    // Get summary stats
    const { data: stats } = await supabase
        .from('purchases')
        .select('amount');

    const { count: recentCount } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const totalRevenue = stats?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    console.log('\n====================================');
    console.log('📊 PURCHASE SUMMARY');
    console.log('====================================');
    console.log(`Total Purchases: ${stats?.length || 0}`);
    console.log(`Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`Purchases (Last 30 days): ${recentCount || 0}`);
    console.log('====================================\n');
}

insertFakePurchases().catch(console.error);
