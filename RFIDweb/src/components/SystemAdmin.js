import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import io from 'socket.io-client';

const SystemAdmin = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers' or 'rfid'
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  
  // Teacher Creation
  const [showCreateTeacher, setShowCreateTeacher] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    username: '',
    fullName: '',
    grade: ''
  });
  
  // RFID Registration
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [rfidScanning, setRfidScanning] = useState(false);
  const [scannedUID, setScannedUID] = useState('');
  const [arduinoConnected, setArduinoConnected] = useState(false);

  const handleRegisterRFID = async (uid) => {
    if (!selectedStudent || !uid) return;

    try {
      // Check if UID already exists
      const { data: existingStudent } = await supabase
        .from('students')
        .select('*')
        .eq('uid', uid)
        .single();

      if (existingStudent) {
        alert(`This RFID card is already registered to ${existingStudent.full_name}`);
        cancelRFIDScan();
        return;
      }

      // Check if student already has an RFID registered
      const { data: studentExists } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', selectedStudent.student_id)
        .single();

      if (studentExists) {
        // Update existing record
        const { error } = await supabase
          .from('students')
          .update({ uid: uid })
          .eq('student_id', selectedStudent.student_id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('students')
          .insert([{
            uid: uid,
            student_id: selectedStudent.student_id,
            full_name: selectedStudent.full_name,
            grade: selectedStudent.grade
          }]);

        if (error) throw error;
      }

      alert(`RFID successfully registered for ${selectedStudent.full_name}!`);
      cancelRFIDScan();
      loadRegisteredStudents();
    } catch (error) {
      console.error('Error registering RFID:', error);
      alert('Error registering RFID. Please try again.');
    }
  };

  useEffect(() => {
    loadUsers();
    loadStudents();
    loadRegisteredStudents();
    
    // Setup Socket.IO connection
    const newSocket = io('http://localhost:3001');

    newSocket.on('arduino-status', (status) => {
      setArduinoConnected(status === 'connected');
    });

    newSocket.on('rfid-scanned', (data) => {
      setScannedUID(data.uid);
      handleRegisterRFID(data.uid);
    });

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStudents = async () => {
    try {
      // Load from students table (registered students with RFID)
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('grade', { ascending: true })
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadRegisteredStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('grade', { ascending: true });
      
      if (error) throw error;
      setRegisteredStudents(data || []);
    } catch (error) {
      console.error('Error loading registered students:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    
    if (!teacherForm.username || !teacherForm.fullName || !teacherForm.grade) {
      alert('Please fill all fields');
      return;
    }

    const defaultPassword = 'teacher123'; // Default password for all teachers

    try {
      // Call backend API to create teacher with auto-confirmed email
      const response = await fetch('http://localhost:3002/api/admin/create-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: teacherForm.username,
          password: defaultPassword,
          fullName: teacherForm.fullName,
          grade: teacherForm.grade
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create teacher');
      }

      alert(`Teacher account created successfully!\n\nLogin Details:\nUsername: ${result.teacher.username}\nPassword: ${defaultPassword}\n\nThe teacher can change their password anytime from their profile.`);
      setShowCreateTeacher(false);
      setTeacherForm({ username: '', fullName: '', grade: '' });
      loadUsers();
    } catch (error) {
      console.error('Error creating teacher:', error);
      alert(`Error creating teacher: ${error.message}`);
    }
  };

  const handleDeleteTeacher = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this teacher account?')) {
      return;
    }

    try {
      // Call backend API to delete teacher
      const response = await fetch(`http://localhost:3002/api/admin/delete-teacher/${userId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete teacher');
      }
      
      alert('Teacher account deleted successfully');
      loadUsers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Handle Reset Teacher Password
  const handleResetPassword = async (username) => {
    if (!window.confirm(`Are you sure you want to reset the password for "${username}" to the default password (teacher123)?`)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:3002/api/admin/reset-teacher-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }
      
      alert(`Password reset successfully!\n\nUsername: ${username}\nNew Password: teacher123\n\nPlease inform the teacher to change their password after logging in.`);
    } catch (error) {
      console.error('Error resetting password:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const startRFIDScan = (student) => {
    if (!arduinoConnected) {
      alert('Arduino is not connected. Please connect the RFID scanner.');
      return;
    }
    setSelectedStudent(student);
    setRfidScanning(true);
    setScannedUID('');
  };

  const cancelRFIDScan = () => {
    setRfidScanning(false);
    setSelectedStudent(null);
    setScannedUID('');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Filter users (teachers)
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = filterGrade === 'all' || u.grade === parseInt(filterGrade);
    
    return matchesSearch && matchesGrade;
  });

  // Filter students for RFID registration
  const filteredStudents = students.filter(s => {
    const matchesGrade = filterGrade === 'all' || s.grade === parseInt(filterGrade);
    const matchesSearch = s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGrade && matchesSearch;
  });

  // Check if student has RFID registered
  const isRFIDRegistered = (studentId) => {
    return registeredStudents.some(rs => rs.student_id === studentId);
  };

  const getStudentRFID = (studentId) => {
    const registered = registeredStudents.find(rs => rs.student_id === studentId);
    return registered?.uid || null;
  };

  // Statistics
  const totalTeachers = users.length;
  const totalStudents = students.length;
  const totalRegisteredRFID = registeredStudents.length;

  return (
    <div className="min-h-screen p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white py-8 px-8 rounded-3xl shadow-2xl mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* User Info */}
          <div className="absolute top-5 left-8 flex items-center gap-2 text-sm z-10">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">{user?.full_name}</div>
              <div className="text-white/80 text-xs">System Administrator</div>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="absolute top-5 right-8 bg-white/20 hover:bg-white backdrop-blur-sm hover:text-purple-600 px-5 py-2 border-2 border-white/30 hover:border-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
          
          <div className="text-center relative z-10 mt-8">
            <div className="w-28 h-28 mx-auto mb-4 bg-white rounded-full p-2 shadow-lg">
              <img src="/logo.png" alt="San Jose Elementary School" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight">System Administration</h1>
            <p className="text-white/90 text-lg font-medium">User Account Management</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-6 rounded-2xl shadow-xl">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="text-3xl font-bold mb-2">{totalTeachers}</div>
            <div className="text-white/90 text-sm font-medium uppercase tracking-wider">Total Teachers</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6 rounded-2xl shadow-xl">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="text-3xl font-bold mb-2">{totalStudents}</div>
            <div className="text-white/90 text-sm font-medium uppercase tracking-wider">Registered Students</div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white p-6 rounded-2xl shadow-xl">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div className="text-3xl font-bold mb-2">{totalRegisteredRFID}</div>
            <div className="text-white/90 text-sm font-medium uppercase tracking-wider">RFID Cards</div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl p-2 mb-6 border border-white/10">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('teachers')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'teachers'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Teacher Management
              </div>
            </button>
            <button
              onClick={() => setActiveTab('rfid')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'rfid'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                RFID Registration
              </div>
            </button>
          </div>
        </div>

        {/* Teacher Management Tab */}
        {activeTab === 'teachers' && (
          <>
            {/* Create Teacher Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowCreateTeacher(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Teacher Account
              </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl p-6 mb-6 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Search</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or username..."
                    className="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Filter by Grade</label>
                  <select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="all">All Grades</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                    <option value="6">Grade 6</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Teachers Table */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-white/10">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Teacher Accounts</h2>
                <p className="text-white/60 text-sm mt-1">
                  Manage teacher accounts and assignments
                </p>
              </div>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="text-center py-12 text-white/60">Loading teachers...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-white/60">No teachers found</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Teacher Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Username</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Grade Assignment</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{u.full_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white/70">{u.username}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300">
                              Grade {u.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleResetPassword(u.username)}
                                className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-colors font-medium text-xs"
                                title="Reset to default password (teacher123)"
                              >
                                Reset Password
                              </button>
                              <button
                                onClick={() => handleDeleteTeacher(u.id)}
                                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors font-medium text-xs"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {/* Create Teacher Modal */}
        {showCreateTeacher && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 max-w-md w-full border-2 border-emerald-500/50">
              <h3 className="text-2xl font-bold text-white mb-6">Create Teacher Account</h3>
              
              <form onSubmit={handleCreateTeacher} className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Username *</label>
                  <input
                    type="text"
                    value={teacherForm.username}
                    onChange={(e) => setTeacherForm({...teacherForm, username: e.target.value})}
                    placeholder="teacher1"
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-white/50 text-xs mt-1">Username for login (no email needed)</p>
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={teacherForm.fullName}
                    onChange={(e) => setTeacherForm({...teacherForm, fullName: e.target.value})}
                    placeholder="Juan Dela Cruz"
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Teaching Grade *</label>
                  <select
                    value={teacherForm.grade}
                    onChange={(e) => setTeacherForm({...teacherForm, grade: e.target.value})}
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Grade</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                    <option value="6">Grade 6</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold transition-all"
                  >
                    Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateTeacher(false);
                      setTeacherForm({ username: '', fullName: '', grade: '' });
                    }}
                    className="flex-1 px-6 py-3 bg-slate-600/50 hover:bg-slate-600/70 text-white rounded-xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RFID Registration Tab */}
        {activeTab === 'rfid' && (
          <>
            {/* Arduino Connection Status */}
            <div className={`bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl p-4 mb-6 border ${
              arduinoConnected ? 'border-green-500/50' : 'border-red-500/50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${arduinoConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-white font-medium">
                  {arduinoConnected ? 'RFID Scanner Connected' : 'RFID Scanner Disconnected'}
                </span>
                <span className="text-white/60 text-sm ml-auto">
                  Make sure Node.js server is running on port 3001
                </span>
              </div>
            </div>

            {/* Grade Filter and Search */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl p-6 mb-6 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Filter by Grade</label>
                  <select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="all">All Grades</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                    <option value="6">Grade 6</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Search Student</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or ID..."
                    className="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Students List */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Student RFID Registration</h2>
                <p className="text-white/60 text-sm mt-1">
                  Select a student and scan their RFID card to register
                </p>
              </div>

              {loading ? (
                <div className="p-8 text-center text-white/60">Loading students...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-white/60">No students found</div>
              ) : (
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-slate-700/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        RFID Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{student.full_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white/70">{student.student_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300">
                            Grade {student.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isRFIDRegistered(student.student_id) ? (
                            <div>
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-300">
                                Registered
                              </span>
                              <div className="text-xs text-white/50 mt-1">
                                UID: {getStudentRFID(student.student_id)}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-300">
                              Not Registered
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => startRFIDScan(student)}
                            disabled={!arduinoConnected}
                            className={`px-4 py-2 rounded-lg transition-all font-medium ${
                              arduinoConnected
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg'
                                : 'bg-slate-600/50 text-white/40 cursor-not-allowed'
                            }`}
                          >
                            {isRFIDRegistered(student.student_id) ? 'Re-register RFID' : 'Register RFID'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* RFID Scanning Modal */}
        {rfidScanning && selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 max-w-md w-full border-2 border-purple-500/50">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">Scan RFID Card</h3>
                <p className="text-white/70 mb-6">
                  Registering RFID for <span className="font-semibold text-white">{selectedStudent.full_name}</span>
                </p>
                
                <div className="bg-slate-700/50 rounded-xl p-6 mb-6 border border-white/10">
                  <div className="text-white/60 text-sm mb-2">Instructions:</div>
                  <ol className="text-left text-white/80 text-sm space-y-2 list-decimal list-inside">
                    <li>Place the RFID card near the scanner</li>
                    <li>Wait for the card to be detected</li>
                    <li>The registration will complete automatically</li>
                  </ol>
                  
                  {scannedUID && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="text-green-400 font-semibold">Card Detected!</div>
                      <div className="text-white/60 text-xs mt-1">UID: {scannedUID}</div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={cancelRFIDScan}
                  className="w-full px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemAdmin;
