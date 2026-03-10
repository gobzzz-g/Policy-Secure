import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { claimsAPI, adminAPI } from '../services/api';
import { Plus } from 'lucide-react';
import Loading from '../components/Loading';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const mockAnalyticsData = [
  { name: 'Jan', Approved: 50, Pending: 75, Denied: 20 },
  { name: 'Feb', Approved: 85, Pending: 120, Denied: 30 },
  { name: 'Mar', Approved: 60, Pending: 90, Denied: 25 },
  { name: 'Apr', Approved: 120, Pending: 140, Denied: 40 },
  { name: 'May', Approved: 90, Pending: 110, Denied: 35 },
  { name: 'Jun', Approved: 140, Pending: 180, Denied: 50 },
];

const HeatmapMock = () => {
  const grid = Array.from({ length: 30 }).map((_, i) => {
    const colors = [
      'bg-indigo-600', 'bg-violet-500', 'bg-fuchsia-500', 'bg-orange-500', 'bg-orange-400', 'bg-orange-600',
      'bg-indigo-500', 'bg-violet-400', 'bg-fuchsia-400', 'bg-orange-400', 'bg-orange-300', 'bg-amber-500',
      'bg-indigo-400', 'bg-violet-300', 'bg-fuchsia-300', 'bg-orange-300', 'bg-amber-400', 'bg-amber-600',
      'bg-blue-500', 'bg-indigo-300', 'bg-violet-300', 'bg-fuchsia-300', 'bg-orange-400', 'bg-rose-400',
      'bg-blue-400', 'bg-indigo-200', 'bg-violet-200', 'bg-purple-300', 'bg-fuchsia-400', 'bg-rose-500',
    ];
    return <div key={i} className={`${colors[i % colors.length]} w-full h-8 rounded-md hover:scale-105 transition-transform`} />;
  });

  return (
    <div className="card bg-surface-900 border border-surface-700/50 p-6 flex flex-col h-full rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-semibold">Fraud Risk Heatmap</h3>
        <span className="text-surface-500 text-xs cursor-pointer hover:text-white">Sync</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-6 gap-2 w-full">
          {grid}
        </div>
      </div>
      <div className="mt-8 flex items-center justify-between text-xs text-surface-400 font-medium">
        <span>Low</span>
        <div className="flex-1 mx-4 h-2 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-orange-500" />
        <span>Risk</span>
      </div>
    </div>
  );
};

