
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
        const { courseId, price, title, origin } = await req.json();

        const merchantCode = Deno.env.get('VITE_2CHECKOUT_MERCHANT_ID')!;
        const buyLinkSecret = Deno.env.get('TCO_BUY_LINK_SECRET')!;

        // Standard Buy Link parameters - Legacy Compatible
        // We use 'prod' instead of 'item-name-0' which is safer for older accounts
        const params: Record<string, string> = {
            'merchant': merchantCode,
            'dynamic': '1',
            'prod': 'Digital Course Access',
            'price': price.toString(),
            'currency': 'USD',
            'qty': '1',
            'type': 'digital',
            'item-ext-ref': courseId, // Note: no '-0' suffix for standard links
            'return-url': `https://raidergo.com/payment/success?course_id=${courseId}`,
            'return-type': 'redirect'
        };

        // Signature Calculation: Alphabetical sort of ALL parameters
        // Standard Buy Links INCLUDE merchant in the signature
        const sortedKeys = Object.keys(params).sort();
        let stringToSign = '';
        for (const key of sortedKeys) {
            const val = params[key];
            stringToSign += val.length + val;
        }

        console.log('[Generate Link] Standard Buy Link Signing string:', stringToSign);
        const signatureValue = await hmacSha256(buyLinkSecret, stringToSign);

        const urlParams = new URLSearchParams({
            ...params,
            'signature': signatureValue // try lowercase first, if fails we try UPPER
        });

        const baseUrl = 'https://secure.2checkout.com/checkout/buy';
        const checkoutUrl = `${baseUrl}?${urlParams.toString()}`;

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
