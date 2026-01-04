-- Fresh Project Seed Script for BuildLab
-- Run this in Supabase SQL Editor to reset and seed new projects

-- Step 1: Clean up existing test data
-- Delete generated_projects first due to foreign key
DELETE FROM generated_projects;

-- Delete all existing build_requests
DELETE FROM build_requests;

-- Step 2: Get a user ID to assign projects to
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get the first user from profiles (you can change this to a specific user_id)
  SELECT id INTO target_user_id FROM profiles LIMIT 1;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Please create a user first.';
  END IF;

  -- Step 3: Insert diverse, appealing project ideas
  
  -- PRODUCTIVITY & TOOLS
  INSERT INTO build_requests (user_id, title, short_description, detailed_description, category, target_audience, features, status, vote_count, created_at)
  VALUES 
  (target_user_id, 'Focus Flow', 'AI-powered productivity timer that learns your work patterns', 
   'A smart Pomodoro timer that uses AI to analyze when you are most productive and suggests optimal work/break schedules. Integrates with your calendar and blocks distracting sites during focus sessions.', 
   'Productivity', 'Remote workers and students', 
   '["AI-optimized work sessions", "Site blocker integration", "Calendar sync", "Productivity analytics dashboard"]'::jsonb,
   'submitted', 47, NOW() - INTERVAL '2 days'),
   
  (target_user_id, 'Meeting Summarizer', 'Auto-transcribe and summarize any video call',
   'Chrome extension that records, transcribes, and creates actionable summaries from Zoom, Meet, or Teams calls. Extracts action items and sends follow-up emails automatically.',
   'Productivity', 'Business professionals', 
   '["Real-time transcription", "AI summary generation", "Action item extraction", "Automatic follow-up emails"]'::jsonb,
   'submitted', 89, NOW() - INTERVAL '1 day'),

  -- HEALTH & FITNESS
  (target_user_id, 'Meal Prep Genius', 'Weekly meal planning with smart grocery lists',
   'Input your dietary preferences, budget, and time constraints. Get a personalized weekly meal plan with recipes scaled to your household size and an optimized grocery list organized by store aisle.',
   'Health & Fitness', 'Busy families and health-conscious individuals',
   '["Dietary restriction support", "Budget optimization", "Aisle-organized shopping lists", "Leftover ingredient suggestions"]'::jsonb,
   'submitted', 156, NOW() - INTERVAL '3 days'),

  (target_user_id, 'Stretch Reminder', 'Desk worker wellness with guided micro-breaks',
   'A gentle reminder app for desk workers that prompts stretches and eye exercises based on your sitting time. Includes 30-second guided routines and tracks your wellness habits.',
   'Health & Fitness', 'Office workers and developers',
   '["Smart break timing", "Video-guided stretches", "Eye strain exercises", "Weekly wellness reports"]'::jsonb,
   'submitted', 34, NOW() - INTERVAL '5 days'),

  -- FINANCE
  (target_user_id, 'Split Smart', 'Fair expense splitting for roommates and trips',
   'Beyond simple bill splitting - handles complex scenarios like shared subscriptions, varying incomes, and recurring expenses. Sends automatic reminders and integrates with Venmo/PayPal.',
   'Finance', 'Roommates, couples, and travel groups',
   '["Income-based splitting", "Recurring expense tracking", "Payment integration", "Expense history analytics"]'::jsonb,
   'submitted', 72, NOW() - INTERVAL '4 days'),

  (target_user_id, 'Subscription Tracker', 'Never forget a subscription again',
   'Automatically detects subscriptions from your email receipts, tracks renewal dates, calculates total monthly spend, and alerts you before charges. Find unused subscriptions costing you money.',
   'Finance', 'Anyone with multiple subscriptions',
   '["Email receipt scanning", "Renewal alerts", "Spending analytics", "Cancellation reminders"]'::jsonb,
   'submitted', 128, NOW() - INTERVAL '1 day'),

  -- EDUCATION
  (target_user_id, 'Flashcard AI', 'Turn any document into study flashcards instantly',
   'Upload a PDF, paste notes, or link a webpage - AI generates comprehensive flashcards with spaced repetition scheduling. Perfect for students and professionals learning new material.',
   'Education', 'Students and lifelong learners',
   '["Multi-format import", "Spaced repetition algorithm", "Progress tracking", "Collaborative decks"]'::jsonb,
   'submitted', 203, NOW() - INTERVAL '2 days'),

  (target_user_id, 'Code Mentor', 'Practice coding with AI-powered feedback',
   'Interactive coding challenges with real-time AI feedback on your solutions. Explains time complexity, suggests optimizations, and tracks your improvement over time.',
   'Education', 'Aspiring developers and bootcamp students',
   '["500+ challenges", "Real-time code analysis", "Multiple language support", "Interview prep mode"]'::jsonb,
   'submitted', 167, NOW() - INTERVAL '3 days'),

  -- ENTERTAINMENT
  (target_user_id, 'Watch Party Sync', 'Synchronized streaming with friends anywhere',
   'Watch Netflix, YouTube, or any streaming service perfectly synced with friends. Includes video chat overlay, shared reactions, and a queue system for movie nights.',
   'Entertainment', 'Long-distance friends and families',
   '["Multi-platform support", "Video chat overlay", "Reaction emojis", "Shared watchlist"]'::jsonb,
   'submitted', 94, NOW() - INTERVAL '4 days'),

  (target_user_id, 'Playlist Blend', 'Create the perfect party playlist from everyones taste',
   'Everyone adds their Spotify or Apple Music account, and AI creates a blended playlist that satisfies all music tastes. Great for road trips, parties, and shared spaces.',
   'Entertainment', 'Friend groups and party hosts',
   '["Multi-account blending", "Genre balancing", "Skip voting", "Mood-based filtering"]'::jsonb,
   'submitted', 78, NOW() - INTERVAL '2 days'),

  -- SOCIAL
  (target_user_id, 'Neighbor Connect', 'Hyperlocal community board for your building',
   'A private social network for apartment buildings and neighborhoods. Share recommendations, coordinate package pickups, find walking buddies for pets, and organize building events.',
   'Social', 'Apartment dwellers and neighborhood communities',
   '["Verified resident access", "Package coordination", "Event planning", "Local recommendations"]'::jsonb,
   'submitted', 112, NOW() - INTERVAL '5 days'),

  (target_user_id, 'Hobby Matcher', 'Find local people who share your interests',
   'Not dating - just hobbies! Connect with nearby people who want to play tennis, practice languages, join book clubs, or start bands. Activity-focused meetups made easy.',
   'Social', 'People looking to expand their social circles',
   '["Interest matching", "Activity scheduling", "Group creation", "Safety verification"]'::jsonb,
   'submitted', 145, NOW() - INTERVAL '1 day'),

  -- DEVELOPER TOOLS
  (target_user_id, 'API Playground', 'Test and document APIs with AI assistance',
   'A beautiful API testing tool that uses AI to auto-generate documentation, suggest test cases, and detect potential issues. Collaboration features for team environments.',
   'Developer Tools', 'Backend developers and API designers',
   '["AI documentation generation", "Test case suggestions", "Team workspaces", "Mock server generation"]'::jsonb,
   'submitted', 189, NOW() - INTERVAL '2 days'),

  (target_user_id, 'Commit Coach', 'AI-powered code review for solo developers',
   'Get the code review feedback you would get from a senior developer, but available 24/7. Catches bugs, suggests improvements, and explains best practices for every commit.',
   'Developer Tools', 'Solo developers and small teams',
   '["Pre-commit analysis", "Best practice suggestions", "Security scanning", "Learning explanations"]'::jsonb,
   'submitted', 221, NOW() - INTERVAL '1 day'),

  -- CREATIVE
  (target_user_id, 'Color Story', 'Generate color palettes from any image or mood',
   'Upload a photo, describe a feeling, or input a brand - get beautiful, accessible color palettes with CSS/Tailwind exports. Includes contrast checking for accessibility.',
   'Creative', 'Designers and developers',
   '["Image color extraction", "Mood-based generation", "Accessibility checking", "Export to code"]'::jsonb,
   'submitted', 86, NOW() - INTERVAL '3 days'),

  (target_user_id, 'Font Pairer', 'Find the perfect font combinations',
   'Input your heading font and get AI-suggested body fonts that complement it perfectly. Preview with your actual content and export Google Fonts links or CSS.',
   'Creative', 'Web designers and content creators',
   '["AI font matching", "Live preview", "Google Fonts integration", "Typography guidelines"]'::jsonb,
   'submitted', 67, NOW() - INTERVAL '4 days'),

  -- HOME & LIFE
  (target_user_id, 'Plant Parent', 'Never kill a houseplant again',
   'Identify plants with your camera, get care schedules based on your home light conditions, and receive watering reminders. Diagnose plant problems with photo analysis.',
   'Home & Life', 'Plant enthusiasts and beginners',
   '["Plant identification", "Custom care schedules", "Problem diagnosis", "Growth tracking"]'::jsonb,
   'submitted', 134, NOW() - INTERVAL '2 days'),

  (target_user_id, 'Moving Day', 'The ultimate moving checklist and coordinator',
   'From 8 weeks out to move-in day, get a personalized checklist. Compare moving quotes, track boxes by room with QR codes, and coordinate helpers with real-time updates.',
   'Home & Life', 'Anyone planning a move',
   '["Timeline checklists", "Quote comparison", "QR box tracking", "Helper coordination"]'::jsonb,
   'submitted', 98, NOW() - INTERVAL '5 days'),

  -- TRAVEL
  (target_user_id, 'Trip Curator', 'AI travel itineraries based on your style',
   'Tell us how you travel (foodie, adventurer, history buff, relaxer) and get day-by-day itineraries with reservations, walking routes, and local tips from real travelers.',
   'Travel', 'Travelers who want curated experiences',
   '["Personality-based planning", "Walking route maps", "Reservation links", "Local insider tips"]'::jsonb,
   'submitted', 176, NOW() - INTERVAL '3 days'),

  (target_user_id, 'Pack Light', 'Smart packing lists for any destination',
   'Input your destination, dates, and planned activities - get a weather-appropriate packing list. Track what you have packed and get reminders for essentials like chargers and medications.',
   'Travel', 'Frequent travelers and over-packers',
   '["Weather-based suggestions", "Activity-specific items", "Packing progress tracking", "Carry-on optimization"]'::jsonb,
   'submitted', 54, NOW() - INTERVAL '4 days');

END $$;

-- Step 4: Verify the seed
SELECT 
  title, 
  category, 
  vote_count,
  created_at::date as submitted
FROM build_requests 
ORDER BY vote_count DESC;
