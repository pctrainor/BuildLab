-- ============================================
-- REFERRAL SYSTEM SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_id) -- Each user can only be referred once
);

-- Add referral_code column to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bonus_votes INTEGER DEFAULT 0;

-- Create unique index on referral_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code) WHERE referral_code IS NOT NULL;

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policies for referrals
CREATE POLICY "Users can view their own referrals" ON referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

CREATE POLICY "System can insert referrals" ON referrals
  FOR INSERT TO authenticated WITH CHECK (true);

-- Function to generate referral code on profile creation
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate referral code from username (uppercase)
  NEW.referral_code := UPPER(NEW.username);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code
DROP TRIGGER IF EXISTS on_profile_referral_code ON profiles;
CREATE TRIGGER on_profile_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION generate_referral_code();

-- Function to process referral and award bonus votes
CREATE OR REPLACE FUNCTION process_referral(
  p_referred_id UUID,
  p_referral_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_count INTEGER;
BEGIN
  -- Find the referrer by code
  SELECT id INTO v_referrer_id 
  FROM profiles 
  WHERE UPPER(referral_code) = UPPER(p_referral_code)
  AND id != p_referred_id;
  
  IF v_referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if already referred
  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_referred_id AND referred_by IS NOT NULL) THEN
    RETURN FALSE;
  END IF;
  
  -- Update the referred user
  UPDATE profiles SET referred_by = v_referrer_id WHERE id = p_referred_id;
  
  -- Insert referral record
  INSERT INTO referrals (referrer_id, referred_id, referral_code, status)
  VALUES (v_referrer_id, p_referred_id, p_referral_code, 'completed');
  
  -- Count total referrals for this referrer
  SELECT COUNT(*) INTO v_referral_count 
  FROM referrals 
  WHERE referrer_id = v_referrer_id AND status = 'completed';
  
  -- Award bonus votes based on milestones
  -- 5 referrals = 3 bonus votes
  -- 10 referrals = 5 more bonus votes (8 total)
  -- 25 referrals = 10 more bonus votes (18 total)
  UPDATE profiles SET bonus_votes = 
    CASE 
      WHEN v_referral_count >= 25 THEN 18
      WHEN v_referral_count >= 10 THEN 8
      WHEN v_referral_count >= 5 THEN 3
      ELSE 0
    END
  WHERE id = v_referrer_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('referral_code', 'referred_by', 'bonus_votes');
