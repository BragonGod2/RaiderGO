
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

        const genericProductId = Deno.env.get('VITE_VERIFONE_GENERIC_PRODUCT_ID') || '53019736';

        // PURE CATALOG LINK TEST
        // We remove all dynamic overrides (price, description) to test if the product ID is valid
        const params: Record<string, string> = {
            'merchant': merchantCode,
            'prod': genericProductId,
            'qty': '1',
            'type': 'digital',
            'currency': 'USD',
            'ref': refId,
            'return-url': `https://raidergo.com/payment/success?course_id=${courseId}`,
            'return-type': 'redirect'
        };

        // Signature Calculation:
        // 1. Sort ALL parameters alphabetically
        // 2. Concatenate length + value
        const sortedKeys = Object.keys(params).sort();
        let stringToSign = '';
        for (const key of sortedKeys) {
            const val = params[key];
            stringToSign += val.length + val;
        }

        console.log('[Generate Link] Pure Catalog Signing string:', stringToSign);
        const signatureValue = await hmacSha256(buyLinkSecret, stringToSign);

        const urlParams = new URLSearchParams({
            ...params,
            'signature': signatureValue
        });

        const baseUrl = 'https://secure.2checkout.com/checkout/buy';
        const checkoutUrl = `${baseUrl}?${urlParams.toString()}`;

        console.log('[Generate Link] Generated ConvertPlus URL:', checkoutUrl);

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
