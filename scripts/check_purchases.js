
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPurchases() {
    console.log('Checking purchases table...')
    const { data, error } = await supabase
        .from('purchases')
        .select('*')

    if (error) {
        console.error('Error fetching purchases:', error)
    } else {
        console.log(`Found ${data.length} purchases:`)
        console.log(JSON.stringify(data, null, 2))
    }
}

checkPurchases()
