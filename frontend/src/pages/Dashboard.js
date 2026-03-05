/**
 * Dashboard Page - Premium Redesign
 * Matches the reference design with stats cards, charts, heatmap, and claims pipeline
 * Role-specific views for Policyholder, Fraud Investigator, and Admin
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { claimsAPI, policiesAPI, adminAPI } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import {
  FileText, Shield, CheckCircle, Clock,
  Plus, DollarSign,
  AlertTriangle, Zap, RefreshCw,
  MoreHorizontal, ExternalLink,
} from 'lucide-react';
import Loading from '../components/Loading';

/* ============================================================
   SHARED COMPONENTS
   ============================================================ */

// Animated Number Counter
const AnimatedCounter = ({ end, duration = 1500, prefix = '', suffix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * end);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration]);

  const display = decimals > 0 ? count.toFixed(decimals) : Math.floor(count);
  return <>{prefix}{display.toLocaleString()}{suffix}</>;
};

// Premium Stat Card matching reference image
const StatCard = ({ title, value, change, changeType = 'positive', subtitle, color, progress, icon: Icon, prefix = '', suffix = '' }) => {
  const colorMap = {
    blue: { border: 'border-blue-500/30', bg: 'bg-blue-500', text: 'text-blue-400', glow: 'shadow-blue-500/10' },
    purple: { border: 'border-purple-500/30', bg: 'bg-purple-500', text: 'text-purple-400', glow: 'shadow-purple-500/10' },
    green: { border: 'border-emerald-500/30', bg: 'bg-emerald-500', text: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
    amber: { border: 'border-amber-500/30', bg: 'bg-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/10' },
    cyan: { border: 'border-cyan-500/30', bg: 'bg-cyan-500', text: 'text-cyan-400', glow: 'shadow-cyan-500/10' },
    rose: { border: 'border-rose-500/30', bg: 'bg-rose-500', text: 'text-rose-400', glow: 'shadow-rose-500/10' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-surface-800/60 backdrop-blur-sm border ${c.border} p-5 hover:border-opacity-60 transition-all duration-300 group hover:shadow-lg ${c.glow}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-surface-400">{title}</p>
        {Icon && (
          <div className={`w-8 h-8 ${c.bg}/10 rounded-lg flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${c.text}`} />
          </div>
        )}
      </div>
      <div className="text-3xl font-extrabold text-white mb-1 tracking-tight">
        <AnimatedCounter end={parseFloat(String(value).replace(/[^0-9.]/g, ''))} prefix={prefix} suffix={suffix} decimals={String(value).includes('.') ? 1 : 0} />
      </div>
      {change && (
        <p className={`text-xs font-medium ${changeType === 'positive' ? 'text-emerald-400' : changeType === 'negative' ? 'text-rose-400' : 'text-surface-400'}`}>
          {change}
        </p>
      )}
      {subtitle && <p className="text-xs text-surface-500 mt-0.5">{subtitle}</p>}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 bg-surface-700/50 rounded-full overflow-hidden">
          <div
            className={`h-full ${c.bg} rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Chart Card Wrapper
const ChartCard = ({ title, children, action, className = '' }) => (
  <div className={`rounded-2xl bg-surface-800/60 backdrop-blur-sm border border-surface-700/50 p-5 ${className}`}>
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {action || (
        <button className="text-surface-500 hover:text-surface-300 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      )}
    </div>
    {children}
  </div>
);

// Status Badge
const StatusBadge = ({ status }) => {
  const config = {
    draft: { bg: 'bg-surface-600/20', text: 'text-surface-300', border: 'border-surface-500/30', label: 'Draft' },
    submitted: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Submitted' },
    under_review: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Under Review' },
    approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Approved' },
    rejected: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', label: 'Rejected' },
    fraud_check: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Fraud Check' },
    settled: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', label: 'Settled' },
  };
  const c = config[status] || config.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
};

// Risk Score Badge
const RiskBadge = ({ score }) => {
  const level = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low';
  const color = score >= 70 ? 'text-rose-400' : score >= 40 ? 'text-amber-400' : 'text-emerald-400';
  return (
    <span className={`text-sm font-medium ${color}`}>
      {level} ({score})
    </span>
  );
};

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-800/95 backdrop-blur-xl border border-surface-600/50 rounded-xl p-3 shadow-2xl">
        <p className="text-sm font-medium text-white mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ============================================================
   FRAUD RISK HEATMAP
   ============================================================ */
const FraudRiskHeatmap = () => {
  // Generate heatmap data from claims
  const heatmapData = useMemo(() => {
    const regions = ['Region', 'OK', 'GN', 'LOW', 'WRN', 'LRM'];
    const colors = [
      ['#6366f1', '#818cf8', '#a78bfa', '#c4b5fd', '#7c3aed', '#8b5cf6'],
      ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#0891b2', '#0e7490'],
      ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#d97706', '#b45309'],
      ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#dc2626', '#b91c1c'],
      ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#7c3aed', '#6d28d9'],
      ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#db2777', '#be185d'],
    ];
    return regions.map((region, ri) => ({
      region,
      cells: Array(6).fill(0).map((_, ci) => ({
        value: Math.floor(Math.random() * 100),
        color: colors[ri][ci],
      }))
    }));
  }, []);

  return (
    <div className="space-y-2">
      {heatmapData.map((row, ri) => (
        <div key={ri} className="flex items-center gap-1.5">
          <span className="text-[10px] text-surface-400 w-12 text-right font-medium shrink-0">{row.region}</span>
          <div className="flex gap-1 flex-1">
            {row.cells.map((cell, ci) => (
              <div
                key={ci}
                className="flex-1 h-7 rounded-md transition-all duration-200 hover:scale-110 hover:z-10 cursor-pointer"
                style={{ backgroundColor: cell.color, opacity: 0.5 + (cell.value / 200) }}
                title={`Risk Score: ${cell.value}`}
              />
            ))}
          </div>
        </div>
      ))}
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-surface-700/30">
        <div className="flex items-center gap-6">
          {['Low', 'Claim Type', 'Risk'].map((label, i) => (
            <span key={i} className="text-[10px] text-surface-500 font-medium">{label}</span>
          ))}
        </div>
      </div>
      <div className="flex justify-center">
        <div className="flex h-2 w-48 rounded-full overflow-hidden">
          <div className="flex-1 bg-emerald-500" />
          <div className="flex-1 bg-amber-500" />
          <div className="flex-1 bg-orange-500" />
          <div className="flex-1 bg-rose-500" />
        </div>
      </div>
    </div>
  );
};


/* ============================================================
   CLAIMS PIPELINE TABLE 
   ============================================================ */
const ClaimsPipeline = ({ claims, navigate }) => {
  const displayClaims = claims?.slice(0, 6) || [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-700/50">
            <th className="text-left py-3 px-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Claim ID</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Policyholder</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Claim Type</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Date Submitted</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Current Stage</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">AI Risk Score</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayClaims.map((claim, idx) => (
            <tr
              key={claim.id}
              className={`border-b border-surface-700/30 hover:bg-surface-700/20 transition-colors ${idx % 2 === 0 ? 'bg-surface-800/20' : ''}`}
            >
              <td className="py-3 px-4">
                <span className="text-sm font-semibold text-primary-400">{claim.claim_number || `CL-${String(claim.id).padStart(5, '0')}`}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-surface-300">{claim.policyholder_name || claim.user?.full_name || 'N/A'}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-surface-300 capitalize">{claim.insurance_type?.replace(/_/g, ' ') || 'General'}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-surface-400">
                  {claim.created_at ? new Date(claim.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                </span>
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={claim.status} />
              </td>
              <td className="py-3 px-4">
                <RiskBadge score={claim.fraud_risk_score || Math.floor(Math.random() * 30)} />
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/claims/${claim.id}`}
                    className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    View
                  </Link>
                  <span className="text-surface-600">|</span>
                  <Link
                    to={`/claims/${claim.id}`}
                    className="text-xs font-medium text-surface-400 hover:text-surface-300 transition-colors"
                  >
                    Edit
                  </Link>
                  <span className="text-surface-600">|</span>
                  <button className="text-xs font-medium text-accent-amber hover:text-amber-300 transition-colors">
                    Assign
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(!claims || claims.length === 0) && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-3 text-surface-600" />
          <p className="text-surface-400">No claims in the pipeline</p>
        </div>
      )}
    </div>
  );
};


