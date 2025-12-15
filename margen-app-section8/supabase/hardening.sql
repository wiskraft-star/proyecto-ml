-- ============================================================
-- Section 8 - Supabase Hardening (recommended baseline)
-- Goal: prevent direct access to app.* tables from anon/auth roles.
-- The Next.js app uses the Service Role key on the server for DB writes/reads.
--
-- IMPORTANT:
-- - Run in Supabase SQL Editor with an admin role.
-- - Service role bypasses RLS. Enabling RLS here is defense-in-depth.
-- ============================================================

-- 1) Lock down schema usage (optional but recommended)
REVOKE ALL ON SCHEMA app FROM anon, authenticated;

-- 2) Lock down all tables and sequences + enable RLS (defense-in-depth)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'app') LOOP
    EXECUTE format('REVOKE ALL ON TABLE app.%I FROM anon, authenticated;', r.tablename);
    EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;

  FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'app') LOOP
    EXECUTE format('REVOKE ALL ON SEQUENCE app.%I FROM anon, authenticated;', r.sequencename);
  END LOOP;
END $$;

-- 3) If you later need authenticated READ access to some table(s),
-- create explicit SELECT policies per table (do NOT open everything).
-- Example:
-- CREATE POLICY "authenticated_read_settings"
--   ON app.settings
--   FOR SELECT
--   TO authenticated
--   USING (true);
