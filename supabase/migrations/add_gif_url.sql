-- Add gif_url column to build_requests table
-- Run this in Supabase SQL Editor

ALTER TABLE build_requests
ADD COLUMN IF NOT EXISTS gif_url TEXT;

-- Optional: Add a comment for documentation
COMMENT ON COLUMN build_requests.gif_url IS 'GIPHY URL for project thumbnail/avatar';
