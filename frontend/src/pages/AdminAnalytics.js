import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import { BarChart3, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import Loading from '../components/Loading';

const AdminAnalytics = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => adminAPI.getAnalytics(),
  });

  const { data: fraudTrends } = useQuery({
    queryKey: ['fraudTrends'],
    queryFn: () => adminAPI.getFraudTrends(),
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="card">
          <Users className="w-8 h-8 text-primary-600 mb-2" />
          <p className="text-2xl font-bold">{analytics?.totals?.users}</p>
          <p className="text-sm text-gray-600">Total Users</p>
        </div>
        <div className="card">
          <BarChart3 className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold">{analytics?.totals?.claims}</p>
          <p className="text-sm text-gray-600">Total Claims</p>
        </div>
        <div className="card">
          <AlertTriangle className="w-8 h-8 text-red-600 mb-2" />
          <p className="text-2xl font-bold">{analytics?.totals?.flagged_claims}</p>
          <p className="text-sm text-gray-600">Flagged Claims</p>
        </div>
        <div className="card">
          <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-2xl font-bold">₹{(analytics?.financial_summary?.total_approved_settlement / 1000)?.toFixed(0)}K</p>
          <p className="text-sm text-gray-600">Approved Settlements</p>
        </div>
      </div>

      {fraudTrends && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Fraud Detection Trends</h2>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm text-gray-600">Avg Fraud Score</dt>
              <dd className="text-2xl font-bold text-gray-900">{fraudTrends.average_fraud_score?.toFixed(1)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Detection Rate</dt>
              <dd className="text-2xl font-bold text-gray-900">{fraudTrends.fraud_detection_rate?.toFixed(1)}%</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">High Risk Claims</dt>
              <dd className="text-2xl font-bold text-red-600">{fraudTrends.high_risk_claims}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