const SpinningPieChart = () => {
  const pieData = [
    { label: 'Approved', value: 35, color: '#10b981' },
    { label: 'Pending', value: 45, color: '#f59e0b' },
    { label: 'Under Review', value: 15, color: '#3b82f6' },
    { label: 'Rejected', value: 5, color: '#ef4444' },
  ];

  let cumulativePercent = 0;

  return (
    <div className="card bg-surface-900 border border-surface-700/50 p-6 flex flex-col h-full rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-semibold">Claims Status Distribution</h3>
        <span className="text-surface-500 text-xs cursor-pointer hover:text-white">Live</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <style>
          {`
            @keyframes spinPie {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
            .pie-chart-spin {
              animation: spinPie 3s ease-in-out;
            }
          `}
        </style>
        <svg viewBox="0 0 200 200" className="w-48 h-48 pie-chart-spin">
          <circle cx="100" cy="100" r="90" fill="transparent" />
          {pieData.map((segment, index) => {
            const [startX, startY] = [
              100 + 90 * Math.cos(2 * Math.PI * cumulativePercent / 100 - Math.PI / 2),
              100 + 90 * Math.sin(2 * Math.PI * cumulativePercent / 100 - Math.PI / 2),
            ];
            cumulativePercent += segment.value;
            const [endX, endY] = [
              100 + 90 * Math.cos(2 * Math.PI * cumulativePercent / 100 - Math.PI / 2),
              100 + 90 * Math.sin(2 * Math.PI * cumulativePercent / 100 - Math.PI / 2),
            ];
            const largeArcFlag = segment.value > 50 ? 1 : 0;
            const pathData = [
              `M 100 100`,
              `L ${startX} ${startY}`,
              `A 90 90 0 ${largeArcFlag} 1 ${endX} ${endY}`,
              `Z`,
            ].join(' ');
            return (
              <path
                key={index}
                d={pathData}
                fill={segment.color}
                stroke="#0f172a"
                strokeWidth="2"
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            );
          })}
          <circle cx="100" cy="100" r="50" fill="#0f172a" />
          <text x="100" y="95" textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="bold">
            100%
          </text>
          <text x="100" y="110" textAnchor="middle" fill="#94a3b8" fontSize="10">
            Total Claims
          </text>
        </svg>
      </div>
      <div className="mt-6 space-y-2">
        {pieData.map((segment, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="text-surface-300">{segment.label}</span>
            </div>
            <span className="text-white font-medium">{segment.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtext, subtextColor, glowColor }) => (
  <div className="bg-surface-900 border border-surface-700/50 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-[120px] group hover:border-surface-600 transition-colors">
    <div>
      <h3 className="text-surface-400 text-sm font-medium">{title}</h3>
      <div className="text-3xl font-bold text-white mt-1">{value}</div>
    </div>
    <div className={`text-xs font-medium ${subtextColor}`}>{subtext}</div>
    {/* Bottom glow line */}
    <div className={`absolute bottom-0 left-0 right-0 h-1 ${glowColor} opacity-80`} />
    <div className={`absolute bottom-0 left-0 right-0 h-6 ${glowColor} opacity-20 blur-xl group-hover:opacity-30 transition-opacity`} />
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-800 border border-surface-700 p-3 rounded-xl shadow-xl">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm mt-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-surface-300">{entry.name}:</span>
            <span className="text-white font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { user, isPolicyholder, isAdmin, isFraudInvestigator } = useAuth();
  const navigate = useNavigate();

  const handleEdit = (claimId) => {
    navigate(`/claims/${claimId}`);
  };

  const handleAssign = (claimId) => {
    alert(`Assign functionality for claim ${claimId} - Coming soon!\n\nThis will allow you to assign claims to investigators.`);
  };

  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: () => claimsAPI.list(),
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => adminAPI.getAnalytics(),
    enabled: isAdmin || isFraudInvestigator,
  });

  if (claimsLoading) {
    return <Loading message="Loading dashboard..." />;
  }

  const pipelineClaims = claims || [];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-8 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
          <div className="relative cursor-pointer hover:bg-surface-800 p-2 rounded-full transition-colors">
            <div className="w-2 h-2 bg-red-500 rounded-full absolute top-1 right-2 border border-surface-950"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-surface-400 hover:text-white"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
          </div>
          {isPolicyholder && (
            <Link to="/claims/new" className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-xl inline-flex items-center transition-colors">
              <Plus className="w-4 h-4 mr-1" />
              New Claim
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Claims"
          value={analytics?.totals?.claims || (pipelineClaims.length ? pipelineClaims.length.toLocaleString() : "18,452")}
          subtext="+5.3%"
          subtextColor="text-cyan-400"
          glowColor="bg-cyan-400"
        />
        <StatCard
          title="Processing Speed"
          value="2.1 days"
          subtext="avg. -0.4 days"
          subtextColor="text-emerald-400"
          glowColor="bg-violet-500"
        />
        <StatCard
          title="Fraud Detection Rate"
          value="94.2%"
          subtext="+11%"
          subtextColor="text-emerald-400"
          glowColor="bg-emerald-400"
        />
        <StatCard
          title="Settlement Amount"
          value="₹38.5M"
          subtext="Total 49.7%"
          subtextColor="text-amber-400"
          glowColor="bg-orange-400"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
        <div className="lg:col-span-2 card bg-surface-900 border border-surface-700/50 p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-semibold">Claims Analytics</h3>
            <span className="text-surface-500 text-xs cursor-pointer hover:text-white">•••</span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={mockAnalyticsData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />

                <Bar dataKey="Approved" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={14} />
                <Bar dataKey="Denied" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={14} />
                <Area type="monotone" dataKey="Pending" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorPending)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span className="text-surface-400">Approved</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-surface-400">Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              <span className="text-surface-400">Denied</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {isPolicyholder ? <SpinningPieChart /> : <HeatmapMock />}
        </div>
      </div>

      {/* Claims Pipeline Table */}
      <div className="card bg-surface-900 border border-surface-700/50 p-3 sm:p-6 mt-4 sm:mt-6 overflow-hidden rounded-2xl">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-white font-semibold text-sm sm:text-base">Claims Pipeline</h3>
          <button className="text-surface-500 hover:text-white transition-colors">•••</button>
        </div>
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="w-full text-left text-sm text-surface-300">
            <thead className="text-xs text-surface-400 border-b border-surface-800">
              <tr>
                <th className="px-4 py-3 font-medium">Claim ID</th>
                <th className="px-4 py-3 font-medium">Policyholder</th>
                <th className="px-4 py-3 font-medium">Claim Type</th>
                <th className="px-4 py-3 font-medium">Date Submitted</th>
                <th className="px-4 py-3 font-medium">Current Stage</th>
                <th className="px-4 py-3 font-medium">AI Risk Score</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/50">
              {pipelineClaims.length > 0 ? (
                pipelineClaims.slice(0, 5).map((claim, idx) => (
                  <tr key={claim.id} className="hover:bg-surface-800/30 transition-colors">
                    <td className="px-4 py-4 font-medium text-blue-400">
                      <Link to={`/claims/${claim.id}`}>{claim.claim_number}</Link>
                    </td>
                    <td className="px-4 py-4 text-white">
                      {claim.policy_id ? `Pol-${String(claim.policy_id).substring(0, 4)}` : 'A. Smith'}
                    </td>
                    <td className="px-4 py-4 text-surface-300">{claim.claim_type || 'Auto Collision'}</td>
                    <td className="px-4 py-4 text-surface-300">
                      {new Date(claim.date_submitted || new Date()).toLocaleDateString('en-CA')}
                    </td>
                    <td className="px-4 py-4 text-surface-300">
                      {claim.status === 'under_review' ? 'Under Review' : claim.status.charAt(0).toUpperCase() + claim.status.slice(1).replace('_', ' ')}
                    </td>
                    <td className="px-4 py-4 text-surface-300">
                      Low (0)
                    </td>
                    <td className="px-4 py-4 text-right text-blue-500 font-medium">
                      <Link to={`/claims/${claim.id}`} className="hover:text-blue-400 transition-colors">View</Link>
                      <span className="text-surface-700 mx-2">|</span>
                      <button onClick={() => handleEdit(claim.id)} className="hover:text-blue-400 transition-colors">Edit</button>
                      <span className="text-surface-700 mx-2">|</span>
                      <button onClick={() => handleAssign(claim.id)} className="hover:text-blue-400 transition-colors">Assign</button>
                    </td>
                  </tr>
                ))
              ) : (
                // Mock entries if no claims exist
                [1, 2, 3, 4].map((item) => (
                  <tr key={item} className="hover:bg-surface-800/30 transition-colors">
                    <td className="px-4 py-4 font-medium text-blue-400">CL-4500{item}</td>
                    <td className="px-4 py-4 text-white">A. Smith</td>
                    <td className="px-4 py-4 text-surface-300">Auto Collision</td>
                    <td className="px-4 py-4 text-surface-300">2023-10-2{item}</td>
                    <td className="px-4 py-4 text-surface-300">Under Review</td>
                    <td className="px-4 py-4 text-surface-300">Low (0)</td>
                    <td className="px-4 py-4 text-right text-blue-500 font-medium whitespace-nowrap">
                      <button onClick={() => alert('This is a demo entry. Please create or view a real claim.')} className="hover:text-blue-400 transition-colors">View</button>
                      <span className="text-surface-700 mx-2">|</span>
                      <button onClick={() => alert('This is a demo entry. Please create or view a real claim.')} className="hover:text-blue-400 transition-colors">Edit</button>
                      <span className="text-surface-700 mx-2">|</span>
                      <button onClick={() => alert('This is a demo entry. Please create or view a real claim.')} className="hover:text-blue-400 transition-colors">Assign</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
