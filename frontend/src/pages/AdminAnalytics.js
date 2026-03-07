import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import { 
  BarChart3, TrendingUp, AlertTriangle, Users, FileText, 
  Shield, DollarSign, Activity, Eye, ChevronDown, RefreshCw 
} from 'lucide-react';
import Loading from '../components/Loading';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState('30d');
  
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => adminAPI.getAnalytics(),
  });

  const { data: fraudTrends } = useQuery({
    queryKey: ['fraudTrends'],
    queryFn: () => adminAPI.getFraudTrends(),
  });

  if (isLoading) return <Loading />;

  // Mock data for charts - replace with real data when API is ready
  const claimsData = [
    { month: 'Jan', approved: 65, pending: 28, rejected: 12 },
    { month: 'Feb', approved: 59, pending: 32, rejected: 15 },
    { month: 'Mar', approved: 80, pending: 25, rejected: 10 },
    { month: 'Apr', approved: 81, pending: 30, rejected: 14 },
    { month: 'May', approved: 56, pending: 35, rejected: 18 },
    { month: 'Jun', approved: 95, pending: 22, rejected: 8 },
  ];

  const pieData = [
    { name: 'Health', value: 400, color: '#0088FE' },
    { name: 'Motor', value: 300, color: '#00C49F' },
    { name: 'Home', value: 200, color: '#FFBB28' },
    { name: 'Life', value: 100, color: '#FF8042' },
  ];

  const fraudData = [
    { month: 'Jan', low: 45, medium: 30, high: 15, critical: 10 },
    { month: 'Feb', low: 52, medium: 28, high: 12, critical: 8 },
    { month: 'Mar', low: 48, medium: 32, high: 14, critical: 11 },
    { month: 'Apr', low: 61, medium: 25, high: 10, critical: 4 },
    { month: 'May', low: 55, medium: 27, high: 13, critical: 5 },
    { month: 'Jun', low: 63, medium: 22, high: 10, critical: 5 },
  ];

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">System-wide performance and insights</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold mb-1">{analytics?.totals?.users || 0}</p>
          <p className="text-sm opacity-90">Total Users</p>
          <div className="mt-3 text-xs opacity-75">+12% from last month</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <Activity className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold mb-1">{analytics?.totals?.claims || 0}</p>
          <p className="text-sm opacity-90">Total Claims</p>
          <div className="mt-3 text-xs opacity-75">+8% from last month</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <Shield className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold mb-1">{analytics?.totals?.flagged_claims || 0}</p>
          <p className="text-sm opacity-90">Flagged Claims</p>
          <div className="mt-3 text-xs opacity-75">-5% from last month</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold mb-1">₹{((analytics?.financial_summary?.total_approved_settlement || 0) / 1000).toFixed(0)}K</p>
          <p className="text-sm opacity-90">Approved Settlements</p>
          <div className="mt-3 text-xs opacity-75">+18% from last month</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claims Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Claims Trend</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={claimsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="approved" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="pending" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              <Bar dataKey="rejected" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insurance Type Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Claims by Type</h3>
            <Eye className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fraud Detection Section */}
      {fraudTrends && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-red-600" />
                Fraud Detection Analytics
              </h2>
              <p className="text-sm text-gray-600 mt-1">Real-time fraud monitoring and trends</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                  Average
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{fraudTrends.average_fraud_score?.toFixed(1)}</p>
              <p className="text-sm text-gray-600 mt-1">Avg Fraud Score</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  Detection
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{fraudTrends.fraud_detection_rate?.toFixed(1)}%</p>
              <p className="text-sm text-gray-600 mt-1">Detection Rate</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                  Alert
                </span>
              </div>
              <p className="text-3xl font-bold text-red-600">{fraudTrends.high_risk_claims}</p>
              <p className="text-sm text-gray-600 mt-1">High Risk Claims</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={fraudData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="low" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="medium" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} />
              <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
