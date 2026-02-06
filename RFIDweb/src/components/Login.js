import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingAnimation from './LoadingAnimation';

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handlePortalSelect = (portal) => {
    setSelectedPortal(portal);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await signIn(formData.username, formData.password, selectedPortal);
      if (error) throw error;
      
      // Show loading animation for a better UX
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      // Navigate based on role
      if (data.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (data.role === 'student') {
        navigate('/student/dashboard');
      } else if (data.role === 'admin') {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Invalid credentials');
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedPortal(null);
    setFormData({ username: '', password: '' });
    setError('');
  };

  return (
    <>
      {loading && (
        <LoadingAnimation 
          message={`Signing in to ${selectedPortal === 'teacher' ? 'Teacher' : 'Administrator'} Portal`}
          portal={selectedPortal}
        />
      )}
      <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-12 px-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-full p-2 shadow-lg">
              <img src="/logo.png" alt="San Jose Elementary School" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight">San Jose Elementary School</h1>
            <p className="text-white/90 text-lg font-medium mb-3">
              An Automated Attendance System
            </p>
            <p className="text-white/80 text-sm font-medium">
              {!selectedPortal ? 'Select Your Portal' : `${selectedPortal === 'teacher' ? 'Teacher' : 'Administrator'} Portal`}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-10">
          {!selectedPortal ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Teacher Portal */}
              <button
                onClick={() => handlePortalSelect('teacher')}
                className="group relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white p-10 rounded-2xl 
                         hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden border-2 border-white/20"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Teacher Portal</h2>
                  <p className="text-white/90 text-sm leading-relaxed mb-6">
                    Register students and manage attendance records for your grade
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                    <span>Access Portal</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Admin Portal */}
              <button
                onClick={() => handlePortalSelect('admin')}
                className="group relative bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white p-10 rounded-2xl 
                         hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden border-2 border-white/20"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-3">System Administrator</h2>
                  <p className="text-white/90 text-sm leading-relaxed mb-6">
                    Manage teacher accounts and register student RFID cards
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                    <span>Access Portal</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            /* Login Form */
            <div className="max-w-md mx-auto">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="mb-8 flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors font-medium group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Portal Selection</span>
              </button>

              {/* Alert */}
              {error && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Demo Credentials */}
              <div className="mb-8 p-5 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-slate-900">Demo Credentials</p>
                </div>
                <div className="text-sm text-slate-700 space-y-2 ml-10">
                  {selectedPortal === 'teacher' ? (
                    <>
                      <p><span className="font-semibold text-slate-900">Username:</span> teacher</p>
                      <p><span className="font-semibold text-slate-900">Password:</span> teacher123</p>
                    </>
                  ) : selectedPortal === 'admin' ? (
                    <>
                      <p><span className="font-semibold text-slate-900">Username:</span> admin</p>
                      <p><span className="font-semibold text-slate-900">Password:</span> admin123</p>
                    </>
                  ) : (
                    <>
                      <p><span className="font-semibold text-slate-900">Username:</span> student</p>
                      <p><span className="font-semibold text-slate-900">Password:</span> student123</p>
                    </>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-3 text-sm uppercase tracking-wide">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="username"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-3 text-sm uppercase tracking-wide">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full ${
                    selectedPortal === 'teacher'
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600'
                      : selectedPortal === 'admin'
                      ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-600'
                      : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
                  } text-white py-4 rounded-xl font-bold text-base
                           hover:shadow-xl hover:scale-[1.02] transition-all duration-300 
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                           flex items-center justify-center gap-2 relative overflow-hidden group`}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="relative z-10">Sign In to {selectedPortal === 'teacher' ? 'Teacher' : selectedPortal === 'admin' ? 'Admin' : 'Student'} Portal</span>
                      <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;
