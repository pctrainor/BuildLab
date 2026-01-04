-- Generated Projects Table
-- Stores all AI-generated project documentation and code

CREATE TABLE IF NOT EXISTS generated_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_request_id UUID REFERENCES build_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_slug TEXT NOT NULL,
  
  -- Generated Documents
  market_research TEXT,
  project_charter TEXT,
  prd TEXT,
  tech_spec TEXT,
  
  -- Generated Code (stored as JSONB for flexibility)
  code_files JSONB DEFAULT '{}',
  
  -- Deployment Info
  preview_url TEXT,
  github_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_generated_projects_user ON generated_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_projects_build_request ON generated_projects(build_request_id);
CREATE INDEX IF NOT EXISTS idx_generated_projects_slug ON generated_projects(project_slug);

-- Add generation columns to build_requests
ALTER TABLE build_requests 
ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS preview_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT;

-- RLS Policies
ALTER TABLE generated_projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (if they exist) to make this idempotent
DROP POLICY IF EXISTS "Users can view own generated projects" ON generated_projects;
DROP POLICY IF EXISTS "Anyone can view completed public project previews" ON generated_projects;

-- Users can view their own generated projects
CREATE POLICY "Users can view own generated projects"
ON generated_projects FOR SELECT
USING (auth.uid() = user_id);

-- Users can view generated projects for public build requests
CREATE POLICY "Anyone can view completed public project previews"
ON generated_projects FOR SELECT
USING (
  status = 'completed' 
  AND EXISTS (
    SELECT 1 FROM build_requests 
    WHERE build_requests.id = generated_projects.build_request_id 
    AND build_requests.status IN ('submitted', 'in_competition', 'winner')
  )
);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_generated_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_generated_projects_updated_at ON generated_projects;
CREATE TRIGGER set_generated_projects_updated_at
  BEFORE UPDATE ON generated_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_generated_projects_updated_at();

-- Grant access to authenticated users
GRANT SELECT ON generated_projects TO authenticated;
GRANT SELECT ON generated_projects TO anon;
