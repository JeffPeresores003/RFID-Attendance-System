# 🚀 Supabase Setup Guide - San Jose Elementary School RFID Attendance System

## Step 1: Get Your Supabase API Keys

1. Go to your Supabase project: https://supabase.com/dashboard/project/bzwhewglvcxssnvebliw
2. Click on **Settings** (gear icon) in the left sidebar
3. Click on **API** under Configuration
4. Copy these two values:
   - **Project URL**: `https://bzwhewglvcxssnvebliw.supabase.co`
   - **anon public key**: (a long string starting with "eyJ...")

## Step 2: Update .env File

1. Open `RFIDweb/.env` file
2. Replace `your_anon_key_here` with your actual anon key:
   ```
   REACT_APP_SUPABASE_URL=https://bzwhewglvcxssnvebliw.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Step 3: Create Database Tables

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire content from `supabase_setup.sql` file
5. Paste it into the SQL editor
6. Click **Run** button (or press Ctrl+Enter)
7. You should see "Success. No rows returned" - this is correct!

## Step 4: Create Teacher Account

Since we're using Row Level Security, you need to create a teacher account first:

1. Go to **Authentication** > **Users** in Supabase Dashboard
2. Click **Add user** > **Create new user**
3. Fill in:
   - **Email**: `teacher@school.com`
   - **Password**: `teacher123`
   - **Auto Confirm User**: ✅ (check this box)
4. Click **Create user**
5. After creation, you'll see the new user. **Copy their UUID** (long ID like `123e4567-e89b-12d3-a456-426614174000`)

## Step 5: Set Teacher Role in Profiles Table

1. Go to **Table Editor** in Supabase Dashboard
2. Select **profiles** table
3. Find the row with the teacher's UUID (the one you just copied)
4. Click on the row to edit
5. Change these values:
   - **role**: `teacher`
   - **full_name**: `John Teacher` (or any name you want)
6. Click **Save**

## Step 6: Install Supabase Package (if not installed)

Open terminal in `RFIDweb` folder and run:
```bash
npm install @supabase/supabase-js
```

## Step 7: Update Your Code

I'll update these files for you:
- ✅ `supabaseClient.js` - Connect to real Supabase
- ✅ `AuthContext.js` - Use real Supabase authentication
- ✅ `Dashboard.js` - Fetch from real database
- ✅ `StudentDashboard.js` - Fetch from real database

## Step 8: Test Your Setup

1. Stop your React app if it's running (Ctrl+C in terminal)
2. Start it again:
   ```bash
   cd RFIDweb
   npm start
   ```
3. Try logging in with:
   - **Teacher Portal**: `teacher@school.com` / `teacher123`

## Step 9: Create Student Accounts

### Option A: Through Supabase Dashboard (Manual)
1. **Authentication** > **Users** > **Add user**
2. Create student with email like `student@school.com` / `student123`
3. After creation, go to **Table Editor** > **profiles**
4. Set their **role** to `student` and **student_id** to `2021-001`

### Option B: Through Sign Up Flow (Recommended)
I can add a sign-up page where students self-register. Let me know if you want this!

## Common Issues & Solutions

### Issue: "Invalid API key"
- **Solution**: Double-check your anon key in `.env` file
- Make sure to restart React app after changing `.env`

### Issue: "Row Level Security" errors
- **Solution**: Make sure you ran the SQL setup script completely
- Check that teacher account has `role='teacher'` in profiles table

### Issue: Login not working
- **Solution**: Make sure teacher account was created and confirmed in Supabase
- Check browser console (F12) for error messages

### Issue: Can't see attendance/students
- **Solution**: RLS policies require correct role. Check:
  1. User is logged in
  2. User has correct role in profiles table
  3. SQL policies were created successfully

## Next Steps

After setup is complete:
- 🔐 Update backend server (`server-supabase.js`) to connect Arduino RFID reader
- 👨‍🎓 Add student self-registration page
- 📧 Add email verification for new accounts
- 🔒 Add password reset functionality

---

## Need Help?

If you encounter any issues:
1. Check browser console (F12) for errors
2. Check Supabase logs in Dashboard > Logs
3. Make sure .env file has correct credentials
4. Restart React app after any .env changes

Let me know when you're ready for me to update the code files! 🚀