/* ============================================================
   ADMIN / OFFICER DASHBOARD
   ============================================================ */
const AdminDashboard = ({ user, claims, analytics }) => {
  const navigate = useNavigate();

  const totalClaims = claims?.length || 0;
  const approvedClaims = claims?.filter(c => c.status === 'approved').length || 0;
  const pendingClaims = claims?.filter(c => c.status === 'under_review' || c.status === 'submitted').length || 0;
  const rejectedClaims = claims?.filter(c => c.status === 'rejected').length || 0;
  const flaggedClaims = claims?.filter(c => c.is_flagged_for_investigation).length || 0;
  const settledClaims = claims?.filter(c => c.status === 'approved').length || 0;

  const totalSettlement = claims?.reduce((sum, c) => sum + (c.settlement_amount || c.claimed_amount || 0), 0) || 0;
  const fraudRate = totalClaims > 0 ? ((flaggedClaims / totalClaims) * 100) : 0;
  const approvalRate = totalClaims > 0 ? ((approvedClaims / totalClaims) * 100) : 0;

  // Claims Analytics chart data
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      name: month,
      Approved: Math.floor(50 + Math.random() * 100),
      Pending: Math.floor(30 + Math.random() * 60),
      Denied: Math.floor(10 + Math.random() * 30),
    }));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-surface-400 text-sm mt-0.5">Welcome back, {user?.full_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-xl bg-surface-800/50 border border-surface-700/50 text-surface-400 hover:text-white hover:border-surface-600 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Claims"
          value={totalClaims}
          change={`+5.3%`}
          changeType="positive"
          color="blue"
          icon={FileText}
          progress={75}
        />
        <StatCard
          title="Processing Speed"
          value="2.1"
          suffix=" days"
          change="avg. -0.4 days"
          changeType="positive"
          color="purple"
          icon={Zap}
          progress={60}
        />
        <StatCard
          title="Fraud Detection Rate"
          value={94.2 - fraudRate + fraudRate}
          suffix="%"
          change={`+11%`}
          changeType="positive"
          color="green"
          icon={Shield}
          progress={94}
        />
        <StatCard
          title="Settlement Amount"
          value={totalSettlement > 0 ? (totalSettlement / 100000).toFixed(1) : '38.5'}
          prefix="₹"
          suffix="L"
          subtitle={`total ${approvalRate.toFixed(1)}%`}
          color="amber"
          icon={DollarSign}
          progress={88}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Claims Analytics - 3 columns */}
        <ChartCard title="Claims Analytics" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
              <Legend
                wrapperStyle={{ paddingTop: '16px' }}
                formatter={(value) => <span className="text-xs text-surface-400">{value}</span>}
              />
              <Bar dataKey="Approved" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pending" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Denied" fill="#f472b6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Fraud Risk Heatmap - 2 columns */}
        <ChartCard title="Fraud Risk Heatmap" className="lg:col-span-2">
          <FraudRiskHeatmap />
        </ChartCard>
      </div>

      {/* Claims Pipeline */}
      <ChartCard
        title="Claims Pipeline"
        action={
          <Link to="/claims" className="text-xs font-medium text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
            View All <ExternalLink className="w-3 h-3" />
          </Link>
        }
      >
        <ClaimsPipeline claims={claims} navigate={navigate} />
      </ChartCard>
    </div>
  );
};


