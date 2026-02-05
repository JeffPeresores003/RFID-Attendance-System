import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Keep mock database for reference/testing if needed
export const mockDatabase = {
  users: [
    {
      id: 'teacher-001',
      email: 'teacher@school.com',
      password: 'teacher123',
      role: 'teacher',
      full_name: 'John Teacher'
    },
    {
      id: 'student-001',
      email: 'student@school.com',
      password: 'student123',
      role: 'student',
      full_name: 'Maria Santos',
      student_id: '2021-001'
    },
    {
      id: 'student-002',
      email: 'juan@school.com',
      password: 'student123',
      role: 'student',
      full_name: 'Juan Dela Cruz',
      student_id: '2021-002'
    }
  ],
  students: [
    {
      id: 1,
      uid: 'ABC123DEF',
      student_id: '2021-001',
      full_name: 'Maria Santos',
      created_at: '2024-01-15T08:30:00Z'
    },
    {
      id: 2,
      uid: 'XYZ789GHI',
      student_id: '2021-002',
      full_name: 'Juan Dela Cruz',
      created_at: '2024-01-15T09:00:00Z'
    },
    {
      id: 3,
      uid: 'LMN456OPQ',
      student_id: '2021-003',
      full_name: 'Ana Garcia',
      created_at: '2024-01-15T09:15:00Z'
    }
  ],
  attendance: [
    {
      id: 1,
      uid: 'ABC123DEF',
      student_id: '2021-001',
      full_name: 'Maria Santos',
      scanned_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    },
    {
      id: 2,
      uid: 'XYZ789GHI',
      student_id: '2021-002',
      full_name: 'Juan Dela Cruz',
      scanned_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
    },
    {
      id: 3,
      uid: 'ABC123DEF',
      student_id: '2021-001',
      full_name: 'Maria Santos',
      scanned_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
    },
    {
      id: 4,
      uid: 'LMN456OPQ',
      student_id: '2021-003',
      full_name: 'Ana Garcia',
      scanned_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 min ago
    }
  ]
};

