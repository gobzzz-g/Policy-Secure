import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, AlertTriangle, Search, FileWarning, CheckCircle, 
  XCircle, TrendingUp, Activity, Eye, ArrowRight 
} from 'lucide-react';
import { claimsAPI } from '../services/api';
import Loading from '../components/Loading';

const InvestigatorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState([]);
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
      
      // Filter claims flagged for investigation or high/critical risk
      const investigationClaims = data.filter(c => 
        c.is_flagged_for_investigation || 
        c.fraud_risk_level === 'high' || 
        c.fraud_risk_level === 'critical' ||
        c.status === 'fraud_investigation'
      );
      
      setClaims(investigationClaims);
      
      // Calculate stats
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
      low: 'text-green-600 bg-green-100 border-green-300',
      medium: 'text-yellow-600 bg-yellow-100 border-yellow-300',
      high: 'text-orange-600 bg-orange-100 border-orange-300',
      critical: 'text-red-600 bg-red-100 border-red-300'
    };
    return colors[level] || 'text-gray-600 bg-gray-100 border-gray-300';
  };

  const getRiskScoreColor = (score) => {
    if (score >= 75) return 'text-red-600';
    if (score >= 50) return 'text-orange-600';
    if (score >= 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          <Shield className="h-8 w-8 mr-3 text-red-600" />
          Fraud Investigation Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Monitor and investigate high-risk claims
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-5 gap-4">
        <div className="card hover:shadow-lg transition-shadow border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Cases</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.openInvestigations}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Risk</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.highRisk}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Risk</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.criticalRisk}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <FileWarning className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fraud Confirmed</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.fraudConfirmed}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Fraud Score</p>
              <p className={`text-3xl font-bold mt-1 ${getRiskScoreColor(stats.averageFraudScore)}`}>
                {stats.averageFraudScore.toFixed(1)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Critical Cases - Immediate Action Required */}
      {claims.filter(c => c.fraud_risk_level === 'critical').length > 0 && (
        <div className="card border-2 border-red-500 bg-red-50">
          <div className="flex items-center space-x-2 mb-4">
            <FileWarning className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-semibold text-red-900">Critical: Immediate Investigation Required</h2>
          </div>
          
          <div className="space-y-3">
            {claims.filter(c => c.fraud_risk_level === 'critical').map(claim => (
              <div 
                key={claim.id} 
                className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md cursor-pointer transition-all border-2 border-red-200"
                onClick={() => navigate(`/claims/${claim.id}`)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <p className="font-bold text-gray-900">{claim.claim_number}</p>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                      CRITICAL
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    ${claim.claimed_amount.toLocaleString()} • {claim.policy?.insurance_type}
                  </p>
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    Fraud Score: {claim.fraud_risk_score?.toFixed(1)}/100
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right text-sm">
                    <p className="text-gray-500">Submitted</p>
                    <p className="text-gray-900">{new Date(claim.submitted_at).toLocaleDateString()}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-red-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investigation Queue */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Investigation Queue</h2>
          <div className="flex items-center space-x-3">
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => {
                if (e.target.value) {
                  const filtered = claims.filter(c => c.fraud_risk_level === e.target.value);
                  setClaims(filtered);
                } else {
                  loadDashboardData();
                }
              }}
            >
              <option value="">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </select>
          </div>
        </div>

        {claims.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No claims requiring investigation</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fraud Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Signals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {claims
                  .sort((a, b) => (b.fraud_risk_score || 0) - (a.fraud_risk_score || 0))
                  .map((claim) => (
                  <tr 
                    key={claim.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/claims/${claim.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 text-red-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {claim.claim_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {claim.user?.full_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border-2 ${getFraudRiskColor(claim.fraud_risk_level)}`}>
                        {claim.fraud_risk_level?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              claim.fraud_risk_score >= 75 ? 'bg-red-600' :
                              claim.fraud_risk_score >= 50 ? 'bg-orange-600' :
                              claim.fraud_risk_score >= 25 ? 'bg-yellow-600' :
                              'bg-green-600'
                            }`}
                            style={{ width: `${claim.fraud_risk_score}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-bold ${getRiskScoreColor(claim.fraud_risk_score)}`}>
                          {claim.fraud_risk_score?.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${claim.claimed_amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {claim.policy?.insurance_type?.replace('_', ' ').toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {claim.fraud_signals?.slice(0, 2).map((signal, idx) => (
                          <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                            {signal.type}
                          </span>
                        ))}
                        {claim.fraud_signals?.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{claim.fraud_signals.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        claim.status === 'fraud_investigation' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {claim.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/claims/${claim.id}`);
                        }}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fraud Trends (Placeholder for future chart) */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Fraud Detection Insights</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Most Common Signal</p>
            <p className="text-lg font-bold text-red-900 mt-2">Early Claims</p>
            <p className="text-xs text-gray-500 mt-1">Claims filed soon after policy start</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600">High-Risk Insurance Type</p>
            <p className="text-lg font-bold text-orange-900 mt-2">Motor</p>
            <p className="text-xs text-gray-500 mt-1">Highest average fraud score</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Detection Accuracy</p>
            <p className="text-lg font-bold text-green-900 mt-2">87.5%</p>
            <p className="text-xs text-gray-500 mt-1">AI prediction vs confirmed fraud</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestigatorDashboard;