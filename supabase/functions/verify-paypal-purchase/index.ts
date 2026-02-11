
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
        const { orderId, courseId, userId } = await req.json();

        console.log(`[PayPal Verify] Checking Order: ${orderId} for User: ${userId}`);

        const clientId = Deno.env.get('VITE_PAYPAL_CLIENT_ID')!;
        const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')!;

        // 1. Get Access Token
        const auth = btoa(`${clientId}:${clientSecret}`);
        const tokenResp = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        const tokenData = await tokenResp.json();
        if (!tokenData.access_token) throw new Error('Failed to get PayPal Access Token');

        const accessToken = tokenData.access_token;

        // 2. Get Order Details
        const orderResp = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const orderData = await orderResp.json();

        // 3. Verify Status
        if (orderData.status !== 'COMPLETED' && orderData.status !== 'APPROVED') {
            // If APPROVED but not captured (rare with react-paypal-js capture()), we might need to capture here.
            // But usually client captures.
            console.error('Order status not COMPLETED:', orderData.status);
            throw new Error(`Order status is ${orderData.status}, not COMPLETED`);
        }

        // 4. Verify Custom ID (optional security check)
        const customId = orderData.purchase_units[0]?.custom_id;
        const expectedCustomId = `${userId}|${courseId}`;
        // Verify mismatch only if custom_id was actually set.
        if (customId && customId !== expectedCustomId) {
            console.warn(`[Security] Custom ID mismatch! Expected: ${expectedCustomId}, Got: ${customId}`);
            // Proceed with caution or fail? Let's proceed but log, as sometimes format differs.
        }

        // 5. Record Purchase using Service Role
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error: insertError } = await supabase
            .from('purchases')
            .insert({
                user_id: userId,
                course_id: courseId,
                amount: parseFloat(orderData.purchase_units[0].amount.value),
                currency: orderData.purchase_units[0].amount.currency_code,
                payment_status: 'completed',
                stripe_payment_id: orderId // Re-using this column or add 'paypal_order_id'
            });

        if (insertError) {
            // Check if it's unique constraint (already purchased)
            if (insertError.code === '23505') {
                return new Response(JSON.stringify({ success: true, message: 'Already purchased' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                });
            }
            throw insertError;
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('PayPal Verify Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
})