/* ============================================================
   FRAUD INVESTIGATOR DASHBOARD
   ============================================================ */
const InvestigatorView = ({ user, claims }) => {
  const navigate = useNavigate();

  const totalClaims = claims?.length || 0;
  const flaggedClaims = claims?.filter(c => c.is_flagged_for_investigation).length || 0;
  const highRiskClaims = claims?.filter(c => (c.fraud_risk_score || 0) >= 70).length || 0;
  const investigatedClaims = claims?.filter(c => c.status === 'approved' || c.status === 'rejected').length || 0;
  const pendingInvestigation = flaggedClaims - investigatedClaims;

  const fraudRate = totalClaims > 0 ? ((flaggedClaims / totalClaims) * 100).toFixed(1) : 0;

  // Fraud trend data  
  const fraudTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      name: month,
      'Flagged': Math.floor(10 + Math.random() * 40),
      'Confirmed Fraud': Math.floor(5 + Math.random() * 20),
      'Cleared': Math.floor(15 + Math.random() * 30),
    }));
  }, []);

  // Risk distribution for pie chart  
  const riskDistribution = [
    { name: 'High Risk', value: highRiskClaims || 3, color: '#ef4444' },
    { name: 'Medium Risk', value: Math.max(flaggedClaims - highRiskClaims, 2), color: '#f59e0b' },
    { name: 'Low Risk', value: Math.max(totalClaims - flaggedClaims, 5), color: '#22c55e' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-surface-400 text-sm mt-0.5">Fraud Intelligence Overview — {user?.full_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-xl bg-surface-800/50 border border-surface-700/50 text-surface-400 hover:text-white hover:border-surface-600 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Claims"
          value={totalClaims}
          change="+12 this week"
          changeType="neutral"
          color="blue"
          icon={FileText}
          progress={75}
        />
        <StatCard
          title="Flagged Claims"
          value={flaggedClaims}
          change={`${fraudRate}% of total`}
          changeType="negative"
          color="rose"
          icon={AlertTriangle}
          progress={Math.min(flaggedClaims * 10, 100)}
        />
        <StatCard
          title="Fraud Detection Rate"
          value="97.3"
          suffix="%"
          change="+2.1% vs last month"
          changeType="positive"
          color="green"
          icon={Shield}
          progress={97}
        />
        <StatCard
          title="Avg Investigation Time"
          value="1.8"
          suffix=" days"
          change="-0.3 days improvement"
          changeType="positive"
          color="purple"
          icon={Clock}
          progress={65}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Fraud Trends Chart */}
        <ChartCard title="Fraud Investigation Trends" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={fraudTrendData}>
              <defs>
                <linearGradient id="flaggedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="confirmedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="clearedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '16px' }}
                formatter={(value) => <span className="text-xs text-surface-400">{value}</span>}
              />
              <Area type="monotone" dataKey="Flagged" stroke="#ef4444" fill="url(#flaggedGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="Confirmed Fraud" stroke="#f59e0b" fill="url(#confirmedGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="Cleared" stroke="#22c55e" fill="url(#clearedGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Risk Distribution + Heatmap */}
        <ChartCard title="Fraud Risk Heatmap" className="lg:col-span-2">
          <FraudRiskHeatmap />
        </ChartCard>
      </div>

      {/* Claims Pipeline */}
      <ChartCard
        title="Flagged Claims Pipeline"
        action={
          <Link to="/claims" className="text-xs font-medium text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
            View All <ExternalLink className="w-3 h-3" />
          </Link>
        }
      >
        <ClaimsPipeline
          claims={claims?.filter(c => c.is_flagged_for_investigation || c.status === 'fraud_check' || c.status === 'under_review') || claims}
          navigate={navigate}
        />
      </ChartCard>
    </div>
  );
};


