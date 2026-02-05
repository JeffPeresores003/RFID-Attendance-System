require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('❌ Error: Supabase configuration missing in .env file');
    console.log('Please create a .env file with SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_KEY');
}

// Service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Load registered students (fallback for local mode)
const STUDENTS_FILE = 'students.json';
let students = {};

function loadStudents() {
    try {
        if (fs.existsSync(STUDENTS_FILE)) {
            const data = fs.readFileSync(STUDENTS_FILE, 'utf8');
            students = JSON.parse(data);
        }
    } catch (error) {
        console.log('Error loading students:', error.message);
        students = {};
    }
}

function saveStudents() {
    try {
        fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
    } catch (error) {
        console.log('Error saving students:', error.message);
    }
}

// Load students on startup
loadStudents();

// CSV file (backup)
const CSV_FILE = "attendance.csv";
if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, "Date,Time,UID,Student_ID,Full_Name,Status\n");
}

// Registration mode tracking
let registrationMode = false;
let pendingRegistration = null;

// Scan mode tracking
let scanningPaused = false;

// Authentication Middleware
async function authenticateUser(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
}

// Public routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Config endpoint for frontend
app.get("/api/config", (req, res) => {
    res.json({
        supabaseUrl: supabaseUrl,
        supabaseKey: supabaseAnonKey
    });
});

// Protected routes - require authentication
app.get("/download", authenticateUser, (req, res) => {
    res.download(CSV_FILE);
});

// Get all students from Supabase
app.get("/students", authenticateUser, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data || []);
    } catch (error) {
        console.error('Error fetching students:', error);
        // Fallback to local storage
        res.json(Object.entries(students).map(([uid, info]) => ({
            uid,
            ...info
        })));
    }
});

