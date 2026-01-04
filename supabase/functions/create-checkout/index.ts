// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Price IDs from your Stripe dashboard
const PRICE_IDS: Record<number, string> = {
  3: 'price_1Slk9oKkfLbczEaw7qddfFC3',  // 3 submissions for $5
  5: 'price_1Slk9KKkfLbczEawjnsmDjTA',  // 5 submissions for $7
  10: 'price_1SlkAuKkfLbczEawJLVDg39F', // 10 submissions for $12
}

// Premium tier price IDs (create these products in Stripe Dashboard)
const PREMIUM_PRICE_IDS: Record<string, { priceId: string, submissions: number }> = {
  'pro_generate': { priceId: 'price_1SlldrKkfLbczEawQEOsfbZI', submissions: 5 },   // $29 - Pro Generate with AI
  'premium': { priceId: 'price_1SlleUKkfLbczEawBmvgZF5I', submissions: 10 },       // $99 - Premium with priority
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Parse request body
    const { pack_size, tier_id, is_premium, success_url, cancel_url } = await req.json()
    
    let priceId: string
    let packSize: number
    let isPremiumPurchase = false

    // Handle premium tier purchase
    if (is_premium && tier_id && PREMIUM_PRICE_IDS[tier_id]) {
      priceId = PREMIUM_PRICE_IDS[tier_id].priceId
      packSize = PREMIUM_PRICE_IDS[tier_id].submissions
      isPremiumPurchase = true
    } else if (pack_size && PRICE_IDS[pack_size]) {
      // Handle basic pack purchase
      priceId = PRICE_IDS[pack_size]
      packSize = pack_size
    } else {
      return new Response(JSON.stringify({ error: 'Invalid pack size or tier' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url || 'https://buildlab.app/submit?success=true',
      cancel_url: cancel_url || 'https://buildlab.app/submit?cancelled=true',
      metadata: {
        user_id: user.id,
        pack_size: packSize.toString(),
        is_premium: isPremiumPurchase.toString(),
        tier_id: tier_id || '',
      },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
