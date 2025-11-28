const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
app.use(express.json());

// Load registered students
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

// CSV file
const CSV_FILE = "attendance.csv";
if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, "Date,Time,UID,Student_ID,Full_Name,Status\n");
}

// Registration mode tracking
let registrationMode = false;
let pendingRegistration = null;

// Scan mode tracking
let scanningPaused = false;

// Serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Download CSV
app.get("/download", (req, res) => {
    res.download(CSV_FILE);
});

// Get all students
app.get("/students", (req, res) => {
    res.json(students);
});

// Start registration mode
app.post("/start-registration", (req, res) => {
    registrationMode = true;
    pendingRegistration = null;
    io.emit("registration-mode", { active: true });
    res.json({ status: "Registration mode activated. Please scan RFID card." });
});

// Register a new student
app.post("/register-student", (req, res) => {
    const { uid, studentId, fullName } = req.body;
    
    if (!uid || !studentId || !fullName) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    
    students[uid] = { studentId, fullName };
    saveStudents();
    
    registrationMode = false;
    pendingRegistration = null;
    io.emit("registration-mode", { active: false });
    io.emit("student-registered", { uid, studentId, fullName });
    
    res.json({ status: "Student registered successfully" });
});

// Cancel registration
app.post("/cancel-registration", (req, res) => {
    registrationMode = false;
    pendingRegistration = null;
    io.emit("registration-mode", { active: false });
    res.json({ status: "Registration cancelled" });
});

// Stop/Start scanning
app.post("/toggle-scanning", (req, res) => {
    scanningPaused = !scanningPaused;
    io.emit("scanning-mode", { paused: scanningPaused });
    const status = scanningPaused ? "RFID scanning paused" : "RFID scanning resumed";
    console.log(status);
    res.json({ status, paused: scanningPaused });
});

// --- Serial Port Setup ---
// Replace 'COM3' with your Arduino port (or /dev/ttyUSB0 on Linux/Mac)
let port = null;
let parser = null;
let arduinoConnected = false;

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
    
    parser.on('data', (uid) => {
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

        if (students[uid]) {
            studentId = students[uid].studentId;
            fullName = students[uid].fullName;
            status = 'Registered';
        } else {
            studentId = 'Unknown';
            fullName = 'Student not registered';
            status = 'Not Registered';
        }

        const row = `${date},${time},${uid},${studentId},${fullName},${status}`;
        fs.appendFileSync(CSV_FILE, row + "\n");

        io.emit("scan", { date, time, uid, studentId, fullName, status });
        console.log(`✅ ${status}: ${fullName} (${uid}) at ${time}`);
    });
    
} catch (error) {
    console.log("❌ Arduino not connected:", error.message);
    arduinoConnected = false;
}

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
    if (!arduinoConnected) {
        console.log("⚠️  Arduino not connected - attendance scanning disabled");
        console.log("💡 Connect Arduino to enable RFID scanning");
    }
});
