# RFID Attendance System with Supabase Authentication

## 🚀 Setup Guide

### Prerequisites
- Node.js installed
- Arduino with RFID-RC522 module
- Supabase account (free tier available)

---

## 📋 Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- `@supabase/supabase-js` - Supabase client
- `dotenv` - Environment variable management
- Express, Socket.IO, SerialPort, etc.

---

## 🔧 Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Project Name**: `rfid-attendance`
   - **Database Password**: (create a strong password)
   - **Region**: Choose closest to you
5. Wait for the project to be created (~2 minutes)

### 2.2 Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbG...`)
   - **service_role key** (starts with `eyJhbG...`)  ⚠️ Keep this secret!

### 2.3 Create Database Tables

Go to **SQL Editor** in your Supabase dashboard and run this SQL:

```sql
-- Create students table
CREATE TABLE students (
    id BIGSERIAL PRIMARY KEY,
    uid TEXT UNIQUE NOT NULL,
    student_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    registered_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE attendance (
    id BIGSERIAL PRIMARY KEY,
    uid TEXT NOT NULL,
    student_id TEXT,
    full_name TEXT,
    status TEXT DEFAULT 'Registered',
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_students_uid ON students(uid);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_attendance_uid ON attendance(uid);
CREATE INDEX idx_attendance_scanned_at ON attendance(scanned_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- Students table policies
CREATE POLICY "Authenticated users can view students" 
    ON students FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Authenticated users can insert students" 
    ON students FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update students" 
    ON students FOR UPDATE 
    TO authenticated 
    USING (true);

-- Attendance table policies
CREATE POLICY "Authenticated users can view attendance" 
    ON attendance FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Authenticated users can insert attendance" 
    ON attendance FOR INSERT 
    TO authenticated 
    WITH CHECK (true);
```

### 2.4 Enable Email Authentication

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Make sure **Email** provider is enabled (it should be by default)
3. Optional: Configure email templates under **Email Templates**

---

## 🔐 Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   PORT=3000
   ```

⚠️ **Important**: NEVER commit your `.env` file to version control!

---

## 🔌 Step 4: Configure Arduino

Make sure your Arduino is connected and update the COM port in `server-supabase.js`:

```javascript
// Line ~250 in server-supabase.js
port = new SerialPort({ path: "COM3", baudRate: 9600 });
```

Change `COM3` to your actual port:
- **Windows**: `COM3`, `COM4`, etc.
- **Mac/Linux**: `/dev/ttyUSB0` or `/dev/cu.usbserial-*`

To find your port:
- **Windows**: Device Manager → Ports
- **Mac**: Run `ls /dev/cu.*` in terminal
- **Linux**: Run `ls /dev/ttyUSB*` in terminal

---

## 🚀 Step 5: Run the Application

### Option 1: Use the New Supabase Server

```bash
node server-supabase.js
```

### Option 2: Update Main Server File

If you want to replace the old server:

```bash
# Backup original
mv server.js server-local.js

# Use Supabase version
mv server-supabase.js server.js

# Run normally
npm start
```

The server will start on `http://localhost:3000`

---

## 🎯 Step 6: First Login

1. Open `http://localhost:3000` in your browser
2. Click **"Sign up"**
3. Enter your details:
   - Full Name
   - Email Address
   - Password (minimum 6 characters)
4. Click **"Sign Up"**
5. Go back to **Login** and sign in with your credentials
6. You'll be redirected to the dashboard!

---

## 📱 Usage Guide

### Register a New Student

1. Click **"Register Student"** button
2. Scan the RFID card
3. Enter Student ID and Full Name in the prompts
4. The student is now registered!

### Track Attendance

1. Just scan registered RFID cards
2. Attendance is automatically recorded
3. View real-time updates on the dashboard
4. Download CSV reports anytime

### Pause/Resume Scanning

- Click **"Pause Scanning"** to temporarily stop recording
- Click **"Resume Scanning"** to continue

### Logout

- Click the **Logout** button in the top-right corner

---

## 🗄️ Data Storage

Your system now uses **dual storage**:

1. **Supabase Cloud Database** (primary)
   - Students table
   - Attendance records
   - Real-time sync across devices
   - Automatic backups

