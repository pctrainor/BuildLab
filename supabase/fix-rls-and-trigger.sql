-- ============================================
-- FIX AUTH TRIGGER AND RLS FOR PROFILE CREATION
-- ============================================
-- Run this ENTIRE script in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/clihtjeyrrpvtoxwsaxq/sql/new

-- Step 1: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Create a new function that bypasses RLS using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _username TEXT;
BEGIN
  -- Get username from metadata or generate a unique one
  _username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    'user_' || substr(NEW.id::text, 1, 8)
  );
  
  -- Insert the profile
  INSERT INTO public.profiles (id, username, display_name, avatar_url, bio)
  VALUES (
    NEW.id,
    _username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', _username),
    NEW.raw_user_meta_data->>'avatar_url',
    NULL
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Username already exists, append random string
    INSERT INTO public.profiles (id, username, display_name, avatar_url, bio)
    VALUES (
      NEW.id,
      _username || '_' || substr(md5(random()::text), 1, 4),
      COALESCE(NEW.raw_user_meta_data->>'display_name', _username),
      NEW.raw_user_meta_data->>'avatar_url',
      NULL
    );
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE LOG 'Error in handle_new_user for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Grant execute permission to the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Step 4: Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FIX RLS POLICIES FOR ALL TABLES
-- ============================================

-- PROFILES TABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- Allow anyone to view profiles (public)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Allow service role to bypass RLS (for triggers)
CREATE POLICY "Service role can manage all profiles" ON public.profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- BUILD REQUESTS TABLE RLS
-- ============================================
ALTER TABLE public.build_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Build requests are viewable by everyone" ON public.build_requests;
DROP POLICY IF EXISTS "Users can insert their own build requests" ON public.build_requests;
DROP POLICY IF EXISTS "Users can update their own build requests" ON public.build_requests;
DROP POLICY IF EXISTS "Users can delete their own build requests" ON public.build_requests;

CREATE POLICY "Build requests are viewable by everyone" ON public.build_requests
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own build requests" ON public.build_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own build requests" ON public.build_requests
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own build requests" ON public.build_requests
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- COMPETITIONS TABLE RLS
-- ============================================
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Competitions are viewable by everyone" ON public.competitions;

CREATE POLICY "Competitions are viewable by everyone" ON public.competitions
  FOR SELECT USING (true);

-- Only admins/service role can manage competitions (no user policies for insert/update/delete)

-- ============================================
-- VOTES TABLE RLS
-- ============================================
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.votes;
DROP POLICY IF EXISTS "Users can insert their own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON public.votes;

CREATE POLICY "Votes are viewable by everyone" ON public.votes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON public.votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON public.votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- COMMENTS TABLE RLS
-- ============================================
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- BOOSTS TABLE RLS
-- ============================================
ALTER TABLE public.boosts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Boosts are viewable by everyone" ON public.boosts;
DROP POLICY IF EXISTS "Users can insert their own boosts" ON public.boosts;

CREATE POLICY "Boosts are viewable by everyone" ON public.boosts
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own boosts" ON public.boosts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- After running, this should return 1 for each table
SELECT 
  'profiles' as table_name, 
  COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename = 'profiles'
UNION ALL
SELECT 'build_requests', COUNT(*) FROM pg_policies WHERE tablename = 'build_requests'
UNION ALL
SELECT 'votes', COUNT(*) FROM pg_policies WHERE tablename = 'votes'
UNION ALL
SELECT 'comments', COUNT(*) FROM pg_policies WHERE tablename = 'comments'
UNION ALL
SELECT 'boosts', COUNT(*) FROM pg_policies WHERE tablename = 'boosts'
UNION ALL
SELECT 'competitions', COUNT(*) FROM pg_policies WHERE tablename = 'competitions';
