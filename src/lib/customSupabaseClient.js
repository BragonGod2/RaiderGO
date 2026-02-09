import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wjdhehcghnqamyekwqyr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZGhlaGNnaG5xYW15ZWt3cXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5ODY5NTcsImV4cCI6MjA4NTU2Mjk1N30.X7hIxTc-nElyULHsO8uFe_TAs3XS9YMf2f45Lv2ElV4';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export {
    customSupabaseClient,
    customSupabaseClient as supabase,
    supabaseAnonKey,
};
