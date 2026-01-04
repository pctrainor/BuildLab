-- =====================================================
-- BuildLab: Seed Data for Campaigns & Sample Content
-- =====================================================
-- Run this AFTER the schema migrations

-- =====================================================
-- 1. SEED CAMPAIGNS (Real-looking requests for builds)
-- =====================================================

-- Note: Replace 'YOUR_USER_ID' with an actual user ID from your profiles table
-- Or run this after creating a test user

DO $$
DECLARE
  system_user_id UUID;
BEGIN
  -- Try to get an existing user, or use a placeholder
  SELECT id INTO system_user_id FROM profiles LIMIT 1;
  
  IF system_user_id IS NOT NULL THEN
    -- Campaign 1: SaaS Dashboard
    INSERT INTO campaigns (
      creator_id, 
      title, 
      description, 
      category,
      budget_min, 
      budget_max, 
      deadline, 
      voting_ends_at,
      status,
      is_featured,
      prize_pool
    ) VALUES (
      system_user_id,
      'AI-Powered Analytics Dashboard',
      E'Looking for a modern analytics dashboard that uses AI to provide insights on business data.\n\n**Requirements:**\n- Real-time data visualization\n- Natural language queries ("Show me sales from last month")\n- Customizable widgets\n- Mobile responsive\n- Dark/light theme\n\n**Tech preferences:** React, TailwindCSS, Chart.js or Recharts\n\n**Timeline:** 4-6 weeks for MVP',
      'dashboard',
      5000,
      15000,
      now() + interval '30 days',
      now() + interval '14 days',
      'active',
      true,
      500
    ),
    -- Campaign 2: E-commerce Platform
    (
      system_user_id,
      'Sustainable Fashion Marketplace',
      E'Building a marketplace for sustainable and eco-friendly fashion brands.\n\n**Key Features:**\n- Vendor onboarding and management\n- Carbon footprint calculator for products\n- Sustainability certifications display\n- User reviews with photo uploads\n- Wishlist and save for later\n\n**Inspiration:** Depop meets Patagonia\n\n**Budget:** Flexible for the right team',
      'ecommerce',
      8000,
      25000,
      now() + interval '45 days',
      now() + interval '21 days',
      'active',
      true,
      1000
    ),
    -- Campaign 3: Mobile App
    (
      system_user_id,
      'Fitness Habit Tracker with Social',
      E'Need a fitness app that makes building habits fun and social.\n\n**Core Features:**\n- Daily habit tracking with streaks\n- Friend challenges and leaderboards\n- Integration with Apple Health / Google Fit\n- AI coach that adapts to your progress\n- Gamification (badges, levels, rewards)\n\n**Looking for:** React Native or Flutter experience',
      'mobile',
      3000,
      10000,
      now() + interval '60 days',
      now() + interval '30 days',
      'active',
      false,
      250
    ),
    -- Campaign 4: AI Tool
    (
      system_user_id,
      'AI Content Repurposing Tool',
      E'Create a tool that takes long-form content and repurposes it.\n\n**Input:** YouTube video, podcast, or blog post\n**Outputs:**\n- Twitter/X thread\n- LinkedIn post\n- Instagram carousel script\n- TikTok script\n- Newsletter snippet\n- SEO-optimized blog summary\n\n**Must have:** Clean UI, batch processing, export options',
      'ai',
      2000,
      8000,
      now() + interval '21 days',
      now() + interval '10 days',
      'active',
      true,
      300
    ),
    -- Campaign 5: Community Platform
    (
      system_user_id,
      'Niche Community Platform for Writers',
      E'Building a community platform specifically for fiction writers.\n\n**Features Needed:**\n- Writing rooms with real-time collaboration\n- Critique circles with structured feedback\n- Writing sprints with timers\n- Progress tracking (word count goals)\n- Portfolio pages for each writer\n- Agent/Publisher discovery section\n\n**Vibe:** Cozy, inspiring, professional',
      'webapp',
      4000,
      12000,
      now() + interval '35 days',
      now() + interval '17 days',
      'active',
      false,
      400
    ),
    -- Campaign 6: Game/Interactive
    (
      system_user_id,
      'Educational Coding Game for Kids',
      E'Want to create a game that teaches kids (8-14) to code.\n\n**Concept:**\n- Story-driven adventure game\n- Solve puzzles by writing simple code\n- Visual programming blocks + text transition\n- Multiplayer cooperative challenges\n- Parent dashboard for progress\n\n**Inspiration:** CodeCombat + Minecraft Education',
      'game',
      6000,
      20000,
      now() + interval '90 days',
      now() + interval '45 days',
      'active',
      true,
      750
    ),
    -- Campaign 7: Quick Build
    (
      system_user_id,
      'Personal Finance Tracker Landing Page',
      E'Need a beautiful landing page for a personal finance app.\n\n**Must Include:**\n- Hero with app mockups\n- Feature highlights (3-4 sections)\n- Pricing table\n- Testimonials\n- FAQ accordion\n- Email signup with Mailchimp\n- Mobile responsive\n\n**Style:** Modern, trustworthy, clean. Think Linear or Stripe.',
      'website',
      500,
      2000,
      now() + interval '7 days',
      now() + interval '3 days',
      'active',
      false,
      100
    ),
    -- Campaign 8: SaaS
    (
      system_user_id,
      'Client Portal for Freelancers',
      E'Building a client portal where freelancers can manage projects.\n\n**Core Features:**\n- Project overview dashboard\n- File sharing and approvals\n- Invoice generation and tracking\n- Time tracking\n- Messaging/comments\n- Client-facing view (limited access)\n\n**Bonus:** Stripe integration for payments',
      'saas',
      3500,
      9000,
      now() + interval '28 days',
      now() + interval '14 days',
      'active',
      false,
      350
    );
    
    RAISE NOTICE 'Successfully seeded 8 campaigns';
  ELSE
    RAISE NOTICE 'No users found - create a user first, then run this seed';
  END IF;