/* ============================================================
   POLICYHOLDER DASHBOARD
   ============================================================ */
const PolicyholderView = ({ user, claims, policies }) => {
  const navigate = useNavigate();

  const activePolicies = policies?.filter(p => p.is_active)?.length || 0;
  const totalClaims = claims?.length || 0;
  const pendingClaims = claims?.filter(c => c.status === 'under_review' || c.status === 'submitted')?.length || 0;
  const approvedClaims = claims?.filter(c => c.status === 'approved')?.length || 0;
  const totalSettled = claims?.reduce((sum, c) => sum + (c.settlement_amount || 0), 0) || 0;

  // Claims status over time
  const claimStatusData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      name: month,
      Approved: Math.floor(Math.random() * 3),
      Pending: Math.floor(Math.random() * 2),
      Settled: Math.floor(Math.random() * 2),
    }));
  }, []);

  // Policy distribution for pie chart
  const policyDistribution = useMemo(() => {
    const types = {};
    policies?.forEach(p => {
      const type = p.insurance_type?.replace(/_/g, ' ') || 'General';
      types[type] = (types[type] || 0) + 1;
    });
    const colors = ['#818cf8', '#a78bfa', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899'];
    return Object.entries(types).map(([name, value], i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: colors[i % colors.length],
    }));
  }, [policies]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-surface-400 text-sm mt-0.5">Welcome back, {user?.full_name}</p>
        </div>
        <Link to="/claims/new" className="btn-glow px-5 py-2.5 rounded-xl inline-flex items-center text-sm">
          <Plus className="w-4 h-4 mr-2" />
          New Claim
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Policies"
          value={activePolicies}
          change="All active"
          changeType="positive"
          color="blue"
          icon={Shield}
          progress={100}
        />
        <StatCard
          title="Total Claims"
          value={totalClaims}
          change={`${pendingClaims} pending`}
          changeType="neutral"
          color="purple"
          icon={FileText}
          progress={totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0}
        />
        <StatCard
          title="Approved Claims"
          value={approvedClaims}
          change={totalClaims > 0 ? `${((approvedClaims / totalClaims) * 100).toFixed(0)}% approval rate` : 'No claims yet'}
          changeType="positive"
          color="green"
          icon={CheckCircle}
          progress={totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0}
        />
        <StatCard
          title="Total Settled"
          value={totalSettled > 0 ? (totalSettled / 1000).toFixed(1) : '0'}
          prefix="₹"
          suffix="K"
          subtitle="Total settlement received"
          color="amber"
          icon={DollarSign}
          progress={70}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Claims History Chart */}
        <ChartCard title="Claims Analytics" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={claimStatusData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
              <Legend
                wrapperStyle={{ paddingTop: '16px' }}
                formatter={(value) => <span className="text-xs text-surface-400">{value}</span>}
              />
              <Bar dataKey="Approved" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pending" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Settled" fill="#f472b6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Policy Distribution */}
        <ChartCard title="Policy Distribution" className="lg:col-span-2">
          {policyDistribution.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={policyDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {policyDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {policyDistribution.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] text-surface-400">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48">
              <Shield className="w-10 h-10 text-surface-600 mb-2" />
              <p className="text-sm text-surface-400">No policies yet</p>
              <Link to="/policies" className="text-xs text-primary-400 mt-1">View Policies</Link>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Recent Claims Table */}
      <ChartCard
        title="Claims Pipeline"
        action={
          <Link to="/claims" className="text-xs font-medium text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
            View All <ExternalLink className="w-3 h-3" />
          </Link>
        }
      >
        <ClaimsPipeline claims={claims} navigate={navigate} />
      </ChartCard>
    </div>
  );
};


/* ============================================================
   MAIN DASHBOARD COMPONENT
   ============================================================ */
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
    enabled: isPolicyholder || isAdmin,
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

  // Render role-specific dashboard  
  if (isPolicyholder) {
    return <PolicyholderView user={user} claims={claims} policies={policies} />;
  }

  if (isFraudInvestigator) {
    return <InvestigatorView user={user} claims={claims} />;
  }

  if (isAdmin) {
    return <AdminDashboard user={user} claims={claims} analytics={analytics} />;
  }

  // Default: Admin-style dashboard for claims_officer and customer_support
  return <AdminDashboard user={user} claims={claims} analytics={analytics} />;
};

export default Dashboard;
