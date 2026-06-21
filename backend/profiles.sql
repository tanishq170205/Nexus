-- ============================================================
-- NEXUS — Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- profiles table — stores extra user info beyond what Supabase Auth holds
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name             TEXT NOT NULL,
  role             TEXT DEFAULT 'student'
                     CHECK (role IN ('student', 'tpo', 'recruiter', 'mentor')),
  college          TEXT,
  branch           TEXT,
  year             TEXT,
  department       TEXT,       -- for TPO
  employee_id      TEXT,       -- for TPO
  company          TEXT,       -- for Recruiter / Mentor
  designation      TEXT,       -- for Recruiter
  linkedin_url     TEXT,       -- for Recruiter
  current_role     TEXT,       -- for Mentor
  domain_expertise TEXT,       -- for Mentor (comma-separated)
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Row Level Security for now (backend is the gatekeeper)
-- In production: enable RLS and add proper policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Grant access to the anon role (used by supabase-py with publishable key)
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
