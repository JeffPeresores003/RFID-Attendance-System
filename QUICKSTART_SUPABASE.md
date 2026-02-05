# RFID Attendance System - Quick Start for Supabase

This is a quick reference guide for setting up Supabase. For detailed instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## Quick Setup (5 minutes)

### 1. Get Supabase Credentials
- Create account at [supabase.com](https://supabase.com)
- Create new project
- Go to Settings → API
- Copy: URL, anon key, service_role key

### 2. Setup Database
- Go to SQL Editor in Supabase
- Copy contents of `supabase-database-setup.sql`
- Paste and run

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 4. Install & Run
```bash
npm install
node server-supabase.js
```

### 5. First Login
- Open http://localhost:3000
- Click "Sign up"
- Create your account
- Login and start using!

## Files

- `login.html` - Authentication page
- `index.html` - Main dashboard (requires login)
- `server-supabase.js` - Server with Supabase
- `server.js` - Original local-only server (backup)

## Switching Between Versions

**Use Supabase version:**
```bash
node server-supabase.js
```

**Use local-only version:**
```bash
node server.js
```

## Features

✅ Secure login/signup  
✅ Cloud database  
✅ Real-time updates  
✅ Multi-device access  
✅ Automatic backups  
✅ CSV downloads  
✅ Student registration  
✅ Attendance tracking  

---

📖 **Full documentation:** [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
