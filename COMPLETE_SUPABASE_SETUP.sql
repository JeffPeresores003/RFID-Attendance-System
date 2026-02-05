-- ============================================
-- COMPLETE SUPABASE SETUP FOR RFID ATTENDANCE SYSTEM
-- San Jose Elementary School
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: CREATE TABLES
-- ============================================

-- 1. Create students table
CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  uid VARCHAR(50) UNIQUE NOT NULL,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  grade INTEGER CHECK (grade >= 1 AND grade <= 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id BIGSERIAL PRIMARY KEY,
  uid VARCHAR(50) NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  grade INTEGER CHECK (grade >= 1 AND grade <= 6),
  full_name VARCHAR(255) NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- 3. Create teachers table (for teacher authentication accounts)
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Create admin table (for system administrator accounts)
CREATE TABLE IF NOT EXISTS admin (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- PART 2: CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_students_uid ON students(uid);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_scanned_at ON attendance(scanned_at);
CREATE INDEX IF NOT EXISTS idx_attendance_grade ON attendance(grade);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_grade ON teachers(grade);
CREATE INDEX IF NOT EXISTS idx_admin_email ON admin(email);

-- ============================================
-- PART 3: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 4: CREATE RLS POLICIES FOR STUDENTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Teachers can view all students" ON students;
DROP POLICY IF EXISTS "Teachers can insert students" ON students;
DROP POLICY IF EXISTS "Teachers can update students" ON students;
DROP POLICY IF EXISTS "Teachers can delete students" ON students;
DROP POLICY IF EXISTS "Admins can view all students" ON students;
DROP POLICY IF EXISTS "Admins can update students" ON students;

CREATE POLICY "Teachers can view all students"
  ON students FOR SELECT
  USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.id = auth.uid()));

CREATE POLICY "Teachers can insert students"
  ON students FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM teachers WHERE teachers.id = auth.uid()));

CREATE POLICY "Teachers can update students"
  ON students FOR UPDATE
  USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.id = auth.uid()));

CREATE POLICY "Teachers can delete students"
  ON students FOR DELETE
  USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.id = auth.uid()));

CREATE POLICY "Admins can view all students"
  ON students FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

CREATE POLICY "Admins can update students"
  ON students FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- ============================================
-- PART 5: CREATE RLS POLICIES FOR ATTENDANCE TABLE
-- ============================================

DROP POLICY IF EXISTS "Teachers can view all attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can insert attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can view all attendance" ON attendance;

CREATE POLICY "Teachers can view all attendance"
  ON attendance FOR SELECT
  USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.id = auth.uid()));

CREATE POLICY "Teachers can insert attendance"
  ON attendance FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM teachers WHERE teachers.id = auth.uid()));

CREATE POLICY "Admins can view all attendance"
  ON attendance FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- ============================================
-- PART 6: CREATE RLS POLICIES FOR TEACHERS TABLE
-- ============================================

DROP POLICY IF EXISTS "Teachers can view their own profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can update their own profile" ON teachers;
DROP POLICY IF EXISTS "Admins can view all teachers" ON teachers;
DROP POLICY IF EXISTS "Admins can update teachers" ON teachers;
DROP POLICY IF EXISTS "Admins can insert teachers" ON teachers;
DROP POLICY IF EXISTS "Admins can delete teachers" ON teachers;

CREATE POLICY "Teachers can view their own profile"
  ON teachers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Teachers can update their own profile"
  ON teachers FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all teachers"
  ON teachers FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

CREATE POLICY "Admins can insert teachers"
  ON teachers FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

CREATE POLICY "Admins can update teachers"
  ON teachers FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

CREATE POLICY "Admins can delete teachers"
  ON teachers FOR DELETE
  USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- ============================================
-- PART 7: CREATE RLS POLICIES FOR ADMIN TABLE
-- ============================================

DROP POLICY IF EXISTS "Admins can view their own profile" ON admin;
DROP POLICY IF EXISTS "Admins can update their own profile" ON admin;

CREATE POLICY "Admins can view their own profile"
  ON admin FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can update their own profile"
  ON admin FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- PART 8: CREATE TRIGGER FUNCTION FOR AUTO PROFILE CREATION
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'teacher');
  
  IF user_role = 'admin' THEN
    -- Create admin profile
    INSERT INTO public.admin (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
  ELSE
    -- Create teacher profile
    INSERT INTO public.teachers (id, email, full_name, grade)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      CAST(NEW.raw_user_meta_data->>'grade' AS INTEGER)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 9: CREATE TRIGGER FOR AUTOMATIC PROFILE CREATION
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PART 10: INSERT SAMPLE DATA (OPTIONAL)
-- ============================================

-- Sample students
INSERT INTO students (uid, student_id, full_name, grade) VALUES
  ('ABC123DEF', '2021-001', 'Maria Santos', 6),
  ('XYZ789GHI', '2021-002', 'Juan Dela Cruz', 6),
  ('LMN456OPQ', '2021-003', 'Ana Garcia', 5)
ON CONFLICT (uid) DO NOTHING;

-- Sample attendance records
INSERT INTO attendance (uid, student_id, full_name, grade, scanned_at) VALUES
  ('ABC123DEF', '2021-001', 'Maria Santos', 6, NOW() - INTERVAL '2 hours'),
  ('XYZ789GHI', '2021-002', 'Juan Dela Cruz', 6, NOW() - INTERVAL '1 hour'),
  ('ABC123DEF', '2021-001', 'Maria Santos', 6, NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Create admin user in Supabase Authentication manually
-- 2. Admin creates teacher accounts through the System Admin dashboard
-- 3. Teachers register their students in the Dashboard
-- 4. Admin registers RFID cards for students
-- ============================================

-- IMPORTANT SETUP INSTRUCTIONS:
-- After running this script:
-- 1. Go to Supabase Authentication > Users
-- 2. Click "Add User" and create System Administrator:
--    - Email: admin@school.com
--    - Password: admin123
--    - User Metadata (JSON):
--      {
--        "role": "admin",
--        "full_name": "System Administrator"
--      }
-- 3. The trigger will automatically create the admin profile
-- 
-- SYSTEM WORKFLOW:
-- 1. Admin logs in to System Administrator portal
-- 2. Admin creates teacher accounts (username, password, full name, grade)
-- 3. Teachers log in to Teacher portal
-- 4. Teachers register students (student ID, full name, grade)
-- 5. Admin registers RFID cards for students (in RFID Registration tab)
-- 6. Teachers scan RFID cards for attendance
-- 
-- GRADE SYSTEM:
-- - Teachers are assigned to specific grades (1-6)
-- - Students are registered by teachers and belong to grades (1-6)
-- - Teachers can only manage students in their grade
-- - System Admin can register RFID cards for any student
-- - Only students with registered RFID cards can be scanned for attendance
-- 
-- USER ACCOUNTS:
-- - Admins: Stored in 'admin' table (separate from teachers)
-- - Teachers: Stored in 'teachers' table with grade assignments
-- - Students: NO authentication accounts (only in students table)
-- - All student data is managed by teachers through the Dashboard
