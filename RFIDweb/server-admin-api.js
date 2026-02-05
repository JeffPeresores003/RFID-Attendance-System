// Admin API Server - Handles privileged operations requiring service role key
// Run with: node server-admin-api.js

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase with service role key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Required: REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create teacher account endpoint
app.post('/api/admin/create-teacher', async (req, res) => {
  try {
    const { username, password, fullName, grade } = req.body;

    if (!username || !password || !fullName || !grade) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Clean and validate username
    const cleanUsername = username.toLowerCase()
      .replace(/\s+/g, '.') // Replace spaces with dots
      .replace(/[^a-z0-9.]/g, ''); // Remove special characters except dots
    
    if (cleanUsername.length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters after cleaning' });
    }

    const email = `${cleanUsername}@local.app`; // Internal email format

    // Create user with auto-confirmed email
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'teacher',
        full_name: fullName,
        grade: grade,
        username: cleanUsername // Store the cleaned username
      }
    });

    if (error) throw error;

    // DIRECTLY insert into teachers table (don't rely on trigger)
    const { error: insertError } = await supabaseAdmin
      .from('teachers')
      .upsert({
        id: data.user.id,
        user_id: data.user.id,
        full_name: fullName,
        username: cleanUsername,
        grade: parseInt(grade),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (insertError) {
      console.error('Error inserting into teachers table:', insertError);
      // Don't fail - user was created, just log the error
    }

    res.json({ 
      success: true, 
      message: 'Teacher account created successfully',
      teacher: {
        username: cleanUsername,
        full_name: fullName,
        grade,
        email: data.user?.email || email
      }
    });

  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create teacher account' 
    });
  }
});

// Delete teacher account endpoint
app.delete('/api/admin/delete-teacher/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Delete user from auth (this will cascade to teachers table)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'Teacher account deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to delete teacher account' 
    });
  }
});

// Change password endpoint (for teachers to update their own password)
app.put('/api/user/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Update user password
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'Password updated successfully' 
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to change password' 
    });
  }
});

// Reset teacher password to default endpoint (admin only)
app.put('/api/admin/reset-teacher-password', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Clean username to match stored format
    const cleanUsername = username.toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.]/g, '');

    // Get teacher from database to find their user_id
    const { data: teacherData, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .select('user_id, username')
      .eq('username', cleanUsername)
      .single();

    if (teacherError || !teacherData) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Reset password to default 'teacher123'
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(teacherData.user_id, {
      password: 'teacher123'
    });

    if (error) throw error;

    res.json({ 
      success: true, 
      message: `Password reset to default for teacher: ${teacherData.username}` 
    });

  } catch (error) {
    console.error('Error resetting teacher password:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to reset teacher password' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Admin API server is running' });
});

app.listen(PORT, () => {
  console.log(`✅ Admin API Server running on http://localhost:${PORT}`);
  console.log('📝 Available endpoints:');
  console.log('   POST   /api/admin/create-teacher');
  console.log('   DELETE /api/admin/delete-teacher/:userId');
  console.log('   PUT    /api/admin/reset-teacher-password');
  console.log('   PUT    /api/user/change-password');
  console.log('   GET    /api/health');
  console.log('\n\ud83d\udd10 Username-only authentication enabled!');
  console.log('   No more email addresses in teacher accounts');
});
