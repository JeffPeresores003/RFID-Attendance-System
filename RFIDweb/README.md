# RFID Attendance System - React Web App Setup

## 🚀 Quick Start Guide

This is a **React web application** with **JavaScript** and **Supabase** for your RFID Attendance System.

---

## 📁 Project Structure

```
react-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Login.js           # Login/Signup page
│   │   ├── Auth.css           # Auth styles
│   │   ├── Dashboard.js       # Main dashboard
│   │   └── Dashboard.css      # Dashboard styles
│   ├── contexts/
│   │   └── AuthContext.js     # Authentication context
│   ├── App.js                 # Main app with routing
│   ├── index.js               # React entry point
│   ├── index.css              # Global styles
│   └── supabaseClient.js      # Supabase configuration
├── package.json
├── .env.example
└── .gitignore
```

---

## 🔧 Step 1: Setup Supabase

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in project details
5. Wait ~2 minutes for project creation

### 1.2 Get Your API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbG...`)

### 1.3 Create Database Tables

Go to **SQL Editor** and run this:

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

-- Add indexes
CREATE INDEX idx_students_uid ON students(uid);
CREATE INDEX idx_attendance_scanned_at ON attendance(scanned_at DESC);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view students" 
    ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert students" 
    ON students FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view attendance" 
    ON attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert attendance" 
    ON attendance FOR INSERT TO authenticated WITH CHECK (true);
```

---

## 💻 Step 2: Setup React App

### 2.1 Install Dependencies

```bash
cd react-app
npm install
```

This installs:
- React & React Router
- **Tailwind CSS** (utility-first CSS framework)
- Supabase JS client
- Socket.IO client (for Arduino communication)

### 2.2 Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
REACT_APP_SERVER_URL=http://localhost:3000
```

**⚠️ Important:** 
- Replace with YOUR actual Supabase URL and key
- The `REACT_APP_SERVER_URL` points to your Node.js backend (for Arduino)
- NEVER commit `.env` to Git!

---

## 🔌 Step 3: Setup Backend Server (for Arduino)

The React app needs the Node.js backend running for Arduino/RFID communication.

### 3.1 Use the Supabase-enabled server

Navigate back to the root directory and use the `server-supabase.js`:

```bash
cd ..
node server-supabase.js
```

The backend runs on `http://localhost:3000` and handles:
- Arduino/RFID serial port communication
- Socket.IO real-time updates
- CSV downloads

---

## 🎯 Step 4: Run the React App

In a **new terminal**, from the `react-app` directory:

```bash
npm start
```

The app will open at `http://localhost:3000` (or another port if 3000 is taken).

---

## 🎓 Step 5: First Login

1. The React app opens in your browser
2. Click **"Sign up"**
3. Enter:
   - Full Name
   - Email Address
   - Password (min 6 characters)
4. Click **"Sign Up"**
5. Switch to **Login** and sign in
6. You'll be redirected to the Dashboard!

---

## 📱 How to Use

### Register a New Student

1. Click **"Register Student"** button
2. Scan the RFID card with Arduino
3. Enter Student ID when prompted
4. Enter Full Name when prompted
5. Student is registered in Supabase!

### Track Attendance

1. Just scan RFID cards
2. Attendance automatically recorded to Supabase
3. Real-time updates in the dashboard
4. View statistics and recent scans

### Download Reports

- Click **"Download CSV"** to get attendance report

### Pause/Resume Scanning

- Click **"Pause Scanning"** to temporarily stop
- Click **"Resume Scanning"** to continue

### Logout

- Click **"Logout"** button in top-right

---

## 🔗 Connecting to Your Supabase

### You DON'T need to give me your account!

Just follow these steps:

1. **Get Your Credentials:**
   - Supabase Dashboard → Settings → API
   - Copy URL and anon key

2. **Add to `.env` file:**
   ```env
   REACT_APP_SUPABASE_URL=your_url_here
   REACT_APP_SUPABASE_ANON_KEY=your_key_here
   ```

3. **That's it!** The app connects automatically.

### Security Notes:

