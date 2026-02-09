
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Config')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
    console.log('Testing direct DB insert for purchase...')

    // Use known valid IDs (you might need to update these for your specific DB)
    // We'll try to find a user and a course first

    const { data: user } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    const { data: course } = await supabase.from('courses').select('id, price').limit(1).maybeSingle();

    if (!user || !course) {
        console.error('Could not find a user or course to test with.')
        if (!user) console.error('No users found in profiles table')
        if (!course) console.error('No courses found in courses table')
        return
    }

    console.log(`Using User: ${user.id}`)
    console.log(`Using Course: ${course.id}`)

    const payload = {
        user_id: user.id,
        course_id: course.id,
        amount: course.price || 49.99,
        currency: 'EUR',
        payment_status: 'completed',
        stripe_session_id: 'cs_test_script_' + Date.now(),
        stripe_payment_intent_id: 'pi_test_script_' + Date.now(),
    }

    console.log('Attempting insert with payload:', payload)

    const { data, error } = await supabase.from('purchases').insert(payload).select();

    if (error) {
        console.error('INSERT FAILED:', error)
    } else {
        console.log('INSERT SUCCESS:', data)
        console.log('Use this User ID to check your dashboard (if it matches yours):', user.id)
    }
}

testInsert()
