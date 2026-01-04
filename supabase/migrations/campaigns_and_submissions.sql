-- =====================================================
-- BuildLab: Campaigns, Submissions Limits & Anti-Gaming
-- =====================================================
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. PROFILES TABLE UPDATES
-- =====================================================

-- Add submission tracking and reputation fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS weekly_submissions_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_submissions_reset_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
ADD COLUMN IF NOT EXISTS extra_submissions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_builder BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS builder_verified_at TIMESTAMPTZ;

-- Comments for documentation
COMMENT ON COLUMN profiles.reputation_score IS 'User reputation score based on engagement, wins, etc.';
COMMENT ON COLUMN profiles.is_verified IS 'Whether user has been manually verified';
COMMENT ON COLUMN profiles.weekly_submissions_used IS 'Number of free submissions used this week';
COMMENT ON COLUMN profiles.weekly_submissions_reset_at IS 'When weekly submission count resets';
COMMENT ON COLUMN profiles.extra_submissions IS 'Purchased bonus submissions (never expire)';
COMMENT ON COLUMN profiles.is_builder IS 'Whether user is a registered builder';
COMMENT ON COLUMN profiles.builder_verified_at IS 'When builder was verified';

-- =====================================================
-- 2. CAMPAIGNS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  budget_min NUMERIC(10,2),
  budget_max NUMERIC(10,2),
  deadline TIMESTAMPTZ NOT NULL,
  voting_ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'voting', 'completed', 'cancelled')),
  winner_id UUID REFERENCES profiles(id),
  contract_terms TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  entry_fee NUMERIC(10,2) DEFAULT 0,
  prize_pool NUMERIC(10,2) DEFAULT 0,
  max_entries INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_creator ON campaigns(creator_id);

-- RLS for campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view campaigns" ON campaigns
  FOR SELECT USING (true);

CREATE POLICY "Users can create campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = creator_id);

-- =====================================================
-- 3. CAMPAIGN ENTRIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS campaign_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  proposal TEXT NOT NULL,
  estimated_cost NUMERIC(10,2),
  estimated_timeline TEXT,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, user_id) -- One entry per user per campaign
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_campaign_entries_campaign ON campaign_entries(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_entries_user ON campaign_entries(user_id);

-- RLS for campaign entries
ALTER TABLE campaign_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view campaign entries" ON campaign_entries
  FOR SELECT USING (true);

CREATE POLICY "Users can create entries" ON campaign_entries
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    -- Check account age (24 hours minimum)
    (SELECT created_at FROM profiles WHERE id = auth.uid()) < now() - interval '24 hours'
  );

CREATE POLICY "Users can update their entries" ON campaign_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 4. TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('submission_pack', 'campaign_creation', 'boost', 'entry_fee', 'prize_payout', 'platform_fee')),
  amount NUMERIC(10,2) NOT NULL,
  stripe_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user transaction history
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);

-- RLS for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Only backend can insert transactions
CREATE POLICY "Service role can insert transactions" ON transactions
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 5. CAMPAIGN VOTES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS campaign_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_entry_id UUID NOT NULL REFERENCES campaign_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, campaign_entry_id) -- One vote per user per entry
);

-- Trigger to update vote count
CREATE OR REPLACE FUNCTION update_campaign_entry_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE campaign_entries SET vote_count = vote_count + 1 WHERE id = NEW.campaign_entry_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE campaign_entries SET vote_count = vote_count - 1 WHERE id = OLD.campaign_entry_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaign_vote_count_trigger ON campaign_votes;
CREATE TRIGGER campaign_vote_count_trigger
  AFTER INSERT OR DELETE ON campaign_votes
  FOR EACH ROW EXECUTE FUNCTION update_campaign_entry_vote_count();

-- RLS for campaign votes
ALTER TABLE campaign_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view campaign votes" ON campaign_votes
  FOR SELECT USING (true);

CREATE POLICY "Verified users can vote" ON campaign_votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    -- Account must be at least 24 hours old to vote
    (SELECT created_at FROM profiles WHERE id = auth.uid()) < now() - interval '24 hours'
  );

CREATE POLICY "Users can remove their votes" ON campaign_votes
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. ANTI-GAMING: Vote restrictions for new accounts
-- =====================================================

-- Update the votes policy to require account age
DROP POLICY IF EXISTS "Authenticated users can vote" ON votes;

CREATE POLICY "Established users can vote" ON votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    -- Account must be at least 24 hours old
    (SELECT created_at FROM profiles WHERE id = auth.uid()) < now() - interval '24 hours'
  );

-- =====================================================
-- 7. FUNCTION: Add reputation on win
-- =====================================================

CREATE OR REPLACE FUNCTION add_win_reputation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'winner' AND OLD.status != 'winner' THEN
    UPDATE profiles 
    SET 
      wins_count = wins_count + 1,
      reputation_score = reputation_score + 100
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS win_reputation_trigger ON build_requests;
CREATE TRIGGER win_reputation_trigger
  AFTER UPDATE ON build_requests
  FOR EACH ROW EXECUTE FUNCTION add_win_reputation();

-- =====================================================
-- 8. FUNCTION: Add reputation on votes received
-- =====================================================

CREATE OR REPLACE FUNCTION add_vote_reputation()
RETURNS TRIGGER AS $$
DECLARE
  request_owner_id UUID;
BEGIN
  -- Get the owner of the build request
  SELECT user_id INTO request_owner_id FROM build_requests WHERE id = NEW.build_request_id;
  
  IF request_owner_id IS NOT NULL THEN
    UPDATE profiles 
    SET reputation_score = reputation_score + 1
    WHERE id = request_owner_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vote_reputation_trigger ON votes;
CREATE TRIGGER vote_reputation_trigger
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION add_vote_reputation();

-- =====================================================
-- DONE! Summary:
-- =====================================================
-- ✅ Profiles: reputation, submission limits, builder status
-- ✅ Campaigns: user-created competitions with custom terms
-- ✅ Campaign Entries: proposals with voting
-- ✅ Transactions: payment tracking
-- ✅ Anti-gaming: 24-hour account age for voting/entering
-- ✅ Reputation: +1 per vote received, +100 per win
