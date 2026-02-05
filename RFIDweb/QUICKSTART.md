# Quick Start - React RFID Attendance App

## 🔥 Super Fast Setup (5 minutes)

### 1. Setup Supabase (2 min)
- Go to [supabase.com](https://supabase.com)
- Create project
- Run SQL from main `supabase-database-setup.sql`
- Copy API URL & anon key

### 2. Configure App (1 min)
```bash
cd react-app
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Install & Run (2 min)
```bash
# Install dependencies (includes Tailwind CSS)
npm install

# Start React app
npm start
```

### 4. Start Backend (for Arduino)
```bash
# In another terminal, from root directory
node server-supabase.js
```

### 5. First Login
- Open http://localhost:3000
- Click "Sign up"
- Create account
- Login and use!

---

## 🎨 Design

This app uses **Tailwind CSS** - a modern utility-first CSS framework!

- ✅ Fully responsive design
- ✅ Clean, professional UI
- ✅ No custom CSS files needed
- ✅ Easy to customize colors

---

## 📁 Files You Need to Edit

1. **`.env`** - Add your Supabase URL & key
2. That's it! 🎉

---

## 🔗 How to Connect to Supabase

**You DON'T need to give me your account!**

Just:
1. Get URL & anon key from Supabase dashboard
2. Put them in `.env` file
3. Done!

The anon key is **public** and **safe** to use in frontend.

---

## 💡 Tech Stack

- ⚛️ **React** - Frontend framework
- 🎨 **Tailwind CSS** - Styling (utility-first)
- 🔐 **Supabase** - Database & Auth
- 🔌 **Socket.IO** - Real-time updates
- 🖥️ **Node.js** - Backend for Arduino

---

## 📖 Full Documentation

See [README.md](./README.md) for detailed setup guide.

---

**That's it! Happy coding! 🚀**
