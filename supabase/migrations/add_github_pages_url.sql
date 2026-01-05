-- Add GitHub Pages URL to generated_projects table
ALTER TABLE generated_projects 
ADD COLUMN IF NOT EXISTS github_pages_url TEXT;

-- Verify the column was added
\d generated_projects;
