-- ============================================
-- SEED DATA FOR BUILDLAB
-- Run this in Supabase SQL Editor to populate initial data
-- ============================================

-- First, create a system user for seeded content (or use your own user ID)
-- You'll need to replace 'YOUR_USER_ID' with an actual user ID from your profiles table

-- Create the current week's competition
INSERT INTO competitions (id, title, category, start_date, end_date, voting_deadline, status)
VALUES (
  'c0000001-0000-0000-0000-000000000001',
  'Week of January 5, 2026',
  'all',
  '2025-12-29 00:00:00+00',
  '2026-01-09 02:00:00+00',
  '2026-01-09 02:00:00+00',
  'active'
);

-- ============================================
-- SEED BUILD REQUESTS
-- Replace 'YOUR_USER_ID' with your actual user ID from the profiles table
-- Run: SELECT id FROM profiles LIMIT 1; to get your ID
-- ============================================

-- You'll need to run this after replacing the user_id:
-- First get your user ID:
-- SELECT id, username FROM profiles;

-- Then run the inserts below with your user ID

-- WEBSITE CATEGORY
INSERT INTO build_requests (user_id, title, category, short_description, detailed_description, target_audience, features, design_preferences, status, competition_id, vote_count)
SELECT 
  id,
  'Personal Portfolio for Photographers',
  'website',
  'A stunning portfolio website for professional photographers with gallery management and client proofing.',
  'I need a modern, minimalist portfolio website that showcases photography work beautifully. The site should have a clean gallery system where visitors can browse different categories (weddings, portraits, landscapes, etc.). I want clients to be able to log in and view/select their photos from a shoot. The design should be image-first with lots of white space and smooth transitions.',
  'Professional photographers and photography enthusiasts looking to showcase their work',
  '["Image gallery with categories", "Client login portal", "Photo proofing system", "Contact form", "About page", "Blog section", "SEO optimized"]',
  'Minimalist, lots of white space, elegant typography, smooth animations',
  'in_competition',
  'c0000001-0000-0000-0000-000000000001',
  47
FROM profiles LIMIT 1;

INSERT INTO build_requests (user_id, title, category, short_description, detailed_description, target_audience, features, design_preferences, status, competition_id, vote_count)
SELECT 
  id,
  'Local Restaurant Website with Online Ordering',
  'website',
  'A beautiful restaurant website with menu display, online ordering, and reservation system.',
  'Our family restaurant needs a website that captures the warm, welcoming atmosphere of our place. We want customers to be able to view our full menu with photos, place orders for pickup or delivery, and make reservations online. We also want to showcase our story, display customer reviews, and have a gallery of our food and restaurant space.',
  'Local diners, families, and food enthusiasts in the Austin, TX area',
  '["Digital menu with photos", "Online ordering system", "Reservation booking", "Customer reviews", "Photo gallery", "Location map", "Hours and contact info"]',
  'Warm, inviting colors (earth tones), readable fonts, photos featured prominently',
  'in_competition',
  'c0000001-0000-0000-0000-000000000001',
  32
FROM profiles LIMIT 1;

-- WEB APP CATEGORY
INSERT INTO build_requests (user_id, title, category, short_description, detailed_description, target_audience, features, design_preferences, status, competition_id, vote_count)
SELECT 
  id,
  'Habit Tracker with Streak Analytics',
  'webapp',
  'A habit tracking app that gamifies building good habits with streaks, badges, and detailed analytics.',
  'I want to build a habit tracker that makes building habits fun and engaging. Users should be able to create custom habits, track daily completion, and see their streaks. The app should have satisfying animations when completing habits, badges for milestones, and detailed analytics showing patterns over time. I want a calendar view, weekly/monthly stats, and exportable data.',
  'People looking to build better habits, self-improvement enthusiasts, productivity nerds',
  '["Custom habit creation", "Daily/weekly tracking", "Streak counting", "Badge system", "Analytics dashboard", "Calendar view", "Data export", "Push notifications"]',
  'Clean, modern UI with satisfying micro-interactions, dark mode support, mobile-first',
  'in_competition',
  'c0000001-0000-0000-0000-000000000001',
  89
