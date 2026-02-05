# 🎓 RFID Attendance System - Mock Login Credentials

## Portal System

The system now has **two separate portals**:

### 👨‍🏫 Teacher Portal
- **Full access** to all system features
- Manage student registrations
- View all attendance records
- Real-time RFID scanning
- Download CSV reports

### 🎒 Student Portal
- **Limited access** to personal data only
- View own profile information
- View own attendance history
- Track personal statistics

---

## 🔐 Demo Accounts

### Teacher Account
- **Email:** `teacher@school.com`
- **Password:** `teacher123`
- **Portal:** Teacher Portal
- **Access Level:** Full (Admin)

### Student Accounts

#### Student 1 - Maria Santos
- **Email:** `student@school.com`
- **Password:** `student123`
- **Portal:** Student Portal
- **Student ID:** 2021-001

#### Student 2 - Juan Dela Cruz
- **Email:** `juan@school.com`
- **Password:** `student123`
- **Portal:** Student Portal
- **Student ID:** 2021-002

---

## 📊 Mock Data Included

### Students Database
- Maria Santos (ID: 2021-001, UID: ABC123DEF)
- Juan Dela Cruz (ID: 2021-002, UID: XYZ789GHI)
- Ana Garcia (ID: 2021-003, UID: LMN456OPQ)

### Attendance Records
- Multiple sample attendance entries
- Records from today, yesterday, and this week
- Pre-populated for testing

---

## 🚀 How to Use

1. **Start the app:**
   ```bash
   cd RFIDweb
   npm start
   ```

2. **Login Page:**
   - Choose either **Teacher Portal** or **Student Portal**
   - Demo credentials are displayed on the login form

3. **Teacher Dashboard:**
   - View all students and attendance
   - Register new students via RFID
   - Monitor real-time scans
   - Export data

4. **Student Dashboard:**
   - See your profile information
   - View your attendance history
   - Track your statistics
   - Read-only access

---

## ✨ Features

### Teacher Portal Features
- ✅ Full student management
- ✅ Real-time RFID scanning
- ✅ Attendance monitoring
- ✅ CSV export functionality
- ✅ Student registration
- ✅ Search and filter
- ✅ Statistics dashboard

### Student Portal Features
- ✅ Personal profile view
- ✅ Attendance history
- ✅ Personal statistics
- ✅ Date-based search
- ✅ Today's highlight
- ✅ Weekly summary

---

## 🔄 Authentication System

Currently using **Mock Authentication** (no Supabase):
- Session stored in `sessionStorage`
- Role-based access control
- Protected routes
- Portal selection on login
- Automatic routing based on role

---

## 📝 Notes

- No database connection required yet
- All data is stored in memory (resets on refresh)
- Perfect for testing and demo purposes
- Ready to integrate with Supabase later
- No backend server needed for authentication

---

## 🎨 Design Features

- **Dual Portal Selection:** Beautiful card-based portal chooser
- **Color Coding:** 
  - Green theme for Teachers
  - Blue theme for Students
- **Responsive Design:** Works on all screen sizes
- **Tailwind CSS:** Modern utility-first styling
- **Smooth Transitions:** Hover effects and animations

---

## 🔮 Next Steps

When ready to connect Supabase:
1. Update `supabaseClient.js` with real Supabase client
2. Modify `AuthContext.js` to use Supabase auth
3. Add RLS (Row Level Security) policies
4. Enable real-time subscriptions
5. Replace mock data with database queries

---

**Happy Testing! 🚀**
