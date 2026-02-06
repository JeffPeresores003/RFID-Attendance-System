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
  const [showPassword, setShowPassword] = useState(false);

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
    setShowPassword(false);
  };

  return (
    <>
      {loading && (
        <LoadingAnimation 
          message={`Signing in to ${selectedPortal === 'teacher' ? 'Teacher' : 'Administrator'} Portal`}
          portal={selectedPortal}
        />
      )}
      <div className="min-h-screen flex items-center justify-center p-5 bg-[#F7F5EF]">
        <div className="bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full border border-[#6E8B6D]/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F5C4B] via-[#0F5C4B] to-[#6E8B6D] text-white py-10 px-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="w-24 h-24 mx-auto mb-3 bg-white rounded-2xl p-2 shadow-lg">
              <img src="/logo.png" alt="San Jose Elementary School" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-bold mb-1 tracking-tight">San Jose Elementary School</h1>
            <p className="text-white/90 text-base font-medium mb-2">
              Automated Attendance System
            </p>
            <p className="text-white/80 text-sm font-medium">
              {!selectedPortal ? 'Select Your Portal' : `${selectedPortal === 'teacher' ? 'Teacher' : 'Administrator'} Portal`}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-10">
          {!selectedPortal ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-6">
                {/* Teacher Portal Card */}
                <div className="bg-gradient-to-br from-[#0F5C4B] to-[#6E8B6D] text-white p-8 rounded-2xl shadow-lg">
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Teacher Portal</h2>
                    <p className="text-white/90 text-sm leading-relaxed">
                      Manage student attendance records for your grade
                    </p>
                  </div>
                </div>

                {/* Admin Portal Card */}
                <div className="bg-gradient-to-br from-[#E0B23C] to-[#6E8B6D] text-[#1F1F1F] p-8 rounded-2xl shadow-lg">
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto mb-4 bg-white/40 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-[#1F1F1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2">System Administrator</h2>
                    <p className="text-[#1F1F1F]/90 text-sm leading-relaxed">
                      Manage teacher accounts and register student RFID cards
                    </p>
                  </div>
                </div>
              </div>

              {/* Login Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-6">
                <button
                  onClick={() => handlePortalSelect('teacher')}
                  className="bg-gradient-to-r from-[#0F5C4B] to-[#6E8B6D] text-white py-3 px-6 rounded-xl font-semibold text-sm
                           hover:shadow-xl hover:scale-[1.02] transition-all duration-300 
                           flex items-center justify-center gap-2 group"
                >
                  <span>Login as Teacher</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => handlePortalSelect('admin')}
                  className="bg-gradient-to-r from-[#E0B23C] to-[#6E8B6D] text-[#1F1F1F] py-3 px-6 rounded-xl font-semibold text-sm
                           hover:shadow-xl hover:scale-[1.02] transition-all duration-300 
                           flex items-center justify-center gap-2 group"
                >
                  <span>Login as Administrator</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Footer */}
              <div className="text-center text-slate-600 text-sm mt-8">
                © 2026 San Jose Elementary School
              </div>
            </>
          ) : (
            /* Login Form */
            <div className="max-w-lg mx-auto">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="mb-6 flex items-center gap-2 text-slate-600 hover:text-[#0F5C4B] transition-colors font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Back to Portal Selection</span>
              </button>

              {/* Alert */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-2 text-xs uppercase tracking-wide">
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
                      placeholder="Bible@gmail.com"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-[#F7F5EF] border border-[#6E8B6D]/30 rounded-xl 
                               focus:bg-white focus:border-[#0F5C4B] focus:ring-2 focus:ring-[#6E8B6D]/30 
                               focus:outline-none transition-all text-slate-700 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-2 text-xs uppercase tracking-wide">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-12 py-3.5 bg-[#F7F5EF] border border-[#6E8B6D]/30 rounded-xl 
                               focus:bg-white focus:border-[#0F5C4B] focus:ring-2 focus:ring-[#6E8B6D]/30 
                               focus:outline-none transition-all text-slate-700 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full ${
                    selectedPortal === 'teacher'
                      ? 'bg-gradient-to-r from-[#0F5C4B] to-[#6E8B6D] text-white'
                      : selectedPortal === 'admin'
                      ? 'bg-gradient-to-r from-[#E0B23C] to-[#6E8B6D] text-[#1F1F1F]'
                      : 'bg-gradient-to-r from-[#0F5C4B] to-[#6E8B6D] text-white'
                  } py-3.5 rounded-xl font-bold text-base
                           hover:shadow-xl hover:scale-[1.02] transition-all duration-300 
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                           flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Sign In to {selectedPortal === 'teacher' ? 'Teacher' : 'Admin'} Portal</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
