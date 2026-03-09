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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
            Analytics Dashboard
          </h1>
          <p className="text-surface-400 mt-2 text-sm sm:text-base">System-wide performance and insights</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-surface-800/50 border border-surface-700 text-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={() => refetch()}
            className="btn-glow px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
      
      {/* Key Metrics Cards - Premium Dark Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-premium hover:shadow-premium transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-surface-400">Total Users</p>
              <p className="text-3xl font-bold text-blue-400 mt-1">{analytics?.totals?.users || 8}</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg border border-blue-500/30">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-medium">+12% from last month</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-60" />
        </div>

        <div className="card-premium hover:shadow-premium transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-surface-400">Total Claims</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{analytics?.totals?.claims || 6}</p>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-lg border border-emerald-500/30">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-medium">+8% from last month</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60" />
        </div>

        <div className="card-premium hover:shadow-premium transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-surface-400">Flagged Claims</p>
              <p className="text-3xl font-bold text-orange-400 mt-1">{analytics?.totals?.flagged_claims || 0}</p>
            </div>
            <div className="bg-orange-500/20 p-3 rounded-lg border border-orange-500/30">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-medium">-5% from last month</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 opacity-60" />
        </div>

        <div className="card-premium hover:shadow-premium transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-surface-400">Approved Settlements</p>
              <p className="text-3xl font-bold text-purple-400 mt-1">₹{((analytics?.financial_summary?.total_approved_settlement || 0) / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-lg border border-purple-500/30">
              <DollarSign className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-medium">+18% from last month</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-60" />
        </div>
      </div>

      {/* Charts Row 1 - Premium Dark Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claims Trend Chart */}
        <div className="card-premium hover:shadow-premium transition-all">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-400" />
                Claims Trend
              </h3>
              <p className="text-xs text-surface-400 mt-1">Monthly performance overview</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={claimsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8' }}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#f1f5f9'
                }}
                cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
              />
              <Legend 
                wrapperStyle={{ color: '#94a3b8' }}
                iconType="circle"
              />
              <Bar dataKey="approved" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="pending" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              <Bar dataKey="rejected" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insurance Type Distribution */}
        <div className="card-premium hover:shadow-premium transition-all">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary-400" />
                Claims by Type
              </h3>
              <p className="text-xs text-surface-400 mt-1">Insurance distribution</p>
            </div>
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
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#f1f5f9'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fraud Detection Section - Premium Dark Theme */}
      {fraudTrends && (
        <div className="card-premium border-2 border-rose-500/30 bg-gradient-to-br from-rose-500/5 to-orange-500/5 hover:shadow-premium transition-all">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                <Shield className="w-6 h-6 text-rose-400" />
                Fraud Detection Analytics
              </h2>
              <p className="text-sm text-surface-400 mt-1">Real-time fraud monitoring and trends</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4 hover:border-yellow-500/50 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <Activity className="w-5 h-5 text-yellow-400" />
                <span className="text-xs font-medium text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded-full border border-yellow-500/30">
                  Average
                </span>
              </div>
              <p className="text-3xl font-bold text-yellow-400">{fraudTrends.average_fraud_score?.toFixed(1) || '0.0'}</p>
              <p className="text-sm text-surface-300 mt-1">Avg Fraud Score</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 opacity-60 group-hover:opacity-100 transition-opacity rounded-b-xl" />
            </div>

            <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-4 hover:border-emerald-500/50 transition-all group relative">
              <div className="flex items-center justify-between mb-3">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full border border-emerald-500/30">
                  Detection
                </span>
              </div>
              <p className="text-3xl font-bold text-emerald-400">{fraudTrends.fraud_detection_rate?.toFixed(1) || '0.0'}%</p>
              <p className="text-sm text-surface-300 mt-1">Detection Rate</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60 group-hover:opacity-100 transition-opacity rounded-b-xl" />
            </div>

            <div className="bg-gradient-to-br from-rose-500/20 to-pink-500/20 backdrop-blur-sm border border-rose-500/30 rounded-xl p-4 hover:border-rose-500/50 transition-all group relative">
              <div className="flex items-center justify-between mb-3">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span className="text-xs font-medium text-rose-400 bg-rose-500/20 px-2 py-1 rounded-full border border-rose-500/30">
                  Alert
                </span>
              </div>
              <p className="text-3xl font-bold text-rose-400">{fraudTrends.high_risk_claims || 0}</p>
              <p className="text-sm text-surface-300 mt-1">High Risk Claims</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity rounded-b-xl" />
            </div>
          </div>

          <div className="bg-surface-800/30 backdrop-blur-sm rounded-xl p-4 border border-surface-700/50">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fraudData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8' }}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8' }}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#f1f5f9'
                  }}
                  cursor={{ stroke: 'rgba(99, 102, 241, 0.3)' }}
                />
                <Legend 
                  wrapperStyle={{ color: '#94a3b8' }}
                  iconType="circle"
                />
                <Line type="monotone" dataKey="low" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                <Line type="monotone" dataKey="medium" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
                <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', r: 4 }} />
                <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
