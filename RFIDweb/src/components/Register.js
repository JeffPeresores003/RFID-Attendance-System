import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    studentId: '',
    grade: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePortalSelect = (portal) => {
    setSelectedPortal(portal);
    setError('');
    setSuccess('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      studentId: '',
      grade: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.email || !formData.password || !formData.fullName || !formData.grade) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (selectedPortal === 'student' && !formData.studentId) {
      setError('Student ID is required for student accounts');
      return;
    }

    setLoading(true);

    const { error } = await signUp(
      formData.email,
      formData.password,
      selectedPortal,
      formData.fullName,
      formData.studentId,
      parseInt(formData.grade)
    );

    setLoading(false);

    if (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } else {
      if (selectedPortal === 'teacher') {
        setSuccess('Registration successful! Your teacher account is pending approval. You will be notified once approved.');
        setTimeout(() => navigate('/'), 3000);
      } else {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/'), 2000);
      }
    }
  };

  if (!selectedPortal) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="w-full max-w-5xl bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10">
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
                Create New Account - Select Portal Type
              </p>
            </div>
          </div>

          {/* Portal Selection */}
          <div className="p-12">
            <h2 className="text-2xl font-bold text-white text-center mb-8">Choose Account Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Teacher Portal */}
              <button
                onClick={() => handlePortalSelect('teacher')}
                className="group relative bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-8 rounded-2xl shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-2xl transition-all"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Teacher Portal</h3>
                  <p className="text-white/90 text-sm mb-4">Full access to manage students and attendance</p>
                  <div className="inline-block bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-medium">
                    Requires Admin Approval
                  </div>
                </div>
              </button>

              {/* Student Portal */}
              <button
                onClick={() => handlePortalSelect('student')}
                className="group relative bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-8 rounded-2xl shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-2xl transition-all"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Student Portal</h3>
                  <p className="text-white/90 text-sm mb-4">View your personal attendance records</p>
                  <div className="inline-block bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-medium">
                    Instant Access
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-8 text-center">
              <Link to="/" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors">
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10">
        {/* Header */}
        <div className={`bg-gradient-to-r ${selectedPortal === 'teacher' ? 'from-emerald-600 via-teal-600 to-cyan-600' : 'from-blue-600 via-indigo-600 to-purple-600'} text-white py-8 px-8 text-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full p-2 shadow-lg">
              <img src="/logo.png" alt="San Jose Elementary School" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Create {selectedPortal === 'teacher' ? 'Teacher' : 'Student'} Account</h1>
            <p className="text-white/80 text-sm">San Jose Elementary School</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>

            {/* Student ID (only for students) */}
            {selectedPortal === 'student' && (
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Student ID *
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="e.g., 2021-001"
                  disabled={loading}
                />
              </div>
            )}

            {/* Grade Selection */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                {selectedPortal === 'teacher' ? 'Teaching Grade *' : 'Grade Level *'}
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                disabled={loading}
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

            {/* Email */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="your.email@school.com"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Minimum 6 characters"
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Re-enter your password"
                disabled={loading}
              />
            </div>

            {selectedPortal === 'teacher' && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-300 text-xs">
                  <strong>Note:</strong> Teacher accounts require approval from the System Administrator before you can access the dashboard.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                loading
                  ? 'bg-slate-600 cursor-not-allowed'
                  : selectedPortal === 'teacher'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
              } shadow-lg hover:shadow-xl`}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              onClick={() => setSelectedPortal(null)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
              disabled={loading}
            >
              ← Change Portal
            </button>
            <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