✅ **anon key** is safe to use in frontend (it's public)  
✅ Row Level Security (RLS) protects your data  
✅ Only authenticated users can access data  
❌ **NEVER** share your service_role key in frontend  

---

## 🏗️ Architecture

```
┌─────────────────┐
│   React App     │  ← Users interact here
│  (localhost:3001) │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────┐
│    Supabase     │  │  Node.js     │
│   (Database &   │  │  Backend     │
│     Auth)       │  │ (localhost:  │
└─────────────────┘  │   3000)     │
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Arduino    │
                     │  + RFID RC522│
                     └──────────────┘
```

### Data Flow:

1. **Authentication:** React ↔ Supabase Auth
2. **Database:** React ↔ Supabase Database
3. **RFID Scans:** Arduino → Node.js → Socket.IO → React → Supabase

---

## 🎨 Features

✅ **Authentication**
- Secure login/signup
- Session management
- Protected routes

✅ **Real-time Updates**
- Live attendance tracking
- Socket.IO integration
- Instant notifications

✅ **Cloud Database**
- Supabase PostgreSQL
- Automatic backups
- Multi-device access

✅ **Beautiful UI**
- Modern React design
- Responsive layout
- Smooth animations

✅ **RFID Integration**
- Arduino support
- Student registration
- Attendance tracking

---

## 🐛 Troubleshooting

### React App Won't Start

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### "Missing Supabase environment variables"

- Make sure you created `.env` file
- Check that variable names start with `REACT_APP_`
- Restart the React app after editing `.env`

### Can't Connect to Backend

- Make sure Node.js server is running on port 3000
- Check `REACT_APP_SERVER_URL` in `.env`
- Verify CORS is enabled in backend

### Authentication Not Working

- Verify Supabase credentials are correct
- Check if Email provider is enabled in Supabase
- Clear browser cache and try again

### Arduino Not Connecting

- Make sure `server-supabase.js` is running
- Check COM port in server code
- Verify Arduino is plugged in

---

## 📦 Technologies Used

| Technology | Purpose |
|------------|---------|
| **React 18** | Frontend framework |
| **Tailwind CSS** | Utility-first styling |
| **React Router** | Navigation & routing |
| **Supabase** | Database & authentication |
| **Socket.IO** | Real-time communication |
| **Node.js + Express** | Backend server |
| **Arduino + MFRC522** | RFID hardware |

---

## 🚀 Deployment (Optional)

### Deploy React App

**Vercel (Recommended):**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm run build
# Upload build/ folder to Netlify
```

### Deploy Backend

**Heroku, Railway, or Render** for Node.js backend

**Important:** Update `REACT_APP_SERVER_URL` with your deployed backend URL!

---

## 📚 Project Scripts

```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

---

## 🔒 Security Best Practices

1. ✅ Never commit `.env` file
2. ✅ Use environment variables for secrets
3. ✅ Enable Row Level Security in Supabase
4. ✅ Validate inputs on both frontend & backend
5. ✅ Use HTTPS in production
6. ✅ Keep dependencies updated

---

## 🎯 Next Steps

After setup, you can:

1. **Customize the UI** - Edit CSS files
2. **Add more features** - Student profiles, reports, etc.
3. **Deploy to production** - Vercel, Netlify, etc.
4. **Add more statistics** - Charts, graphs, analytics
5. **Email notifications** - Using Supabase triggers

---

## ✨ Key Benefits of This Setup

| Feature | Benefit |
|---------|---------|
| **React** | Modern, component-based UI |
| **Supabase** | Managed database, no server needed |
| **Real-time** | Live updates across all clients |
| **Secure** | Built-in authentication |
| **Scalable** | Cloud-hosted, handles growth |
| **Mobile-ready** | Responsive design |

---

## 📞 Support

If you encounter issues:

1. Check this README
2. Review Supabase logs in dashboard
3. Check browser console for errors
4. Verify all environment variables are set
5. Make sure both servers are running

---

## 🎉 You're All Set!

Your React app with Supabase is ready to use!

**Quick Command Reference:**

```bash
# Terminal 1 - Backend
cd /path/to/project
node server-supabase.js

# Terminal 2 - React App
cd /path/to/project/react-app
npm start
```

Then open your browser (usually `http://localhost:3000`) and start tracking attendance! 🎓

---

## 🎨 Customizing with Tailwind CSS

This project uses **Tailwind CSS** for styling. You can customize:

### Change Colors
Edit `tailwind.config.js`:
```js
theme: {
  extend: {
    colors: {
      green: {
        DEFAULT: '#27ae60',  // Change primary color
        dark: '#1e8449',     // Dark shade
        light: '#2ecc71',    // Light shade
      }
    }
  }
}
```

### Modify Components
All components use Tailwind utility classes:
- `Login.js` - Authentication page styling
- `Dashboard.js` - Main dashboard styling

Example:
```jsx
<button className="px-4 py-2 bg-green text-white rounded-lg hover:shadow-lg">
  Click Me
</button>
```

### Responsive Design
Tailwind makes responsive design easy:
- `sm:` - Small screens (640px+)
- `md:` - Medium screens (768px+)
- `lg:` - Large screens (1024px+)
- `xl:` - Extra large screens (1280px+)

Example:
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Responsive grid */}
</div>
```

---

## 🎓 You're All Set!

Your React app with Tailwind CSS and Supabase is ready to use!

**Quick Command Reference:**

```bash
