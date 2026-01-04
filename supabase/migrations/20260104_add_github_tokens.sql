-- Add GitHub OAuth token storage to profiles
-- Tokens are encrypted at rest by Supabase

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS github_access_token TEXT,
ADD COLUMN IF NOT EXISTS github_username TEXT,
ADD COLUMN IF NOT EXISTS github_connected_at TIMESTAMPTZ;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_github_username ON profiles(github_username);

-- RLS: Users can only see their own GitHub data
-- (profiles table should already have RLS enabled)

COMMENT ON COLUMN profiles.github_access_token IS 'Encrypted GitHub OAuth access token for repo creation';
COMMENT ON COLUMN profiles.github_username IS 'Connected GitHub username';

-- OAuth state table for CSRF protection
CREATE TABLE IF NOT EXISTS github_oauth_states (
  state UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Auto-cleanup expired states
CREATE INDEX IF NOT EXISTS idx_github_oauth_states_expires ON github_oauth_states(expires_at);

-- RLS for oauth states (only service role should access)
ALTER TABLE github_oauth_states ENABLE ROW LEVEL SECURITY;
-- No policies = only service role can access
