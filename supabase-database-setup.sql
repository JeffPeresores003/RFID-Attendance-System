-- ==========================================
-- RFID Attendance System - Supabase Database Setup
-- ==========================================
-- Run this script in your Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query)
-- ==========================================

-- Step 1: Create students table
-- ==========================================
CREATE TABLE IF NOT EXISTS students (
    id BIGSERIAL PRIMARY KEY,
    uid TEXT UNIQUE NOT NULL,
    student_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    registered_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE students IS 'Stores registered students with their RFID card UIDs';

-- Add column comments
COMMENT ON COLUMN students.uid IS 'Unique identifier from RFID card';
COMMENT ON COLUMN students.student_id IS 'School-issued student ID number';
COMMENT ON COLUMN students.full_name IS 'Student full name';
COMMENT ON COLUMN students.registered_by IS 'User ID who registered this student';

-- Step 2: Create attendance table
-- ==========================================
CREATE TABLE IF NOT EXISTS attendance (
    id BIGSERIAL PRIMARY KEY,
    uid TEXT NOT NULL,
    student_id TEXT,
    full_name TEXT,
    status TEXT DEFAULT 'Registered',
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE attendance IS 'Stores attendance records when RFID cards are scanned';

-- Add column comments
COMMENT ON COLUMN attendance.uid IS 'RFID card UID that was scanned';
COMMENT ON COLUMN attendance.status IS 'Registration status: Registered or Not Registered';
COMMENT ON COLUMN attendance.scanned_at IS 'Timestamp when the card was scanned';

-- Step 3: Create indexes for better performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_students_uid ON students(uid);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_uid ON attendance(uid);
CREATE INDEX IF NOT EXISTS idx_attendance_scanned_at ON attendance(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at DESC);

-- Step 4: Enable Row Level Security (RLS)
-- ==========================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies for Students Table
-- ==========================================

-- Allow authenticated users to view all students
DROP POLICY IF EXISTS "Authenticated users can view students" ON students;
CREATE POLICY "Authenticated users can view students" 
    ON students 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Allow authenticated users to insert students
DROP POLICY IF EXISTS "Authenticated users can insert students" ON students;
CREATE POLICY "Authenticated users can insert students" 
    ON students 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Allow authenticated users to update students
DROP POLICY IF EXISTS "Authenticated users can update students" ON students;
CREATE POLICY "Authenticated users can update students" 
    ON students 
    FOR UPDATE 
    TO authenticated 
    USING (true);

-- Allow authenticated users to delete students (optional)
DROP POLICY IF EXISTS "Authenticated users can delete students" ON students;
CREATE POLICY "Authenticated users can delete students" 
    ON students 
    FOR DELETE 
    TO authenticated 
    USING (true);

-- Step 6: Create RLS Policies for Attendance Table
-- ==========================================

-- Allow authenticated users to view all attendance records
DROP POLICY IF EXISTS "Authenticated users can view attendance" ON attendance;
CREATE POLICY "Authenticated users can view attendance" 
    ON attendance 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Allow authenticated users to insert attendance records
DROP POLICY IF EXISTS "Authenticated users can insert attendance" ON attendance;
CREATE POLICY "Authenticated users can insert attendance" 
    ON attendance 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Allow authenticated users to update attendance records
DROP POLICY IF EXISTS "Authenticated users can update attendance" ON attendance;
CREATE POLICY "Authenticated users can update attendance" 
    ON attendance 
    FOR UPDATE 
    TO authenticated 
    USING (true);

-- Allow authenticated users to delete attendance records (optional)
DROP POLICY IF EXISTS "Authenticated users can delete attendance" ON attendance;
CREATE POLICY "Authenticated users can delete attendance" 
    ON attendance 
    FOR DELETE 
    TO authenticated 
    USING (true);

-- Step 7: Create function to update updated_at timestamp
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for students table
-- ==========================================
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Create view for attendance with student info
-- ==========================================
CREATE OR REPLACE VIEW attendance_with_students AS
SELECT 
    a.id,
    a.uid,
    a.student_id,
    a.full_name,
    a.status,
    a.scanned_at,
    a.created_at,
    s.id as student_db_id,
    CASE 
        WHEN s.id IS NOT NULL THEN true 
        ELSE false 
    END as is_registered_student
FROM attendance a
LEFT JOIN students s ON a.uid = s.uid
ORDER BY a.scanned_at DESC;

-- Step 10: Create function to get attendance statistics
-- ==========================================
CREATE OR REPLACE FUNCTION get_attendance_stats(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_scans BIGINT,
    unique_students BIGINT,
    registered_scans BIGINT,
    unregistered_scans BIGINT,
    today_scans BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_scans,
        COUNT(DISTINCT uid)::BIGINT as unique_students,
        COUNT(*) FILTER (WHERE status = 'Registered')::BIGINT as registered_scans,
        COUNT(*) FILTER (WHERE status = 'Not Registered')::BIGINT as unregistered_scans,
        COUNT(*) FILTER (WHERE DATE(scanned_at) = CURRENT_DATE)::BIGINT as today_scans
    FROM attendance
    WHERE scanned_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Verification Queries
-- ==========================================
-- Run these to verify your setup:

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('students', 'attendance');

-- Check if indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('students', 'attendance');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('students', 'attendance');

-- Check if policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('students', 'attendance');

-- ==========================================
-- Sample Data (Optional - for testing)
-- ==========================================
-- Uncomment to insert sample data

-- INSERT INTO students (uid, student_id, full_name, registered_by) VALUES
-- ('04A1B2C3D4E5', '2024001', 'John Doe', auth.uid()),
-- ('05F6E7D8C9B0', '2024002', 'Jane Smith', auth.uid()),
-- ('06C7D8E9F0A1', '2024003', 'Bob Johnson', auth.uid());

-- INSERT INTO attendance (uid, student_id, full_name, status, scanned_at) VALUES
-- ('04A1B2C3D4E5', '2024001', 'John Doe', 'Registered', NOW() - INTERVAL '1 hour'),
-- ('05F6E7D8C9B0', '2024002', 'Jane Smith', 'Registered', NOW() - INTERVAL '30 minutes'),
-- ('06C7D8E9F0A1', '2024003', 'Bob Johnson', 'Registered', NOW() - INTERVAL '15 minutes');

-- ==========================================
-- Success!
-- ==========================================
-- Your database is now set up and ready to use!
-- 
-- Next steps:
-- 1. Configure your .env file with Supabase credentials
-- 2. Run the Node.js server
-- 3. Create your first user account
-- 4. Start scanning RFID cards!
-- ==========================================