FROM profiles LIMIT 1;

INSERT INTO build_requests (user_id, title, category, short_description, detailed_description, target_audience, features, design_preferences, status, competition_id, vote_count)
SELECT 
  id,
  'Team Standup Bot Dashboard',
  'webapp',
  'A dashboard for async standups that integrates with Slack and provides team insights.',
  'Remote teams need better async standups. I want a web app where team members can submit their daily updates (what they did, what they''re doing, blockers) and managers can see everything in a clean dashboard. It should integrate with Slack for reminders and submissions, track participation rates, and identify recurring blockers. Weekly summary reports would be amazing.',
  'Remote teams, engineering managers, startup teams using Slack',
  '["Slack integration", "Daily standup submissions", "Manager dashboard", "Participation tracking", "Blocker identification", "Weekly summaries", "Team analytics", "Custom questions"]',
  'Professional, clean, similar to Linear or Notion aesthetics',
  'in_competition',
  'c0000001-0000-0000-0000-000000000001',
  56
FROM profiles LIMIT 1;

-- E-COMMERCE CATEGORY
INSERT INTO build_requests (user_id, title, category, short_description, detailed_description, target_audience, features, design_preferences, status, competition_id, vote_count)
SELECT 
  id,
  'Handmade Jewelry Store',
  'ecommerce',
  'An elegant e-commerce store for handcrafted artisan jewelry with custom sizing options.',
  'I create handmade jewelry and need a beautiful online store to sell my pieces. Each item is unique or made in small batches, so I need good inventory management. Customers should be able to select ring sizes, chain lengths, etc. I want to showcase the craftsmanship with multiple product photos and videos. Gift wrapping option and personalized engravings would be wonderful.',
  'Women aged 25-45 who appreciate handcrafted, unique jewelry pieces',
  '["Product catalog with variants", "Custom sizing options", "Multiple product images/videos", "Secure checkout", "Gift wrapping option", "Engraving customization", "Wishlist", "Review system"]',
  'Elegant, feminine, soft colors (rose gold, cream, sage), beautiful typography',
  'in_competition',
  'c0000001-0000-0000-0000-000000000001',
  41
FROM profiles LIMIT 1;

-- MOBILE WEB CATEGORY
INSERT INTO build_requests (user_id, title, category, short_description, detailed_description, target_audience, features, design_preferences, status, competition_id, vote_count)
SELECT 
  id,
  'Gym Workout Logger PWA',
  'mobile',
  'A mobile-first progressive web app for logging workouts with exercise library and progress tracking.',
  'I need a workout logging app that works offline in the gym where cell service is spotty. Users should be able to log exercises, sets, reps, and weights quickly. Include an exercise library with proper form videos. Track personal records and show progress over time with charts. Rest timer between sets is essential. Should feel like a native app.',
  'Gym-goers, fitness enthusiasts, people who want simple workout tracking',
  '["Offline-first PWA", "Exercise library with videos", "Quick logging interface", "Rest timer", "Personal records tracking", "Progress charts", "Workout history", "Custom workout templates"]',
  'Bold, motivating, dark theme with accent colors, large touch targets',
  'in_competition',
  'c0000001-0000-0000-0000-000000000001',
  63
FROM profiles LIMIT 1;

-- INTERACTIVE CATEGORY
INSERT INTO build_requests (user_id, title, category, short_description, detailed_description, target_audience, features, design_preferences, status, competition_id, vote_count)
SELECT 
  id,
  'Interactive Salary Calculator for Developers',
  'interactive',
  'A calculator that helps developers understand their market value based on skills, location, and experience.',
  'Developers often don''t know their market worth. I want to build an interactive calculator where you input your tech stack, years of experience, location, company size preferences, and it estimates your salary range. Show percentiles, comparisons between cities, and how adding certain skills could increase your pay. Make it shareable so people can compare.',
  'Software developers, especially those job hunting or negotiating salaries',
  '["Skill input with autocomplete", "Location adjustment", "Experience levels", "Company size filters", "Salary range output", "Percentile ranking", "Skill impact analysis", "Shareable results"]',
  'Tech-forward, clean data visualization, trustworthy feeling, accessible',
  'in_competition',
  'c0000001-0000-0000-0000-000000000001',
  78
