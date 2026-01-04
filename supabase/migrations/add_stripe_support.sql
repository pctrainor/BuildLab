-- Add Stripe customer ID to profiles for payment tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Create index for faster Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON public.profiles(stripe_customer_id);

-- Add stripe_session_id to existing transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS stripe_session_id text;

-- Create index on transactions for stripe session lookups
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_session ON public.transactions(stripe_session_id);
