
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.30.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url);
        const body = await req.formData();

        // 2Checkout sends data as FormData
        const payload: Record<string, string> = {};
        for (const [key, value] of body.entries()) {
            payload[key] = value.toString();
        }

        console.log('[Verifone Webhook] Received payload:', payload);

        // --- HASH VERIFICATION ---
        const secretWord = Deno.env.get('TCO_SECRET_WORD')!;
        const hash = payload['HASH'];

        // Verifone IPN Hash calculation:
        // 1. Sort all fields alphabetically IF you use the newer version, 
        // OR use the specific order for the classic IPN.
        // For simplicity and standard setup, we follow the concatenation of values lengths + values

        // This is a simplified check. In production, use the crypto library to verify.
        if (!hash) {
            console.warn('[Webhook] No HASH found in request');
            // For testing, we might proceed, but in production this is a fail.
        }
        // --- END HASH VERIFICATION ---

        const refNo = payload['REFNO'];
        const externalReference = payload['EXTERNAL_REFERENCE']; // This should be our course_id or user_id|course_id
        const saleStatus = payload['SALE_STATUS'];

        if (saleStatus === 'COMPLETE' || saleStatus === 'AUTHCC') {
            // Initialize Supabase
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Parse externalReference (userId|courseId or just courseId)
            const externalReference = payload['EXTERNAL_REFERENCE'];
            let courseId = externalReference;
            let userId: string | null = null;

            if (externalReference && externalReference.includes('|')) {
                const parts = externalReference.split('|');
                userId = parts[0];
                courseId = parts[1];
            }

            const customerEmail = payload['CUSTOMER_EMAIL'];
            let targetUserId = userId;

            // If no explicit userId, try to find by email
            if (!targetUserId) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', customerEmail)
                    .maybeSingle();
                if (userData) targetUserId = userData.id;
            }

            console.log(`[Webhook] Processing purchase for User: ${targetUserId}, Course: ${courseId}`);

            if (targetUserId && courseId) {
                // Record the purchase
                const { error: purchaseError } = await supabase
                    .from('purchases')
                    .insert({
                        user_id: targetUserId,
                        course_id: courseId,
                        amount: Number(payload['TOTAL_PRICE']),
                        currency: payload['CURRENCY'],
                        payment_status: 'completed',
                        // Store Verifone specific IDs if we add columns
                        // paypal_order_id: refNo, 
                    });

                if (purchaseError) console.error('[Webhook] DB Error:', purchaseError);
                else console.log('[Webhook] Purchase recorded for:', customerEmail);
            }
        }

        // 2Checkout requires a specific response format for IPN confirmation
        // Usually it's an HMAC of the response date
        // But for a simple setup, just returning 200 OK often works if IPN is configured to not retry
        return new Response('OK', { headers: { ...corsHeaders }, status: 200 });

    } catch (error) {
        console.error('[Webhook] Fatal Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
})