FROM profiles LIMIT 1;

INSERT INTO build_requests (user_id, title, category, short_description, detailed_description, target_audience, features, design_preferences, status, competition_id, vote_count)
SELECT 
  id,
  'Wedding Budget Planner Tool',
  'interactive',
  'An interactive wedding budget tool that helps couples plan and track their wedding expenses.',
  'Planning a wedding is expensive and stressful. I want a tool where couples can set their total budget, allocate percentages to categories (venue, catering, photography, etc.), and track actual spending vs planned. It should suggest typical allocation percentages, let you compare vendors, and alert you when you''re going over budget. Include a shareable link for partners.',
  'Engaged couples planning their wedding, typically aged 25-35',
  '["Budget allocation by category", "Vendor comparison", "Spending tracker", "Budget alerts", "Partner sharing", "Suggested allocations", "Payment timeline", "Checklist integration"]',
  'Romantic but practical, soft colors, clear data visualization, mobile-friendly',
  'in_competition',
  'c0000001-0000-0000-0000-000000000001',
  34
FROM profiles LIMIT 1;

-- AI-POWERED CATEGORY
INSERT INTO build_requests (user_id, title, category, short_description, detailed_description, target_audience, features, design_preferences, status, competition_id, vote_count)
SELECT 
  id,
  'AI Recipe Generator from Fridge Contents',
  'ai',
  'An AI app that suggests recipes based on what ingredients you have in your fridge.',
  'I hate food waste and the "what should I cook?" question. I want an app where I can input or photograph my fridge contents, and AI suggests recipes I can make with those ingredients. It should consider dietary restrictions, cooking skill level, and time available. Show nutrition info and let me save favorites. Bonus: integrate with grocery delivery to order missing ingredients.',
  'Home cooks, busy professionals, anyone who wants to reduce food waste',
  '["Ingredient input (text/photo)", "AI recipe suggestions", "Dietary filters", "Skill level adjustment", "Time-based filtering", "Nutrition info", "Save favorites", "Shopping list generation"]',
  'Fresh, appetizing, food photography style, green/natural colors',
  'in_competition',
  'c0000001-0000-0000-0000-000000000001',
  92
FROM profiles LIMIT 1;

INSERT INTO build_requests (user_id, title, category, short_description, detailed_description, target_audience, features, design_preferences, status, competition_id, vote_count)
SELECT 
  id,
  'AI Study Notes Summarizer',
  'ai',
  'An AI tool that takes lecture notes or textbook content and creates smart study summaries and flashcards.',
  'Students spend too much time making study materials. I want an AI tool where you can paste or upload lecture notes, textbook chapters, or class slides, and it automatically generates: a concise summary, key concepts, flashcards for spaced repetition, and practice questions. It should identify what''s most important and help prioritize studying.',
  'College students, grad students, anyone studying for exams or certifications',
  '["Text/file upload", "AI-generated summaries", "Key concept extraction", "Auto flashcard creation", "Practice questions", "Spaced repetition system", "Progress tracking", "Export to Anki"]',
  'Clean, focused, study-friendly (easy on eyes), dark mode essential',
  'in_competition',
  'c0000001-0000-0000-0000-000000000001',
  71
FROM profiles LIMIT 1;

-- Add some variety in votes to make it look realistic
UPDATE build_requests SET vote_count = vote_count + floor(random() * 20) WHERE competition_id = 'c0000001-0000-0000-0000-000000000001';

-- ============================================
-- VERIFICATION
-- ============================================
SELECT category, title, vote_count FROM build_requests WHERE competition_id = 'c0000001-0000-0000-0000-000000000001' ORDER BY vote_count DESC;
