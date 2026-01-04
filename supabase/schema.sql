-- BuildLab Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_votes_received INTEGER DEFAULT 0,
  wins_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- COMPETITIONS TABLE
-- ============================================
CREATE TABLE competitions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  voting_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'voting', 'completed')),
  winner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Competitions are viewable by everyone" ON competitions
  FOR SELECT USING (true);

-- ============================================
-- BUILD REQUESTS TABLE
-- ============================================
CREATE TABLE build_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  short_description TEXT NOT NULL,
  detailed_description TEXT NOT NULL,
  target_audience TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  design_preferences TEXT,
  examples_inspiration TEXT,
  budget_notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_competition', 'winner', 'in_progress', 'completed')),
  competition_id UUID REFERENCES competitions(id),
  vote_count INTEGER DEFAULT 0,
  boost_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE build_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Build requests are viewable by everyone" ON build_requests
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own build requests" ON build_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own build requests" ON build_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own build requests" ON build_requests
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- VOTES TABLE
-- ============================================
CREATE TABLE votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  build_request_id UUID REFERENCES build_requests(id) ON DELETE CASCADE NOT NULL,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, build_request_id, competition_id)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are viewable by everyone" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own votes" ON votes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- COMMENTS TABLE
-- ============================================
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  build_request_id UUID REFERENCES build_requests(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- BOOSTS TABLE
-- ============================================
CREATE TABLE boosts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  build_request_id UUID REFERENCES build_requests(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Boosts are viewable by everyone" ON boosts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can boost" ON boosts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update vote count on build request when vote is added/removed
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE build_requests SET vote_count = vote_count + 1 WHERE id = NEW.build_request_id;
    UPDATE profiles SET total_votes_received = total_votes_received + 1 
    WHERE id = (SELECT user_id FROM build_requests WHERE id = NEW.build_request_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE build_requests SET vote_count = vote_count - 1 WHERE id = OLD.build_request_id;
    UPDATE profiles SET total_votes_received = total_votes_received - 1 
    WHERE id = (SELECT user_id FROM build_requests WHERE id = OLD.build_request_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vote_change
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_count();

-- Update boost amount on build request
CREATE OR REPLACE FUNCTION update_boost_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE build_requests 
  SET boost_amount = (SELECT COALESCE(SUM(amount), 0) FROM boosts WHERE build_request_id = NEW.build_request_id)
  WHERE id = NEW.build_request_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_boost_added
  AFTER INSERT ON boosts
  FOR EACH ROW EXECUTE FUNCTION update_boost_amount();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_build_requests_updated_at
  BEFORE UPDATE ON build_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
-- Enable realtime for comments (for live chat on build requests)
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
ALTER PUBLICATION supabase_realtime ADD TABLE build_requests;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_build_requests_user_id ON build_requests(user_id);
CREATE INDEX idx_build_requests_competition_id ON build_requests(competition_id);
CREATE INDEX idx_build_requests_status ON build_requests(status);
CREATE INDEX idx_build_requests_category ON build_requests(category);
CREATE INDEX idx_votes_build_request_id ON votes(build_request_id);
CREATE INDEX idx_votes_competition_id ON votes(competition_id);
CREATE INDEX idx_comments_build_request_id ON comments(build_request_id);
CREATE INDEX idx_boosts_build_request_id ON boosts(build_request_id);