// Get attendance records from Supabase
app.get("/api/attendance", authenticateUser, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('attendance')
            .select(`
                *,
                students (
                    student_id,
                    full_name
                )
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        res.json(data || []);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
});

// Start registration mode
app.post("/start-registration", authenticateUser, (req, res) => {
    registrationMode = true;
    pendingRegistration = null;
    io.emit("registration-mode", { active: true });
    // Notify Arduino to switch to registration LED pattern
    try {
        if (port && port.isOpen) port.write('START_REG\n');
        else console.log('Serial port not open - START_REG not sent');
    } catch (e) {
        console.warn('Failed to write START_REG to serial port', e.message);
    }
    res.json({ status: "Registration mode activated. Please scan RFID card." });
});

// Register a new student
app.post("/register-student", authenticateUser, async (req, res) => {
    const { uid, studentId, fullName } = req.body;
    
    if (!uid || !studentId || !fullName) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    
    try {
        // Save to Supabase
        const { data, error } = await supabaseAdmin
            .from('students')
            .upsert({
                uid: uid,
                student_id: studentId,
                full_name: fullName,
                registered_by: req.user.id
            }, {
                onConflict: 'uid'
            })
            .select();

        if (error) throw error;

        // Also save locally as backup
        students[uid] = { studentId, fullName };
        saveStudents();
        
        registrationMode = false;
        pendingRegistration = null;
        io.emit("registration-mode", { active: false });
        io.emit("student-registered", { uid, studentId, fullName });
        // Tell Arduino registration succeeded (LED pattern)
        try {
            if (port && port.isOpen) port.write('REG_SUCCESS\n');
            else console.log('Serial port not open - REG_SUCCESS not sent');
        } catch (e) {
            console.warn('Failed to write REG_SUCCESS to serial port', e.message);
        }
        
        res.json({ status: "Student registered successfully", data });
    } catch (error) {
        console.error('Error registering student:', error);
        try {
            if (port && port.isOpen) port.write('REG_FAIL\n');
        } catch (e) {
            console.warn('Failed to write REG_FAIL to serial port', e.message);
        }
        res.status(500).json({ error: 'Failed to register student' });
    }
});

// Cancel registration
app.post("/cancel-registration", authenticateUser, (req, res) => {
    registrationMode = false;
    pendingRegistration = null;
    io.emit("registration-mode", { active: false });
    // Notify Arduino to cancel registration pattern
    try {
        if (port && port.isOpen) port.write('CANCEL_REG\n');
        else console.log('Serial port not open - CANCEL_REG not sent');
    } catch (e) {
        console.warn('Failed to write CANCEL_REG to serial port', e.message);
    }
    res.json({ status: "Registration cancelled" });
});

// Stop/Start scanning
app.post("/toggle-scanning", authenticateUser, (req, res) => {
    scanningPaused = !scanningPaused;
    io.emit("scanning-mode", { paused: scanningPaused });
    const status = scanningPaused ? "RFID scanning paused" : "RFID scanning resumed";
    console.log(status);
    // Notify Arduino about scanning state so it can change LED pattern
    try {
        if (port && port.isOpen) {
            if (scanningPaused) port.write('SCANNING_PAUSED\n');
            else port.write('SCANNING_RESUMED\n');
        } else {
            console.log('Serial port not open - scanning state not sent');
        }
    } catch (e) {
        console.warn('Failed to write scanning state to serial port', e.message);
    }
    res.json({ status, paused: scanningPaused });
});

// --- Serial Port Setup ---
let port = null;
let parser = null;
let arduinoConnected = false;

async function saveAttendanceToSupabase(attendanceData) {
    try {
        const { data, error } = await supabaseAdmin
            .from('attendance')
            .insert({
                uid: attendanceData.uid,
                student_id: attendanceData.studentId,
                full_name: attendanceData.fullName,
                status: attendanceData.status,
                scanned_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;
        console.log('✅ Attendance saved to Supabase');
        return data;
    } catch (error) {
        console.error('❌ Error saving to Supabase:', error.message);
        return null;
    }
}

try {
    port = new SerialPort({ path: "COM3", baudRate: 9600 });
    parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    
    port.on('open', () => {
        console.log("✅ Arduino connected on COM3");
        arduinoConnected = true;
        io.emit("arduino-status", { connected: true });
    });
    
    port.on('error', (err) => {
        console.log("❌ Arduino not connected:", err.message);
        arduinoConnected = false;
        io.emit("arduino-status", { connected: false });
    });
    
    parser.on('data', async (uid) => {
        console.log("Scanned UID:", uid);

        // Check if scanning is paused
        if (scanningPaused && !registrationMode) {
            console.log("⏸️ RFID scanning is paused - scan ignored");
            return;
        }

        // Handle registration mode
        if (registrationMode) {
            pendingRegistration = uid;
            io.emit("rfid-scanned", { uid });
            console.log(`📋 RFID scanned for registration: ${uid}`);
            return;
        }

        // Handle attendance mode
        const now = new Date();
        const date = now.toISOString().split("T")[0];
        const time = now.toTimeString().split(" ")[0];

        let studentId = '';
        let fullName = '';
        let status = '';

        // Try to get student from Supabase first
        try {
            const { data, error } = await supabaseAdmin
                .from('students')
                .select('*')
                .eq('uid', uid)
                .single();

            if (data) {
                studentId = data.student_id;
                fullName = data.full_name;
                status = 'Registered';
            } else {
                throw new Error('Student not found');
            }
        } catch (error) {
            // Fallback to local storage
            if (students[uid]) {
                studentId = students[uid].studentId;
                fullName = students[uid].fullName;
                status = 'Registered';
            } else {
                studentId = 'Unknown';
                fullName = 'Student not registered';
                status = 'Not Registered';
            }
        }

        // Save to Supabase
        const attendanceData = { uid, studentId, fullName, status };
        await saveAttendanceToSupabase(attendanceData);

        // Also save to CSV as backup
        const row = `${date},${time},${uid},${studentId},${fullName},${status}`;
        fs.appendFileSync(CSV_FILE, row + "\n");

        io.emit("scan", { date, time, uid, studentId, fullName, status });
        console.log(`✅ ${status}: ${fullName} (${uid}) at ${time}`);
    });
    
} catch (error) {
    console.log("❌ Arduino not connected:", error.message);
    arduinoConnected = false;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`📝 Login page: http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    
    if (supabaseUrl && supabaseAnonKey) {
        console.log('✅ Supabase connected');
    } else {
        console.log('⚠️  Supabase not configured - running in local mode');
    }
    
    if (!arduinoConnected) {
        console.log("⚠️  Arduino not connected - attendance scanning disabled");
        console.log("💡 Connect Arduino to enable RFID scanning");
    }
});
