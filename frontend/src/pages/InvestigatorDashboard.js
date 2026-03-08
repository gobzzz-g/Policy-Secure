import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, AlertTriangle, Search, FileWarning, CheckCircle, 
  XCircle, TrendingUp, Activity, Eye, ArrowRight, Filter, Download,
  Clock, AlertOctagon, Target, BarChart3
} from 'lucide-react';
import { claimsAPI } from '../services/api';
import Loading from '../components/Loading';

const InvestigatorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [stats, setStats] = useState({
    openInvestigations: 0,
    highRisk: 0,
    criticalRisk: 0,
    fraudConfirmed: 0,
    averageFraudScore: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await claimsAPI.list();
      
      const investigationClaims = data.filter(c => 
        c.is_flagged_for_investigation || 
        c.fraud_risk_level === 'high' || 
        c.fraud_risk_level === 'critical' ||
        c.status === 'fraud_investigation'
      );
      
      setClaims(investigationClaims);
      
      const openCases = investigationClaims.filter(c => 
        c.status === 'fraud_investigation'
      ).length;
      
      const highRisk = investigationClaims.filter(c => 
        c.fraud_risk_level === 'high'
      ).length;
      
      const criticalRisk = investigationClaims.filter(c => 
        c.fraud_risk_level === 'critical'
      ).length;
      
      const fraudConfirmed = data.filter(c => 
        c.status === 'rejected' && c.investigator_remarks
      ).length;
      
      const avgScore = investigationClaims.length > 0 
        ? investigationClaims.reduce((sum, c) => sum + (c.fraud_risk_score || 0), 0) / investigationClaims.length
        : 0;
      
      setStats({
        openInvestigations: openCases,
        highRisk,
        criticalRisk,
        fraudConfirmed,
        averageFraudScore: avgScore
      });
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFraudRiskColor = (level) => {
    const colors = {
      low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      critical: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    };
    return colors[level] || 'bg-surface-700/50 text-gray-400 border-surface-600';
  };

  const getRiskScoreColor = (score) => {
    if (score >= 75) return 'text-rose-400';
    if (score >= 50) return 'text-orange-400';
    if (score >= 25) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.claim_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'all' || claim.fraud_risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gradient-text-warm">
            <Shield className="h-8 w-8 mr-3 text-rose-500" />
            Fraud Investigation Center
          </h1>
          <p className="text-surface-400 mt-1">Monitor and investigate high-risk claims with AI-powered insights</p>
        </div>
        <button className="px-4 py-2 bg-surface-700/50 hover:bg-surface-600/50 border border-surface-600 rounded-xl flex items-center gap-2 text-gray-300 transition-colors">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all">
          <Activity className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{stats.openInvestigations}</p>
          <p className="text-sm opacity-90 mt-1">Active Cases</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all">
          <AlertTriangle className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{stats.highRisk}</p>
          <p className="text-sm opacity-90 mt-1">High Risk</p>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-pink-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all animate-pulse">
          <FileWarning className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{stats.criticalRisk}</p>
          <p className="text-sm opacity-90 mt-1">Critical</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all">
          <CheckCircle className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{stats.fraudConfirmed}</p>
          <p className="text-sm opacity-90 mt-1">Confirmed</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all">
          <Target className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{stats.averageFraudScore.toFixed(0)}</p>
          <p className="text-sm opacity-90 mt-1">Avg Risk Score</p>
        </div>
      </div>

      {/* Critical Alerts */}
      {claims.filter(c => c.fraud_risk_level === 'critical').length > 0 && (
        <div className="card-premium border-2 border-rose-500/50 bg-gradient-to-r from-rose-500/10 to-orange-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-500/20 rounded-lg border border-rose-500/30">
              <AlertOctagon className="h-6 w-6 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-rose-100">Critical Priority: Immediate Action Required</h2>
              <p className="text-sm text-rose-300">{claims.filter(c => c.fraud_risk_level === 'critical').length} claims need urgent investigation</p>
            </div>
          </div>
          
          <div className="grid gap-3 md:grid-cols-2">
            {claims.filter(c => c.fraud_risk_level === 'critical').slice(0, 4).map(claim => (
              <div 
                key={claim.id} 
                className="bg-surface-700/30 rounded-lg p-4 hover:bg-surface-700/50 cursor-pointer transition-all border-2 border-rose-500/30 hover:border-rose-500/60"
                onClick={() => navigate(`/claims/${claim.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-100">{claim.claim_number}</p>
                    <p className="text-xs text-surface-400 capitalize">{claim.policy?.insurance_type}</p>
                  </div>
                  <span className="px-2 py-1 bg-rose-500/30 text-rose-300 text-xs font-bold rounded-full border border-rose-500/50">
                    {claim.fraud_risk_score?.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-surface-600">
                  <p className="text-sm font-semibold text-gray-100">₹{claim.claimed_amount?.toLocaleString()}</p>
                  <ArrowRight className="h-4 w-4 text-rose-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="card-premium space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by claim number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Filter className="w-4 h-4 text-surface-400 mt-2" />
          {['all', 'critical', 'high', 'medium', 'low'].map(risk => (
            <button
              key={risk}
              onClick={() => setRiskFilter(risk)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                riskFilter === risk
                  ? 'bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-glow'
                  : 'bg-surface-700/50 text-gray-300 hover:bg-surface-600/50 border border-surface-600'
              }`}
            >
              {risk.charAt(0).toUpperCase() + risk.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Investigation Queue */}
      <div className="card-premium overflow-hidden">
        <div className="p-6 border-b border-surface-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-100">
              <BarChart3 className="w-5 h-5 text-surface-400" />
              Investigation Queue
            </h2>
            <span className="text-sm text-surface-400">{filteredClaims.length} claims</span>
          </div>
        </div>

        {filteredClaims.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-200 mb-2">All Clear!</p>
            <p className="text-surface-400">No claims requiring investigation match your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-700/30">
            {filteredClaims.map(claim => (
              <div
                key={claim.id}
                className="p-6 hover:bg-surface-700/20 cursor-pointer transition-colors"
                onClick={() => navigate(`/claims/${claim.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-bold text-gray-100">{claim.claim_number}</p>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getFraudRiskColor(claim.fraud_risk_level)}`}>
                        {claim.fraud_risk_level?.toUpperCase()}
                      </span>
                      {claim.is_flagged_for_investigation && (
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-surface-400">Amount</p>
                        <p className="text-sm font-semibold text-gray-100">₹{claim.claimed_amount?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-400">Type</p>
                        <p className="text-sm font-semibold text-gray-100 capitalize">{claim.policy?.insurance_type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-400">Risk Score</p>
                        <p className={`text-sm font-bold ${getRiskScoreColor(claim.fraud_risk_score || 0)}`}>
                          {claim.fraud_risk_score?.toFixed(1) || 0}/100
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-400">Submitted</p>
                        <p className="text-sm text-gray-200">
                          {claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6">
                    <button className="px-4 py-2 bg-gradient-to-r from-rose-600 to-orange-600 hover:shadow-glow text-white rounded-xl flex items-center gap-2 transition-all">
                      <Eye className="w-4 h-4" />
                      Investigate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestigatorDashboard;
