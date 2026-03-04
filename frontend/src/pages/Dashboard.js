/**
 * Dashboard Page
 * Role-specific dashboard displaying relevant information
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { claimsAPI, policiesAPI, adminAPI } from '../services/api';
import {
  FileText,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
} from 'lucide-react';
import Loading from '../components/Loading';

const Dashboard = () => {
  const { user, isPolicyholder, isAdmin, isFraudInvestigator } = useAuth();

  // Fetch claims
  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: () => claimsAPI.list(),
  });

  // Fetch policies (for policyholders)
  const { data: policies } = useQuery({
    queryKey: ['policies'],
    queryFn: () => policiesAPI.list(),
    enabled: isPolicyholder,
  });

  // Fetch analytics (for admin/officers)
  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => adminAPI.getAnalytics(),
    enabled: isAdmin,
  });

  if (claimsLoading) {
    return <Loading message="Loading dashboard..." />;
  }

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      draft: { color: 'badge-info', label: 'Draft' },
      submitted: { color: 'badge-warning', label: 'Submitted' },
      under_review: { color: 'badge-warning', label: 'Under Review' },
      approved: { color: 'badge-success', label: 'Approved' },
      rejected: { color: 'badge-danger', label: 'Rejected' },
      fraud_check: { color: 'badge-danger', label: 'Fraud Check' },
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return <span className={`badge ${config.color}`}>{config.label}</span>;
  };

  // Policyholder Dashboard
  if (isPolicyholder) {
    const activePolicies = policies?.filter((p) => p.is_active) || [];
    const pendingClaims = claims?.filter((c) => c.status === 'under_review' || c.status === 'submitted') || [];
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Link to="/claims/new" className="btn btn-primary inline-flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            New Claim
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <Shield className="w-10 h-10 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">{activePolicies.length}</p>
            <p className="text-primary-100">Active Policies</p>
          </div>
          
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <FileText className="w-10 h-10 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">{claims?.length || 0}</p>
            <p className="text-blue-100">Total Claims</p>
          </div>
          
          <div className="card bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <Clock className="w-10 h-10 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">{pendingClaims.length}</p>
            <p className="text-amber-100">Pending Claims</p>
          </div>
        </div>

        {/* Recent Claims */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Claims</h2>
            <Link to="/claims" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          
          {claims && claims.length > 0 ? (
            <div className="space-y-3">
              {claims.slice(0, 5).map((claim) => (
                <Link
                  key={claim.id}
                  to={`/claims/${claim.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{claim.claim_number}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        ₹{claim.claimed_amount?.toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No claims yet</p>
              <Link to="/claims/new" className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block">
                Submit your first claim
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin/Officer Dashboard
  if (isAdmin || isFraudInvestigator) {
    const flaggedClaims = claims?.filter((c) => c.is_flagged_for_investigation) || [];
    const pendingReview = claims?.filter((c) => c.status === 'under_review') || [];
    
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Claims</p>
                <p className="text-3xl font-bold text-gray-900">{analytics?.totals?.claims || 0}</p>
              </div>
              <FileText className="w-10 h-10 text-primary-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Flagged for Fraud</p>
                <p className="text-3xl font-bold text-danger-600">{flaggedClaims.length}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-danger-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-3xl font-bold text-warning-600">{pendingReview.length}</p>
              </div>
              <Clock className="w-10 h-10 text-warning-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Policies</p>
                <p className="text-3xl font-bold text-success-600">{analytics?.totals?.policies || 0}</p>
              </div>
              <Shield className="w-10 h-10 text-success-600" />
            </div>
          </div>
        </div>

        {/* Claims Requiring Attention */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Claims Requiring Attention</h2>
          
          {pendingReview.length > 0 ? (
            <div className="space-y-3">
              {pendingReview.slice(0, 5).map((claim) => (
                <Link
                  key={claim.id}
                  to={`/claims/${claim.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{claim.claim_number}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Amount: ${claim.claimed_amount?.toLocaleString()}
                      </p>
                      {claim.is_flagged_for_investigation && (
                        <span className="inline-flex items-center text-xs text-danger-600 mt-2">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Flagged for investigation
                        </span>
                      )}
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success-500" />
              <p>All caught up! No claims pending review.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default dashboard
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.full_name}</h1>
      <div className="card">
        <p className="text-gray-600">Your dashboard is loading...</p>
      </div>
    </div>
  );
};

export default Dashboard;
