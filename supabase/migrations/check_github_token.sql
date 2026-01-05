-- Quick check: Does pctrainor have a GitHub token stored?
SELECT 
  username,
  github_username,
  github_access_token IS NOT NULL as has_token,
  LENGTH(github_access_token) as token_length,
  github_connected_at,
  updated_at
FROM profiles 
WHERE username = 'pctrainor';

-- This should show:
-- has_token: true
-- token_length: > 0 (usually 40-50 characters)
-- github_connected_at: recent timestamp