END $$;

-- =====================================================
-- 2. SAMPLE COMPETITION (Weekly)
-- =====================================================

-- Create or update the weekly competition
INSERT INTO competitions (
  title,
  description,
  start_date,
  end_date,
  voting_deadline,
  status,
  prize_description,
  max_entries
) VALUES (
  'Week 1: January 2026',
  'Submit your best web app or website idea! Top voted project wins a professional build.',
  now() - interval '3 days',
  now() + interval '4 days',
  now() + interval '4 days',
  'active',
  'Free professional build of your project (valued at $5,000+)',
  100
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. PREMIUM SUBMISSION TIERS
-- =====================================================
-- This is documentation for reference - actual logic is in code

/*
SUBMISSION TIERS:

1. FREE TIER ($0)
   - 1 submission per week
   - Basic listing in competition
   - Community voting

2. STARTER PACK ($5-12)
   - 3, 5, or 10 extra submissions
   - Never expire
   - Priority support

3. PRO GENERATE ($29)
   - Everything in Starter
   - AI-generated project package:
     * Market Research Report
     * Project Charter
     * Product Requirements Doc (PRD)
     * Technical Specification
     * Working Prototype (hosted on BuildLab)
     * GitHub Repository with full codebase
   - Shareable preview link

4. PREMIUM ($99)
   - Everything in Pro Generate
   - Featured placement in competition
   - Direct builder matching
   - Priority in winner selection
   - 1-on-1 consultation call
*/

-- =====================================================
-- 4. ADD PREMIUM FIELDS TO BUILD_REQUESTS
-- =====================================================

ALTER TABLE build_requests
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS generation_status TEXT CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed'));

COMMENT ON COLUMN build_requests.is_premium IS 'Whether this is a paid premium submission';
COMMENT ON COLUMN build_requests.auto_generated IS 'Whether AI docs were auto-generated';
COMMENT ON COLUMN build_requests.generation_status IS 'Status of AI generation process';

-- =====================================================
-- 5. SUBMISSION TRANSACTIONS TABLE
-- =====================================================
-- Track all purchases and usages

CREATE TABLE IF NOT EXISTS submission_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'use', 'refund', 'bonus')),
  amount INTEGER NOT NULL, -- positive for additions, negative for usage
  pack_type TEXT, -- '3_pack', '5_pack', '10_pack', 'pro_generate', 'premium'
  stripe_payment_id TEXT,
  build_request_id UUID REFERENCES build_requests(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submission_transactions_user ON submission_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_submission_transactions_type ON submission_transactions(type);

ALTER TABLE submission_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON submission_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON campaigns TO anon, authenticated;
GRANT SELECT ON campaign_entries TO anon, authenticated;
GRANT INSERT, UPDATE ON campaigns TO authenticated;
GRANT INSERT ON campaign_entries TO authenticated;
GRANT SELECT ON submission_transactions TO authenticated;
