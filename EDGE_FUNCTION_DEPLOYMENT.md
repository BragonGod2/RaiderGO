# Quick Stripe Edge Function Deployment Guide

## The Issue

The CORS error you're seeing is because the Edge Functions haven't been deployed to Supabase yet. The functions exist as local files but aren't running on the server.

## Quick Deployment Steps

### 1. Link Your Supabase Project

```bash
# Login to Supabase (if not already logged in)
supabase login

# Link to your remote project
# Get your project ref from: https://app.supabase.com/project/_/settings/general
supabase link --project-ref wjdhehcghnqamyekwqyr
```

### 2. Set Required Secrets

Before deploying, set the environment variables for the functions:

```bash
# Set your Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# The webhook secret (you'll get this after setting up webhooks)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_placeholder_for_now
```

### 3. Deploy the Functions

```bash
# Deploy both functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

### 4. Verify Deployment

After deployment, you should see output like:
```
Deployed Function create-checkout-session on region:
https://wjdhehcghnqamyekwqyr.supabase.co/functions/v1/create-checkout-session
```

## Alternative: Test Mode (Use This For Now!)

If you want to test the UI without deploying Edge Functions yet, I can create a mock version that simulates the payment flow locally. This will let you see the UI and flow working while you set up Stripe.

Would you like me to:
1. Help you deploy the Edge Functions now, OR
2. Create a mock/test mode version so you can test the UI immediately?

## Common Issues

### "supabase: command not found"
Install the Supabase CLI:
```bash
brew install supabase/tap/supabase
```

### "Failed to link project"
Make sure:
- You're logged in: `supabase login`
- Project ref is correct (check SupaBase dashboard URL)
- You have access to the project

### CORS errors persist
- Verify functions are deployed: `supabase functions list`
- Check function logs: `supabase functions logs create-checkout-session`
