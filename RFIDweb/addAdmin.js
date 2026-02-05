// addAdmin.js - Script to create System Administrator account
// Run this with: node addAdmin.js

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
require('dotenv').config(); // Load .env from current directory

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing environment variables!');
  console.error('Make sure you have:');
  console.error('  - REACT_APP_SUPABASE_URL in .env');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY in .env');
  console.error('\nYou can find the Service Role Key in:');
  console.error('  Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to clean and validate username
function cleanUsername(username) {
  return username
    .toLowerCase()
    .replace(/\s+/g, '.') // Replace spaces with dots
    .replace(/[^a-z0-9.-]/g, ''); // Remove special chars except dots and dashes
}

// Function to prompt for user input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createAdminAccount() {
  console.log('🔧 Creating System Administrator account...\n');
  console.log('📝 Please provide the following information:\n');

  try {
    // Get username input
    const rawUsername = await prompt('Enter admin username: ');
    if (!rawUsername.trim()) {
      console.error('❌ Username cannot be empty!');
      rl.close();
      return;
    }

    const username = cleanUsername(rawUsername);
    console.log(`   Cleaned username: ${username}`);

    // Get full name input
    const fullName = await prompt('Enter full name (default: System Administrator): ');
    const adminFullName = fullName.trim() || 'System Administrator';

    // Get password input (with default)
    const password = await prompt('Enter password (default: admin123): ');
    const adminPassword = password.trim() || 'admin123';

    const adminEmail = `${username}@local.app`; // Internal auth email format

    console.log('\n🔐 Account Summary:');
    console.log(`   Username: ${username}`);
    console.log(`   Full Name: ${adminFullName}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('   (Email is internal only - not visible to users)');
    
    const confirm = await prompt('\nProceed with account creation? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Account creation cancelled.');
      rl.close();
      return;
    }

    // Create the admin user with auth.admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        role: 'admin',
        full_name: adminFullName,
        username: username
      }
    });

    if (error) {
      console.error('❌ Error creating admin account:', error.message);
      console.error('   Full error:', JSON.stringify(error, null, 2));
      
      if (error.message.includes('already registered')) {
        console.log('\n💡 Admin account already exists!');
        console.log('   You can log in with:');
        console.log(`   Username: ${username}`);
        console.log(`   Password: ${adminPassword}`);
      } else if (error.message.includes('Database error')) {
        console.log('\n💡 This usually means:');
        console.log('   1. A user with this email already exists in auth.users');
        console.log('   2. A database trigger is failing');
        console.log('\n🔧 To fix:');
        console.log('   - Go to Supabase Dashboard → Authentication → Users');
        console.log(`   - Delete any user with email: ${adminEmail}`);
        console.log('   - Go to Table Editor → admin table');
        console.log('   - Delete any existing admin rows');
        console.log('   - Run this script again');
      }
      
      rl.close();
      return;
    }

    console.log('✅ Admin account created successfully!');
    console.log('\n📋 Account Details:');
    console.log(`   Username: ${username}`);
    console.log(`   Full Name: ${adminFullName}`);
    console.log(`   User ID: ${data.user.id}`);
    console.log('\n🎉 You can now log in via the Administrator portal!');
    console.log('   Login using your USERNAME only (no email needed)');
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  } finally {
    rl.close();
  }
}

// Run the script
createAdminAccount();
