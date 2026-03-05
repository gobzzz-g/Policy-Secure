/**
 * Dashboard Page - Premium Dark Theme
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
  ArrowRight,
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

  // Stats Card Component
  const StatCard = ({ icon: Icon, value, label, gradient, iconColor }) => (
    <div className="card card-hover group relative overflow-hidden">
      <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${gradient} rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-sm text-surface-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Policyholder Dashboard
  if (isPolicyholder) {
    const activePolicies = policies?.filter((p) => p.is_active) || [];
    const pendingClaims = claims?.filter((c) => c.status === 'under_review' || c.status === 'submitted') || [];

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-surface-400 mt-1">Welcome back, {user?.full_name}</p>
          </div>
          <Link to="/claims/new" className="btn-glow px-5 py-3 rounded-xl inline-flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            New Claim
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={Shield} value={activePolicies.length} label="Active Policies" gradient="from-primary-500 to-primary-600" />
          <StatCard icon={FileText} value={claims?.length || 0} label="Total Claims" gradient="from-accent-cyan to-teal-600" />
          <StatCard icon={Clock} value={pendingClaims.length} label="Pending Claims" gradient="from-accent-amber to-orange-600" />
        </div>

        {/* Recent Claims */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Claims</h2>
            <Link to="/claims" className="text-primary-400 hover:text-primary-300 text-sm font-medium inline-flex items-center transition-colors">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {claims && claims.length > 0 ? (
            <div className="space-y-3">
              {claims.slice(0, 5).map((claim) => (
                <Link
                  key={claim.id}
                  to={`/claims/${claim.id}`}
                  className="block p-4 bg-surface-800/30 border border-surface-700/50 rounded-xl hover:border-primary-500/30 hover:bg-primary-500/5 transition-all duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-white">{claim.claim_number}</p>
                      <p className="text-sm text-surface-400 mt-1">
                        ₹{claim.claimed_amount?.toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-3 text-surface-600" />
              <p className="text-surface-400">No claims yet</p>
              <Link to="/claims/new" className="text-primary-400 hover:text-primary-300 text-sm font-medium mt-2 inline-block transition-colors">
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
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-surface-400 mt-1">Overview of claims and operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={FileText} value={analytics?.totals?.claims || 0} label="Total Claims" gradient="from-primary-500 to-primary-600" />
          <StatCard icon={AlertCircle} value={flaggedClaims.length} label="Flagged for Fraud" gradient="from-accent-rose to-pink-600" />
          <StatCard icon={Clock} value={pendingReview.length} label="Pending Review" gradient="from-accent-amber to-orange-600" />
          <StatCard icon={Shield} value={analytics?.totals?.policies || 0} label="Total Policies" gradient="from-accent-emerald to-green-600" />
        </div>

        {/* Claims Requiring Attention */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Claims Requiring Attention</h2>

          {pendingReview.length > 0 ? (
            <div className="space-y-3">
              {pendingReview.slice(0, 5).map((claim) => (
                <Link
                  key={claim.id}
                  to={`/claims/${claim.id}`}
                  className="block p-4 bg-surface-800/30 border border-surface-700/50 rounded-xl hover:border-primary-500/30 hover:bg-primary-500/5 transition-all duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-white">{claim.claim_number}</p>
                      <p className="text-sm text-surface-400 mt-1">
                        Amount: ₹{claim.claimed_amount?.toLocaleString()}
                      </p>
                      {claim.is_flagged_for_investigation && (
                        <span className="inline-flex items-center text-xs text-accent-rose mt-2">
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
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-accent-emerald" />
              <p className="text-surface-400">All caught up! No claims pending review.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default dashboard
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-white">Welcome, {user?.full_name}</h1>
      <div className="card">
        <p className="text-surface-400">Your dashboard is loading...</p>
      </div>
    </div>
  );
};

export default Dashboard;
