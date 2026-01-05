-- =====================================================
-- BuildLab: Clean Dummy Data While Preserving User Submissions
-- =====================================================
-- This script removes:
-- 1. All the seeded dummy projects (from seed_fresh_projects.sql)
-- 2. Projects without generated results
-- 3. All fake campaigns
-- 
-- Keeps: Your real user submissions (especially pctrainor's projects)

-- Step 1: Delete generated_projects that have no actual results/content
DELETE FROM generated_projects
WHERE html_code IS NULL 
   OR html_code = ''
   OR css_code IS NULL
   OR css_code = '';

-- Step 2: Delete all the dummy/seeded build_requests
-- These were created with specific dummy titles like "Focus Flow", "Meeting Summarizer", etc.
DELETE FROM build_requests
WHERE title IN (
  'Focus Flow',
  'Meeting Summarizer',
  'Meal Prep Genius',
  'Stretch Reminder',
  'Split Smart',
  'Subscription Tracker',
  'Flashcard AI',
  'Code Mentor',
  'Watch Party Sync',
  'Playlist Blend',
  'Neighbor Connect',
  'Hobby Matcher',
  'API Playground',
  'Commit Coach',
  'Color Story',
  'Font Pairer',
  'Plant Parent',
  'Moving Day',
  'Trip Curator',
  'Pack Light'
);

-- Step 3: Delete all campaigns (all are dummy/seed data)
DELETE FROM campaigns;

-- Step 4: Show what remains (should be only real user submissions)
SELECT 
  'build_requests' as table_name, 
  COUNT(*) as count,
  string_agg(DISTINCT title, ', ') as remaining_titles
FROM build_requests
GROUP BY table_name
UNION ALL
SELECT 
  'campaigns' as table_name, 
  COUNT(*) as count,
  NULL as remaining_titles
FROM campaigns
GROUP BY table_name
UNION ALL
SELECT 
  'generated_projects' as table_name, 
  COUNT(*) as count,
  NULL as remaining_titles
FROM generated_projects
GROUP BY table_name;
