-- =====================================================
-- BuildLab: Clean ALL Dummy/Seed Data
-- =====================================================
-- Run this in Supabase SQL Editor to remove all fake projects and campaigns

-- Step 1: Delete all generated_projects (must go first due to foreign keys)
DELETE FROM generated_projects;

-- Step 2: Delete all campaigns (and their submissions via CASCADE)
DELETE FROM campaigns;

-- Step 3: Delete ALL build_requests (this removes all the seeded fake projects)
DELETE FROM build_requests;

-- Step 4: Verify cleanup
SELECT 
  'build_requests' as table_name, 
  COUNT(*) as remaining_count 
FROM build_requests
UNION ALL
SELECT 
  'campaigns' as table_name, 
  COUNT(*) as remaining_count 
FROM campaigns
UNION ALL
SELECT 
  'generated_projects' as table_name, 
  COUNT(*) as remaining_count 
FROM generated_projects;

-- All counts should be 0 after running this script
