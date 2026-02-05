-- FIX_ADMIN_TRIGGER.sql
-- Run this in Supabase SQL Editor to fix the admin account creation issue

-- 1. First, check if there's a trigger function that handles new user creation
-- This will show existing triggers
SELECT tgname, tgrelid::regclass, tgtype 
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;

-- 2. Drop any existing trigger that might be causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Create or replace the trigger function to handle new users properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user role from metadata is 'admin'
  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    INSERT INTO public.admin (id, full_name, username, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'System Administrator'),
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      username = EXCLUDED.username,
      updated_at = NOW();
  
  -- Check if user role is 'teacher'
  ELSIF NEW.raw_user_meta_data->>'role' = 'teacher' THEN
    INSERT INTO public.teachers (id, user_id, full_name, username, grade, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Teacher'),
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      COALESCE((NEW.raw_user_meta_data->>'grade')::integer, 1),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      username = EXCLUDED.username,
      grade = EXCLUDED.grade,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Verify admin table structure has required columns
-- Add username column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'admin' 
                 AND column_name = 'username') THEN
    ALTER TABLE public.admin ADD COLUMN username VARCHAR(255);
  END IF;
END $$;

-- 6. Make sure the admin table has proper structure
-- Show current structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'admin';

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.admin TO authenticated;
GRANT ALL ON public.teachers TO authenticated;

SELECT 'Trigger fix applied! Try running addAdmin.js again.' as status;
