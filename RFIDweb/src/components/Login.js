import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
        navigate('/dashboard');
      } else {
        // Sign Up
        if (!formData.fullName) {
          throw new Error('Please enter your full name');
        }
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) throw error;
        setSuccess('Account created successfully! You can now login.');
        setTimeout(() => {
          setIsLogin(true);
          setSuccess('');
        }, 2000);
      }
    } catch (error) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({ email: '', password: '', fullName: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-dark to-green text-white py-10 px-8 text-center">
          <div className="text-5xl mb-4">🎓</div>
          <h1 className="text-3xl font-light mb-2">RFID Attendance</h1>
          <p className="text-white/90">System {isLogin ? 'Login' : 'Sign Up'}</p>
        </div>

        {/* Body */}
        <div className="p-10">
          {/* Alerts */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name (Sign Up only) */}
            {!isLogin && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:border-green focus:outline-none transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">
                    👤
                  </span>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:border-green focus:outline-none transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">
                  ✉️
                </span>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  placeholder={isLogin ? "Enter your password" : "Minimum 6 characters"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:border-green focus:outline-none transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">
                  🔒
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-700 to-green text-white py-3.5 rounded-lg font-semibold 
                         hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 
                         disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none
                         flex items-center justify-center min-h-[50px]"
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <span>{isLogin ? '🔓 Login' : '✨ Sign Up'}</span>
              )}
            </button>
          </form>

          {/* Toggle Form */}
          <div className="mt-5 text-center text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleMode}
              className="text-green font-semibold hover:underline"
            >
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
        navigate('/dashboard');
      } else {
        // Sign Up
        if (!formData.fullName) {
          throw new Error('Please enter your full name');
        }
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) throw error;
        setSuccess('Account created successfully! You can now login.');
        setTimeout(() => {
          setIsLogin(true);
          setSuccess('');
        }, 2000);
      }
    } catch (error) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({ email: '', password: '', fullName: '' });
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <div className="icon">🎓</div>
          <h1>RFID Attendance</h1>
          <p>System {isLogin ? 'Login' : 'Sign Up'}</p>
        </div>

        <div className="auth-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required={!isLogin}
                  />
                  <span className="input-icon">👤</span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <span className="input-icon">✉️</span>
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <input
                  type="password"
                  name="password"
                  placeholder={isLogin ? "Enter your password" : "Minimum 6 characters"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                />
                <span className="input-icon">🔒</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  {isLogin ? '🔓 Login' : '✨ Sign Up'}
                </>
              )}
            </button>
          </form>

          <div className="toggle-form">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={toggleMode} className="link-button">
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
