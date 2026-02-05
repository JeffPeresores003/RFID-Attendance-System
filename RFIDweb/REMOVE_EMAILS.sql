-- REMOVE_EMAILS.sql
-- Run this in Supabase SQL Editor to remove email columns from custom tables

-- 1. Remove email column from teachers table
ALTER TABLE public.teachers 
DROP COLUMN IF EXISTS email;

-- 2. Remove email column from admin table  
ALTER TABLE public.admin 
DROP COLUMN IF EXISTS email;

-- 3. Update any existing records to ensure username is primary identifier
-- (This ensures all existing records have proper usernames)
UPDATE public.teachers 
SET username = COALESCE(username, 'teacher' || id) 
WHERE username IS NULL;

UPDATE public.admin 
SET username = COALESCE(username, 'admin' || id) 
WHERE username IS NULL;

-- 4. Make username columns NOT NULL and UNIQUE
ALTER TABLE public.teachers 
ALTER COLUMN username SET NOT NULL,
ADD CONSTRAINT teachers_username_unique UNIQUE (username);

ALTER TABLE public.admin 
ALTER COLUMN username SET NOT NULL,
ADD CONSTRAINT admin_username_unique UNIQUE (username);

-- 5. Create password reset function for admins
CREATE OR REPLACE FUNCTION reset_teacher_password(teacher_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    teacher_user_id UUID;
    teacher_auth_email TEXT;
BEGIN
    -- Get teacher's user_id and construct their auth email
    SELECT user_id INTO teacher_user_id 
    FROM public.teachers 
    WHERE username = teacher_username;
    
    IF teacher_user_id IS NULL THEN
        RETURN FALSE; -- Teacher not found
    END IF;
    
    -- Construct the auth email (username@local.app)
    teacher_auth_email := teacher_username || '@local.app';
    
    -- Reset password in auth.users table
    UPDATE auth.users 
    SET 
        encrypted_password = crypt('teacher123', gen_salt('bf')),
        updated_at = now()
    WHERE id = teacher_user_id 
    AND email = teacher_auth_email;
    
    RETURN FOUND;
END;
$$;

-- 6. Grant execute permission on password reset function to authenticated users
GRANT EXECUTE ON FUNCTION reset_teacher_password(TEXT) TO authenticated;

-- 7. Create view to check username availability
CREATE OR REPLACE VIEW username_check AS
SELECT username, 'teacher' as account_type FROM public.teachers
UNION ALL
SELECT username, 'admin' as account_type FROM public.admin;

GRANT SELECT ON username_check TO authenticated;

-- Verify the changes
SELECT 'Teachers table structure:' as info;
\d public.teachers;

SELECT 'Admin table structure:' as info;  
\d public.admin;

SELECT 'Current teachers:' as info;
SELECT id, username, full_name FROM public.teachers;

SELECT 'Current admins:' as info;
SELECT id, username, full_name FROM public.admin;