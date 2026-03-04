/**
 * Main App Component
 * Handles routing and layout
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ClaimsList from './pages/ClaimsList';
import ClaimDetail from './pages/ClaimDetail';
import NewClaim from './pages/NewClaim';
import PoliciesList from './pages/PoliciesList';
import AdminAnalytics from './pages/AdminAnalytics';
import OfficerDashboard from './pages/OfficerDashboard';
import InvestigatorDashboard from './pages/InvestigatorDashboard';

// Components
import Layout from './components/Layout';
import Loading from './components/Loading';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/claims"
          element={
            <ProtectedRoute>
              <Layout>
                <ClaimsList />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/claims/new"
          element={
            <ProtectedRoute allowedRoles={['policyholder']}>
              <Layout>
                <NewClaim />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/claims/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ClaimDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/policies"
          element={
            <ProtectedRoute>
              <Layout>
                <PoliciesList />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <AdminAnalytics />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/officer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <OfficerDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/investigator/dashboard"
          element={
            <ProtectedRoute allowedRoles={['fraud_investigator', 'admin']}>
              <Layout>
                <InvestigatorDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