2. **Local Files** (backup)
   - `students.json` - Student registry
   - `attendance.csv` - Attendance log
   - Used if Supabase is unavailable

---

## 🔒 Security Features

✅ **User Authentication**
- Secure login/signup
- Password encryption
- Session management

✅ **Protected Routes**
- All API endpoints require authentication
- JWT token validation
- User-specific data access

✅ **Row Level Security (RLS)**
- Database-level security policies
- Prevents unauthorized access
- Automatic in Supabase

---

## 📊 Database Schema

### Students Table
```
id              | BIGSERIAL (Primary Key)
uid             | TEXT (RFID Card UID)
student_id      | TEXT (School ID)
full_name       | TEXT
registered_by   | UUID (Who registered this student)
created_at      | TIMESTAMP
updated_at      | TIMESTAMP
```

### Attendance Table
```
id              | BIGSERIAL (Primary Key)
uid             | TEXT (RFID Card UID)
student_id      | TEXT
full_name       | TEXT
status          | TEXT ('Registered' or 'Not Registered')
scanned_at      | TIMESTAMP (When card was scanned)
created_at      | TIMESTAMP
```

---

## 🐛 Troubleshooting

### Arduino Not Connecting
- Check if correct COM port is specified
- Verify Arduino is properly connected
- Make sure RFID module is wired correctly
- Try unplugging and replugging the Arduino

### Authentication Errors
- Verify `.env` file has correct Supabase credentials
- Check if Supabase project is active
- Make sure email provider is enabled in Supabase

### Database Connection Issues
- Check Supabase project status
- Verify API keys are correct and not expired
- Check internet connection
- Review Supabase logs in dashboard

### Cannot Log In
- Verify you signed up with correct email
- Check password (minimum 6 characters)
- Clear browser cache and cookies
- Try incognito/private mode

---

## 🎨 Customization

### Change COM Port
Edit `server-supabase.js` line ~250:
```javascript
port = new SerialPort({ path: "YOUR_PORT", baudRate: 9600 });
```

### Change Server Port
Edit `.env`:
```env
PORT=8080
```

### Customize Email Templates
Go to **Supabase Dashboard** → **Authentication** → **Email Templates**

---

## 📈 Future Enhancements

Potential features to add:
- [ ] Student profiles with photos
- [ ] Attendance reports and analytics
- [ ] SMS/Email notifications
- [ ] Multiple campus support
- [ ] Mobile app
- [ ] Facial recognition backup
- [ ] Export to Excel
- [ ] Attendance schedules
- [ ] Late arrival tracking
- [ ] Admin roles and permissions

---

## 🆘 Support

If you encounter issues:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review Supabase documentation: [https://supabase.com/docs](https://supabase.com/docs)
3. Check server console for error messages
4. Verify all dependencies are installed

---

## 📄 Files Overview

```
├── login.html              # Login/Signup page
├── index.html              # Main dashboard (protected)
├── server-supabase.js      # Backend server with Supabase
├── server.js               # Original local-only server
├── package.json            # Dependencies
├── .env                    # Environment variables (create this)
├── .env.example            # Environment template
├── students.json           # Local backup of students
├── attendance.csv          # Local backup of attendance
└── Arduino/
    └── RFID_attendance/
        └── RFID_attendance.ino  # Arduino code
```

---

## 🎓 Educational Benefits

This system teaches:
- ✅ IoT integration (Arduino + RFID)
- ✅ Real-time web applications (Socket.IO)
- ✅ User authentication (Supabase Auth)
- ✅ Cloud databases (Supabase/PostgreSQL)
- ✅ RESTful API design
- ✅ Security best practices
- ✅ Full-stack development

---

## ⚡ Quick Start Checklist

- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] Supabase account created
- [ ] Database tables created (SQL script run)
- [ ] `.env` file configured with Supabase keys
- [ ] Arduino connected and COM port configured
- [ ] Server started (`node server-supabase.js`)
- [ ] First user account created
- [ ] Login successful
- [ ] Test RFID scan

---

**Congratulations! Your RFID Attendance System with Supabase authentication is ready! 🎉**
