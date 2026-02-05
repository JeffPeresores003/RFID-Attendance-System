-- ============================================
-- DATABASE UPDATES FOR USERNAME-BASED LOGIN
-- San Jose Elementary School RFID Attendance System
-- Run this script in Supabase SQL Editor
-- ============================================

-- Add username columns to existing tables
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE admin ADD COLUMN IF NOT EXISTS username VARCHAR(100);

-- Create indexes for username lookups
CREATE INDEX IF NOT EXISTS idx_teachers_username ON teachers(username);
CREATE INDEX IF NOT EXISTS idx_admin_username ON admin(username);

-- Update existing records to extract username from email
-- For teachers table
UPDATE teachers 
SET username = REPLACE(REPLACE(email, '@school.com', ''), '.', '')
WHERE username IS NULL;

-- For admin table  
UPDATE admin 
SET username = REPLACE(REPLACE(email, '@school.com', ''), '.', '')
WHERE username IS NULL;

-- Update the trigger function to also store username
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  clean_username TEXT;
BEGIN
  -- Extract username from email
  clean_username := REPLACE(REPLACE(NEW.email, '@school.com', ''), '.', '');
  
  -- Check user role and insert into appropriate table
  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    INSERT INTO public.admin (id, email, full_name, username)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      clean_username
    );
  ELSE
    INSERT INTO public.teachers (id, email, full_name, grade, username)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      COALESCE((NEW.raw_user_meta_data->>'grade')::integer, 1),
      clean_username
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the updates
SELECT 'Teachers with usernames:' as info, count(*) as count FROM teachers WHERE username IS NOT NULL;
SELECT 'Admins with usernames:' as info, count(*) as count FROM admin WHERE username IS NOT NULL;

-- Show sample data
SELECT 'Sample Teachers:' as info;
SELECT email, username, full_name FROM teachers LIMIT 3;

SELECT 'Sample Admins:' as info;
SELECT email, username, full_name FROM admin LIMIT 3;

-- ============================================
-- NOTES:
-- ============================================
-- 1. This script adds username support to existing tables
-- 2. Usernames are extracted from emails by removing '@school.com' and replacing dots
-- 3. The trigger function now stores usernames for new users
-- 4. Existing data is migrated automatically
-- 5. Frontend now accepts usernames and converts them to emails for authentication
-- ============================================