import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Clock, CheckCircle, XCircle, AlertTriangle, 
  TrendingUp, Users, DollarSign, Eye, ArrowRight 
} from 'lucide-react';
import { claimsAPI } from '../services/api';
import Loading from '../components/Loading';

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState({
    assignedToMe: 0,
    pendingReview: 0,
    reviewedToday: 0,
    avgProcessingTime: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await claimsAPI.list();
      
      // Filter claims for officer review
      const reviewClaims = data.filter(c => 
        ['submitted', 'assigned_to_officer', 'under_review', 'fraud_investigation'].includes(c.status)
      );
      
      setClaims(reviewClaims);
      
      // Calculate stats
      const today = new Date().toDateString();
      const reviewedToday = data.filter(c => 
        c.reviewed_at && new Date(c.reviewed_at).toDateString() === today
      ).length;
      
      setStats({
        assignedToMe: reviewClaims.filter(c => c.status === 'assigned_to_officer').length,
        pendingReview: reviewClaims.filter(c => c.status === 'under_review').length,
        reviewedToday,
        avgProcessingTime: calculateAvgProcessingTime(data)
      });
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAvgProcessingTime = (claims) => {
    const processed = claims.filter(c => c.submitted_at && c.reviewed_at);
    if (processed.length === 0) return 0;
    
    const totalDays = processed.reduce((sum, c) => {
      const submitted = new Date(c.submitted_at);
      const reviewed = new Date(c.reviewed_at);
      return sum + Math.ceil((reviewed - submitted) / (1000 * 60 * 60 * 24));
    }, 0);
    
    return Math.round(totalDays / processed.length);
  };

  const getFraudRiskColor = (level) => {
    const colors = {
      low: 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30',
      medium: 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30',
      high: 'text-orange-400 bg-orange-500/20 border border-orange-500/30',
      critical: 'text-rose-400 bg-rose-500/20 border border-rose-500/30'
    };
    return colors[level] || 'text-gray-400 bg-surface-700/50 border border-surface-600';
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'text-blue-400 bg-blue-500/20 border border-blue-500/30',
      assigned_to_officer: 'text-purple-400 bg-purple-500/20 border border-purple-500/30',
      under_review: 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30',
      fraud_investigation: 'text-orange-400 bg-orange-500/20 border border-orange-500/30',
      approved: 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30',
      rejected: 'text-rose-400 bg-rose-500/20 border border-rose-500/30'
    };
    return colors[status] || 'text-gray-400 bg-surface-700/50 border border-surface-600';
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Claims Officer Dashboard</h1>
        <p className="text-surface-400 mt-2 text-sm sm:text-base">
          Review and process insurance claims
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card-premium hover:shadow-premium transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Assigned to Me</p>
              <p className="text-3xl font-bold text-blue-400 mt-1">{stats.assignedToMe}</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg border border-blue-500/30">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card-premium hover:shadow-premium transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.pendingReview}</p>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-lg border border-yellow-500/30">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="card-premium hover:shadow-premium transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Reviewed Today</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{stats.reviewedToday}</p>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-lg border border-emerald-500/30">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="card-premium hover:shadow-premium transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Avg Processing Time</p>
              <p className="text-3xl font-bold text-purple-400 mt-1">{stats.avgProcessingTime}d</p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-lg border border-purple-500/30">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Priority Claims - High Risk */}
      {claims.filter(c => c.is_flagged_for_investigation || c.fraud_risk_level === 'high' || c.fraud_risk_level === 'critical').length > 0 && (
        <div className="card-premium border-2 border-rose-500/50 bg-gradient-to-br from-rose-500/10 to-orange-500/10">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <h2 className="text-xl font-semibold text-rose-100">Priority: High Risk Claims</h2>
          </div>
          
          <div className="space-y-3">
            {claims.filter(c => c.is_flagged_for_investigation || c.fraud_risk_level === 'high' || c.fraud_risk_level === 'critical').slice(0, 3).map(claim => (
              <div 
                key={claim.id} 
                className="flex items-center justify-between p-4 bg-surface-700/30 rounded-lg hover:bg-surface-700/50 cursor-pointer transition-all border border-surface-600/50 hover:border-rose-500/50"
                onClick={() => navigate(`/claims/${claim.id}`)}
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-100">{claim.claim_number}</p>
                  <p className="text-sm text-surface-300 mt-1">
                    ${claim.claimed_amount.toLocaleString()} • {claim.policy?.insurance_type}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFraudRiskColor(claim.fraud_risk_level)}`}>
                    {claim.fraud_risk_level?.toUpperCase()} RISK
                  </span>
                  <ArrowRight className="h-5 w-5 text-surface-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claims Queue */}
      <div className="card-premium">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Claims Queue</h2>
          <select 
            className="px-4 py-2 bg-surface-700/50 border border-surface-600 text-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            onChange={(e) => {
              if (e.target.value) {
                const filtered = claims.filter(c => c.status === e.target.value);
                setClaims(filtered);
              } else {
                loadDashboardData();
              }
            }}
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="assigned_to_officer">Assigned to Officer</option>
            <option value="under_review">Under Review</option>
            <option value="fraud_investigation">Fraud Investigation</option>
          </select>
        </div>

        {claims.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-surface-500 mx-auto mb-4" />
            <p className="text-surface-300">No claims pending review</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-700/50">
              <thead className="bg-surface-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-surface-300 uppercase tracking-wider">
                    Claim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-surface-300 uppercase tracking-wider">
                    Policy Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-surface-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-surface-300 uppercase tracking-wider">
                    Fraud Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-surface-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-surface-300 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-surface-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/30">
                {claims.map((claim) => (
                  <tr 
                    key={claim.id} 
                    className="hover:bg-surface-700/20 cursor-pointer transition-colors"
                    onClick={() => navigate(`/claims/${claim.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-surface-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-100">
                            {claim.claim_number}
                          </div>
                          <div className="text-sm text-surface-400">
                            {claim.user?.full_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {claim.policy?.insurance_type?.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-100">
                        ${claim.claimed_amount.toLocaleString()}
                      </div>
                      {claim.recommended_settlement && (
                        <div className="text-xs text-surface-400">
                          Rec: ${claim.recommended_settlement.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getFraudRiskColor(claim.fraud_risk_level)}`}>
                        {claim.fraud_risk_level?.toUpperCase()}
                      </span>
                      <div className="text-xs text-surface-400 mt-1">
                        Score: {claim.fraud_risk_score?.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                        {claim.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-300">
                      {claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/claims/${claim.id}`);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-violet hover:shadow-glow text-white rounded-xl transition-all"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerDashboard;