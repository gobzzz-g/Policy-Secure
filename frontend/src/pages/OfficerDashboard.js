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
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colors[level] || 'text-gray-600 bg-gray-100';
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'text-blue-600 bg-blue-100',
      assigned_to_officer: 'text-purple-600 bg-purple-100',
      under_review: 'text-yellow-600 bg-yellow-100',
      fraud_investigation: 'text-orange-600 bg-orange-100',
      approved: 'text-green-600 bg-green-100',
      rejected: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Claims Officer Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Review and process insurance claims
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned to Me</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.assignedToMe}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pendingReview}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reviewed Today</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.reviewedToday}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Processing Time</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.avgProcessingTime}d</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Priority Claims - High Risk */}
      {claims.filter(c => c.is_flagged_for_investigation || c.fraud_risk_level === 'high' || c.fraud_risk_level === 'critical').length > 0 && (
        <div className="card border-2 border-red-200">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-xl font-semibold text-red-900">Priority: High Risk Claims</h2>
          </div>
          
          <div className="space-y-3">
            {claims.filter(c => c.is_flagged_for_investigation || c.fraud_risk_level === 'high' || c.fraud_risk_level === 'critical').slice(0, 3).map(claim => (
              <div 
                key={claim.id} 
                className="flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                onClick={() => navigate(`/claims/${claim.id}`)}
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{claim.claim_number}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    ${claim.claimed_amount.toLocaleString()} • {claim.policy?.insurance_type}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFraudRiskColor(claim.fraud_risk_level)}`}>
                    {claim.fraud_risk_level?.toUpperCase()} RISK
                  </span>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claims Queue */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Claims Queue</h2>
          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No claims pending review</p>
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
                    Policy Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fraud Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {claims.map((claim) => (
                  <tr 
                    key={claim.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/claims/${claim.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {claim.policy?.insurance_type?.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${claim.claimed_amount.toLocaleString()}
                      </div>
                      {claim.recommended_settlement && (
                        <div className="text-xs text-gray-500">
                          Rec: ${claim.recommended_settlement.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getFraudRiskColor(claim.fraud_risk_level)}`}>
                        {claim.fraud_risk_level?.toUpperCase()}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        Score: {claim.fraud_risk_score?.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                        {claim.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/claims/${claim.id}`);
                        }}
                        className="text-blue-600 hover:text-blue-900"
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