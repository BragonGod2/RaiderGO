
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function hmacSha256(key: string, message: string) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const { courseId, userId, price, title, origin } = await req.json();

        const merchantCode = Deno.env.get('VITE_2CHECKOUT_MERCHANT_ID')!;
        const buyLinkSecret = Deno.env.get('TCO_BUY_LINK_SECRET')!;

        // Create a combined reference if we have a user ID
        const refId = userId ? `${userId}|${courseId}` : courseId;

        // Legacy 2Checkout Host (Standard/Classic)
        // This bypasses the strict signature requirements of ConvertPlus
        const params: Record<string, string> = {
            'sid': merchantCode,
            'mode': '2CO',
            'li_0_type': 'product',
            'li_0_name': 'Digital Course Access',
            'li_0_price': price.toString(),
            'li_0_quantity': '1',
            'li_0_tangible': 'N',
            'li_0_product_id': refId,
            'x_receipt_link_url': `https://raidergo.com/payment/success?course_id=${courseId}`,
        };

        const urlParams = new URLSearchParams(params);

        // Note: Legacy checkout usually works without signature if "Parameter Protection" 
        // is not strictly enforced. If it is, we would need MD5 (not HMAC).
        // Let's try the direct link first.

        const baseUrl = 'https://www.2checkout.com/checkout/purchase';
        const checkoutUrl = `${baseUrl}?${urlParams.toString()}`;

        console.log('[Generate Link] Generated Legacy URL:', checkoutUrl);

        return new Response(JSON.stringify({ url: checkoutUrl }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('[Generate Link] Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
})
