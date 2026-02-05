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
      const { data, error } = await supabase
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

  // Load students from Supabase
  const loadStudents = async () => {
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
  };

  // Load attendance from Supabase
  const loadAttendance = async () => {
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
  };

  useEffect(() => {
    loadStudents();
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
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
    <div className="min-h-screen p-5">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-dark to-green text-white py-8 px-8 text-center relative">
          {/* User Info */}
          <div className="absolute top-5 left-8 flex items-center gap-2 text-sm">
            <span className="text-xl">👤</span>
            <span>{user?.email}</span>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="absolute top-5 right-8 bg-white/20 hover:bg-white hover:text-green px-5 py-2 border-2 border-white rounded-lg text-sm font-medium transition-all"
          >
            🚪 Logout
          </button>
          
          <h1 className="text-4xl font-light mb-2">🎓 Student Attendance System</h1>
          <p className="text-white/90 text-lg">Real-time Student Attendance Monitoring</p>
        </div>

        {/* Status Bar */}
        <div className="px-8 py-5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          {/* Arduino Status */}
          <div className={`flex items-center gap-2 font-medium ${arduinoConnected ? 'text-green-600' : 'text-red-600'}`}>
            <span className={`w-2.5 h-2.5 rounded-full animate-pulse-slow ${arduinoConnected ? 'bg-green-600' : 'bg-red-600'}`}></span>
            <span>{arduinoConnected ? 'Arduino Connected' : 'Arduino Disconnected'}</span>
          </div>
          
          {/* Registration Mode Indicator */}
          {registrationMode && (
            <div className="flex items-center gap-2 font-medium text-orange-600 animate-pulse-slow">
              <span>➕</span>
              <span>Registration Mode Active</span>
            </div>
          )}
          
          {/* Scanning Paused Indicator */}
          {scanningPaused && (
            <div className="flex items-center gap-2 font-medium text-red-600 animate-pulse-slow">
              <span>⏸️</span>
              <span>RFID Scanning Paused</span>
            </div>
          )}
          
          {/* Current Time */}
          <div className="text-sm text-gray-600">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })} {currentTime.toLocaleTimeString()}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={toggleScanning}
              className={`px-5 py-2.5 rounded-lg text-white font-medium transition-all hover:-translate-y-0.5 hover:shadow-lg
                ${scanningPaused 
                  ? 'bg-gradient-to-r from-green to-primary-700' 
                  : 'bg-gradient-to-r from-red-600 to-red-700'
                }`}
            >
              {scanningPaused ? '▶️ Resume' : '⏸️ Pause'} Scanning
            </button>
            
            <button
              onClick={registrationMode ? cancelRegistration : startRegistration}
              disabled={registrationMode}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium 
                         transition-all hover:-translate-y-0.5 hover:shadow-lg
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {registrationMode ? '⏳ Scan RFID Card...' : '➕ Register Student'}
            </button>
            
            <button
              onClick={downloadCSV}
              className="px-5 py-2.5 bg-gradient-to-r from-primary-700 to-green text-white rounded-lg font-medium 
                         transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              📥 Download CSV
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 p-8 bg-gray-50">
          <div className="bg-white p-6 rounded-xl text-center shadow-md hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-4">🎓</div>
            <div className="text-3xl font-bold text-green-dark mb-1">{totalScans}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">Total Check-ins</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl text-center shadow-md hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-4">📅</div>
            <div className="text-3xl font-bold text-green-dark mb-1">{todayScans}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">Today's Check-ins</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl text-center shadow-md hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-4">⏰</div>
            <div className="text-3xl font-bold text-green-dark mb-1">{lastScan}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">Last Check-in</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl text-center shadow-md hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-4">👥</div>
            <div className="text-3xl font-bold text-green-dark mb-1">{students.length}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">Registered Students</div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="p-8">
          {/* Table Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl text-gray-800 font-semibold">📋 Student Attendance</h2>
            <input
              type="text"
              placeholder="Search by name, ID, or UID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green focus:outline-none min-w-[250px] w-full sm:w-auto"
            />
          </div>

          {/* Empty State */}
          {filteredAttendance.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-6xl mb-5">📝</div>
              <h3 className="text-2xl mb-2 text-gray-500">No attendance records yet</h3>
              <p className="text-gray-400">Scan a student RFID card to start tracking attendance</p>
            </div>
          ) : (
            /* Table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-4 py-4 text-left font-semibold text-gray-700 border-b-2 border-gray-200">
                      🆔 Student ID
                    </th>
                    <th className="px-4 py-4 text-left font-semibold text-gray-700 border-b-2 border-gray-200">
                      👤 Student Name
                    </th>
                    <th className="px-4 py-4 text-left font-semibold text-gray-700 border-b-2 border-gray-200">
                      📅 Date
                    </th>
                    <th className="px-4 py-4 text-left font-semibold text-gray-700 border-b-2 border-gray-200">
                      ⏰ Time
                    </th>
                    <th className="px-4 py-4 text-left font-semibold text-gray-700 border-b-2 border-gray-200">
                      ✅ Status
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
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors
                          ${isRecent ? 'animate-highlight bg-green-50' : ''}`}
                      >
                        <td className="px-4 py-4 font-semibold text-green">
                          {item.student_id || 'Unknown'}
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-800">
                          {item.full_name || 'Not Registered'}
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          {scanDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-4 text-gray-500 text-sm">
                          {scanDate.toLocaleTimeString('en-US', {
                            hour12: true,
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold
                              ${item.status === 'Registered'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                              }`}
                          >
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
      </div>
    </div>
  );
};

export default Dashboard;
