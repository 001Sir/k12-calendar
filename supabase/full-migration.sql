-- K12 Calendar Full Database Migration
-- Run this script to set up the complete database schema

-- First run the base schema
\i schema.sql

-- Then add missing tables (user_preferences, profile_views)
\i create-missing-tables.sql

-- Add parent features schema
\i parent-features-schema.sql

-- Add saved events functionality
\i create-saved-events.sql

-- Ensure we have analytics tables
\i advanced-analytics.sql

-- Apply any fixes
\i apply-fixes.sql

-- Verification queries
SELECT 'Tables created:' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;