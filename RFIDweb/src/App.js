import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SystemAdmin from './components/SystemAdmin';

// Protected Route Component for Teachers
const TeacherRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (user.role !== 'teacher') return <Navigate to="/" />;
  return children;
};

// Protected Route Component for Admins
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

// Public Route (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return children;
  
  // Redirect based on role
  if (user.role === 'teacher') {
    return <Navigate to="/teacher/dashboard" />;
  } else if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/teacher/dashboard" 
            element={
              <TeacherRoute>
                <Dashboard />
              </TeacherRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminRoute>
                <SystemAdmin />
              </AdminRoute>
            } 
          />
          {/* Legacy route redirect */}
          <Route path="/dashboard" element={<Navigate to="/teacher/dashboard" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
