// Stripe webhook handler for payment completion
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      
      const userId = session.metadata?.user_id
      const packSize = parseInt(session.metadata?.pack_size || '0')

      if (!userId || !packSize) {
        console.error('Missing metadata in checkout session')
        return new Response('Missing metadata', { status: 400 })
      }

      // Create Supabase admin client
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Add submissions to user's profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('extra_submissions')
        .eq('id', userId)
        .single()

      if (fetchError) {
        console.error('Error fetching profile:', fetchError)
        return new Response('Error fetching profile', { status: 500 })
      }

      const newTotal = (profile?.extra_submissions || 0) + packSize

      // Update profile with new submission count
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ extra_submissions: newTotal })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        return new Response('Error updating profile', { status: 500 })
      }

      // Record the transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'submission_pack',
        amount: session.amount_total ? session.amount_total / 100 : 0,
        stripe_session_id: session.id,
        status: 'completed',
        metadata: {
          pack_size: packSize,
          payment_status: session.payment_status,
        },
      })

      console.log(`Added ${packSize} submissions for user ${userId}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(`Webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      status: 400,
    })
  }
})
