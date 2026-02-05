-- FIX_TEACHERS_TABLE.sql
-- Run this in Supabase SQL Editor

-- 1. Add missing columns to teachers table
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS username VARCHAR(255);

-- 2. Add missing columns to admin table
ALTER TABLE public.admin 
ADD COLUMN IF NOT EXISTS username VARCHAR(255);

-- 3. Update the trigger function to handle missing columns gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    INSERT INTO public.admin (id, full_name, username, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin'),
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      username = EXCLUDED.username,
      updated_at = NOW();
    
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
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Trigger error for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'teachers'
ORDER BY ordinal_position;

SELECT 'Teachers table fixed! Now create teachers from the dashboard.' as status;
