import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import LoadingAnimation from './LoadingAnimation';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const [attendance, setAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load student's own attendance records from Supabase
  useEffect(() => {
    const loadAttendance = async () => {
      if (user && user.student_id) {
        try {
          const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', user.student_id)
            .order('scanned_at', { ascending: false });
          
          if (error) throw error;
          setAttendance(data || []);
        } catch (error) {
          console.error('Error loading attendance:', error);
        }
      }
    };

    loadAttendance();
  }, [user]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    await signOut();
    navigate('/');
  };

  // Statistics
  const totalScans = attendance.length;
  const today = new Date().toISOString().split('T')[0];
  const todayScans = attendance.filter(item => {
    const scanDate = new Date(item.scanned_at).toISOString().split('T')[0];
    return scanDate === today;
  }).length;

  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);
  const weekScans = attendance.filter(item => {
    const scanDate = new Date(item.scanned_at);
    return scanDate >= thisWeek;
  }).length;

  const lastScan = attendance.length > 0 
    ? new Date(attendance[0].scanned_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  // Search filter
  const filteredAttendance = attendance.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const scanDate = new Date(item.scanned_at).toLocaleDateString();
    return scanDate.toLowerCase().includes(searchLower);
  });

  return (
    <>
      {isLoggingOut && (
        <LoadingAnimation 
          message="Signing out..."
          portal="student"
        />
      )}
      <div className="min-h-screen p-5 bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white py-8 px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* User Info */}
          <div className="absolute top-5 left-8 flex items-center gap-2 text-sm z-10">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">{user?.full_name}</div>
              <div className="text-white/80 text-xs">ID: {user?.student_id}</div>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="absolute top-5 right-8 bg-white/20 hover:bg-white backdrop-blur-sm hover:text-indigo-600 px-5 py-2 border-2 border-white/30 hover:border-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 z-10"
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
            <h1 className="text-4xl font-bold mb-2 tracking-tight">San Jose Elementary School</h1>
            <p className="text-white/90 text-lg font-medium">An Automated Attendance System</p>
            <p className="text-white/80 text-sm font-medium mt-2">Student Portal - View Your Records</p>
          </div>
        </div>

        {/* Time Display */}
        <div className="px-8 py-4 bg-blue-50 border-b border-blue-100 text-center">
          <div className="text-2xl font-light text-gray-700">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-sm text-gray-500">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Attendance */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white p-6 rounded-2xl shadow-xl hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-3xl font-bold mb-2">{totalScans}</div>
              <div className="text-white/90 text-sm font-medium uppercase tracking-wider">Total Scans</div>
            </div>

            {/* Today */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-6 rounded-2xl shadow-xl hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-3xl font-bold mb-2">{todayScans}</div>
              <div className="text-white/90 text-sm font-medium uppercase tracking-wider">Today's Scans</div>
            </div>

            {/* This Week */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6 rounded-2xl shadow-xl hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="text-3xl font-bold mb-2">{weekScans}</div>
              <div className="text-white/90 text-sm font-medium uppercase tracking-wider">This Week</div>
            </div>

            {/* Last Scan */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-6 rounded-2xl shadow-xl hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold mb-2">{lastScan}</div>
              <div className="text-white/90 text-sm font-medium uppercase tracking-wider">Last Scan</div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-2xl mb-8 border-2 border-slate-200 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Student Profile</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="text-sm text-slate-600 font-semibold mb-1 uppercase tracking-wider">Full Name</div>
                <div className="text-lg text-slate-900 font-medium">{user?.full_name}</div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="text-sm text-slate-600 font-semibold mb-1 uppercase tracking-wider">Student ID</div>
                <div className="text-lg text-slate-900 font-medium">{user?.student_id}</div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="text-sm text-slate-600 font-semibold mb-1 uppercase tracking-wider">Email</div>
                <div className="text-lg text-slate-900 font-medium">{user?.email}</div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="text-sm text-slate-600 font-semibold mb-1 uppercase tracking-wider">Status</div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-lg text-emerald-600 font-bold">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance History */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">My Attendance History</h2>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none w-full sm:w-64 bg-white"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-2xl shadow-lg border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-100 to-indigo-100">
                    <th className="px-6 py-4 text-left font-bold text-blue-900">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <span>#</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-blue-900">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Date</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-blue-900">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Time</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-blue-900">
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
                  {filteredAttendance.length > 0 ? (
                    filteredAttendance.map((item, index) => {
                      const scanDate = new Date(item.scanned_at);
                      const isToday = scanDate.toDateString() === new Date().toDateString();
                      
                      return (
                        <tr 
                          key={item.id}
                          className={`border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all ${
                            isToday ? 'bg-gradient-to-r from-emerald-50 to-teal-50' : ''
                          }`}
                        >
                          <td className="px-6 py-4 text-slate-700 font-semibold">{index + 1}</td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">
                              {scanDate.toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-700 font-medium">
                              {scanDate.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded-xl text-sm font-bold border-2 border-emerald-300">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Present
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                          <span className="text-lg font-semibold">
                            {searchTerm ? 'No records found' : 'No attendance records yet'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default StudentDashboard;
