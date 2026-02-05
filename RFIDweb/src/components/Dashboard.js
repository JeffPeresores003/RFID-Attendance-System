import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import io from 'socket.io-client';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [registrationMode, setRegistrationMode] = useState(false);
  const [scanningPaused, setScanningPaused] = useState(false);
  const [arduinoConnected, setArduinoConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Profile state
  const [showProfile, setShowProfile] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Load students from Supabase
  const loadStudents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  }, []);

  // Load attendance from Supabase
  const loadAttendance = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('scanned_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  }, []);

  // Register a student
  const registerStudent = useCallback(async (uid, studentId, fullName) => {
    try {
      const { error } = await supabase
        .from('students')
        .insert({
          uid,
          student_id: studentId,
          full_name: fullName,
          registered_by: user.id
        })
        .select();

      if (error) throw error;
      
      alert(`Student registered successfully!\nUID: ${uid}\nStudent ID: ${studentId}\nName: ${fullName}`);
      loadStudents();
      setRegistrationMode(false);
      
      if (socket) {
        socket.emit('cancel-registration');
      }
    } catch (error) {
      console.error('Error registering student:', error);
      alert('Failed to register student: ' + error.message);
    }
  }, [user, socket, loadStudents]);

  // Cancel registration
  const cancelRegistration = useCallback(() => {
    if (socket) {
      socket.emit('cancel-registration');
      setRegistrationMode(false);
    }
  }, [socket]);

  // Handle new student registration prompt
  const handleNewStudentRegistration = useCallback((uid) => {
    const studentId = prompt('Enter Student ID (School ID):');
    if (!studentId) {
      cancelRegistration();
      return;
    }

    const fullName = prompt('Enter Student Full Name:');
    if (!fullName) {
      cancelRegistration();
      return;
    }

    registerStudent(uid, studentId, fullName);
  }, [cancelRegistration, registerStudent]);

  // Connect to Socket.IO server
  useEffect(() => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3000';
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    newSocket.on('arduino-status', (status) => {
      setArduinoConnected(status.connected);
    });

    newSocket.on('scan', (data) => {
      setAttendance(prev => [data, ...prev]);
      loadAttendance(); // Refresh from database
    });

    newSocket.on('registration-mode', (data) => {
      setRegistrationMode(data.active);
    });

    newSocket.on('scanning-mode', (data) => {
      setScanningPaused(data.paused);
    });

    newSocket.on('rfid-scanned', (data) => {
      if (registrationMode) {
        handleNewStudentRegistration(data.uid);
      }
    });

    return () => newSocket.close();
  }, [registrationMode, handleNewStudentRegistration, loadAttendance]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load initial data
  useEffect(() => {
    loadStudents();
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordLoading(true);

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3002/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password');
      }

      alert('Password changed successfully!');
      setShowProfile(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const startRegistration = () => {
    if (socket) {
      socket.emit('start-registration');
      setRegistrationMode(true);
    }
  };

  const toggleScanning = () => {
    if (socket) {
      socket.emit('toggle-scanning');
    }
  };

  const downloadCSV = () => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3000';
    window.open(`${serverUrl}/download`, '_blank');
  };

  // Statistics
  const totalScans = attendance.length;
  const today = new Date().toISOString().split('T')[0];
  const todayScans = attendance.filter(item => {
    const scanDate = new Date(item.scanned_at).toISOString().split('T')[0];
    return scanDate === today;
  }).length;
  const lastScan = attendance.length > 0 
    ? new Date(attendance[0].scanned_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  // Search filter
  const filteredAttendance = attendance.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.full_name?.toLowerCase().includes(searchLower) ||
      item.student_id?.toLowerCase().includes(searchLower) ||
      item.uid?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-8 px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* User Info */}
          <div className="absolute top-6 left-8 flex items-center gap-3 text-sm z-10">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">{user?.username || user?.full_name}</div>
              <div className="text-white/70 text-xs">Teacher Portal</div>
            </div>
          </div>
          
          {/* Profile and Logout Buttons */}
          <div className="absolute top-6 right-8 flex items-center gap-3 z-10">
            <button
              onClick={() => setShowProfile(true)}
              className="bg-white/20 hover:bg-white hover:text-emerald-600 px-5 py-2.5 border-2 border-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profile</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white hover:text-emerald-600 px-5 py-2.5 border-2 border-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
          
          <div className="text-center relative z-10 mt-8">
            <div className="w-28 h-28 mx-auto mb-4 bg-white rounded-full p-2 shadow-lg">
              <img src="/logo.png" alt="San Jose Elementary School" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight">San Jose Elementary School</h1>
            <p className="text-white/90 text-lg font-medium">An Automated Attendance System</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-6">
              {/* Arduino Status */}
              <div className={`flex items-center gap-3 font-semibold ${
                arduinoConnected ? 'text-emerald-600' : 'text-red-600'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  arduinoConnected ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  <span className={`w-3 h-3 rounded-full animate-pulse-slow ${
                    arduinoConnected ? 'bg-emerald-600' : 'bg-red-600'
                  }`}></span>
                </div>
                <span>{arduinoConnected ? 'Device Connected' : 'Device Disconnected'}</span>
              </div>
              
              {/* Registration Mode Indicator */}
              {registrationMode && (
                <div className="flex items-center gap-3 font-semibold text-orange-600 animate-pulse-slow">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span>Registration Mode Active</span>
                </div>
              )}
              
              {/* Scanning Paused Indicator */}
              {scanningPaused && (
                <div className="flex items-center gap-3 font-semibold text-red-600 animate-pulse-slow">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span>RFID Scanning Paused</span>
                </div>
              )}
            </div>
            
            {/* Current Time */}
            <div className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })} {currentTime.toLocaleTimeString()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={toggleScanning}
              className={`px-6 py-3 rounded-xl text-white font-bold transition-all hover:scale-105 hover:shadow-xl flex items-center gap-2 ${
                scanningPaused 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600' 
                  : 'bg-gradient-to-r from-red-600 to-rose-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {scanningPaused ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              <span>{scanningPaused ? 'Resume' : 'Pause'} Scanning</span>
            </button>
            
            <button
              onClick={registrationMode ? cancelRegistration : startRegistration}
              disabled={registrationMode}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold 
                         transition-all hover:scale-105 hover:shadow-xl flex items-center gap-2
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>{registrationMode ? 'Scanning Card...' : 'Register Student'}</span>
            </button>
            
            <button
              onClick={downloadCSV}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold 
                         transition-all hover:scale-105 hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-8 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-6 rounded-2xl text-white shadow-xl hover:scale-105 transition-transform">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">{totalScans}</div>
            <div className="text-white/90 text-sm font-medium uppercase tracking-wider">Total Check-ins</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-6 rounded-2xl text-white shadow-xl hover:scale-105 transition-transform">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">{todayScans}</div>
            <div className="text-white/90 text-sm font-medium uppercase tracking-wider">Today's Check-ins</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-2xl text-white shadow-xl hover:scale-105 transition-transform">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">{lastScan}</div>
            <div className="text-white/90 text-sm font-medium uppercase tracking-wider">Last Check-in</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-6 rounded-2xl text-white shadow-xl hover:scale-105 transition-transform">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">{students.length}</div>
            <div className="text-white/90 text-sm font-medium uppercase tracking-wider">Registered Students</div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="p-8">
          {/* Table Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h2 className="text-2xl text-slate-800 font-bold flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span>Student Attendance Records</span>
            </h2>
            <div className="relative w-full sm:w-auto">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, ID, or UID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none min-w-[300px] w-full bg-white"
              />
            </div>
          </div>

          {/* Empty State */}
          {filteredAttendance.length === 0 ? (
            <div className="text-center py-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-slate-700">No attendance records yet</h3>
              <p className="text-slate-500">Scan a student RFID card to start tracking attendance</p>
            </div>
          ) : (
            /* Table */
            <div className="overflow-x-auto bg-white rounded-2xl shadow-lg border border-slate-200">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-100 to-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-slate-700 border-b-2 border-slate-300">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>Student ID</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-slate-700 border-b-2 border-slate-300">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Student Name</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-slate-700 border-b-2 border-slate-300">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Date</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-slate-700 border-b-2 border-slate-300">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Time</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-slate-700 border-b-2 border-slate-300">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Status</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((item, index) => {
                    const scanDate = new Date(item.scanned_at);
                    const isRecent = index === 0;
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-100 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all
                          ${isRecent ? 'animate-highlight bg-gradient-to-r from-emerald-50 to-teal-50' : ''}`}
                      >
                        <td className="px-6 py-4 font-bold text-emerald-600">
                          {item.student_id || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {item.full_name || 'Not Registered'}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {scanDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {scanDate.toLocaleTimeString('en-US', {
                            hour12: true,
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
                              ${item.status === 'Registered'
                                ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-2 border-emerald-300'
                                : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-2 border-red-300'
                              }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {item.status === 'Registered' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              )}
                            </svg>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Profile Modal */}
        {showProfile && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">Teacher Profile</h3>
              
              {/* Current Info */}
              <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                <div className="mb-2">
                  <span className="text-sm font-medium text-slate-600">Full Name:</span>
                  <p className="font-semibold text-slate-800">{user?.full_name}</p>
                </div>
                <div className="mb-2">
                  <span className="text-sm font-medium text-slate-600">Username:</span>
                  <p className="font-semibold text-slate-800">{user?.username}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">Grade Assignment:</span>
                  <p className="font-semibold text-slate-800">Grade {user?.grade}</p>
                </div>
              </div>

              {/* Password Change Form */}
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 mb-4">Change Password</h4>
                
                {passwordError && (
                  <div className="p-3 bg-red-100 border border-red-200 rounded-lg text-red-600 text-sm">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 text-sm font-medium mb-2">Current Password *</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    placeholder="Enter current password"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-sm font-medium mb-2">New Password *</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    placeholder="Enter new password (min 6 characters)"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-sm font-medium mb-2">Confirm New Password *</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-all"
                  >
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfile(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordError('');
                    }}
                    className="flex-1 px-6 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
