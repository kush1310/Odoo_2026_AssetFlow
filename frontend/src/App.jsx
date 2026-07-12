import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import OrgSetup from './pages/OrgSetup';
import AssetDirectory from './pages/AssetDirectory';
import Allocations from './pages/Allocations';
import Bookings from './pages/Bookings';
import Maintenance from './pages/Maintenance';
import Audits from './pages/Audits';
import Reports from './pages/Reports';
import Logs from './pages/Logs';
import Help from './pages/Help';
import Profile from './pages/Profile';
import ResourceRequests from './pages/ResourceRequests';


// Helper component to guard private routes
const PrivateRoute = ({ children, allowedRoles, user }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Unprotected Auth Routes */}
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login setUser={setUser} />} />
            <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
            <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />
            <Route path="/reset-password" element={user ? <Navigate to="/" replace /> : <ResetPassword />} />
            
            {/* Protected Dashboard/App Routes */}
            <Route 
              path="/*" 
              element={
                <PrivateRoute user={user}>
                  <Layout user={user} setUser={setUser}>
                    <Routes>
                      <Route path="/" element={<Dashboard user={user} />} />
                      <Route 
                        path="/assets" 
                        element={
                          <PrivateRoute allowedRoles={['Admin', 'Asset Manager', 'Department Head', 'Employee', 'Technician']} user={user}>
                            <AssetDirectory user={user} />
                          </PrivateRoute>
                        } 
                      />
                      <Route 
                        path="/allocations" 
                        element={
                          <PrivateRoute allowedRoles={['Admin', 'Asset Manager', 'Department Head', 'Employee']} user={user}>
                            <Allocations user={user} />
                          </PrivateRoute>
                        } 
                      />
                      <Route 
                        path="/bookings" 
                        element={
                          <PrivateRoute allowedRoles={['Admin', 'Asset Manager', 'Department Head', 'Employee', 'Technician']} user={user}>
                            <Bookings user={user} />
                          </PrivateRoute>
                        } 
                      />
                      <Route 
                        path="/maintenance" 
                        element={
                          <PrivateRoute allowedRoles={['Admin', 'Asset Manager', 'Department Head', 'Employee', 'Technician']} user={user}>
                            <Maintenance user={user} />
                          </PrivateRoute>
                        } 
                      />
                      <Route 
                        path="/resource-requests" 
                        element={
                          <PrivateRoute allowedRoles={['Admin', 'Asset Manager', 'Department Head', 'Employee']} user={user}>
                            <ResourceRequests user={user} />
                          </PrivateRoute>
                        } 
                      />
                      
                      {/* Scope restricted routes */}
                      <Route 
                        path="/org-setup" 
                        element={
                          <PrivateRoute allowedRoles={['Admin']} user={user}>
                            <OrgSetup user={user} />
                          </PrivateRoute>
                        } 
                      />
                      <Route 
                        path="/audits" 
                        element={
                          <PrivateRoute allowedRoles={['Admin', 'Asset Manager', 'Department Head']} user={user}>
                            <Audits user={user} />
                          </PrivateRoute>
                        } 
                      />
                      <Route 
                        path="/reports" 
                        element={
                          <PrivateRoute allowedRoles={['Admin', 'Asset Manager', 'Department Head']} user={user}>
                            <Reports user={user} />
                          </PrivateRoute>
                        } 
                      />
                      <Route 
                        path="/logs" 
                        element={
                          <PrivateRoute allowedRoles={['Admin']} user={user}>
                            <Logs />
                          </PrivateRoute>
                        } 
                      />
                      <Route path="/help" element={<Help user={user} />} />
                      <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
                      
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              } 
            />
          </Routes>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
