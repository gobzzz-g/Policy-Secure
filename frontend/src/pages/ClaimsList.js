/**
 * Claims List Page
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { claimsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileText, AlertCircle, Plus, Eye } from 'lucide-react';
import Loading from '../components/Loading';
import { format } from 'date-fns';

const ClaimsList = () => {
  const { isPolicyholder } = useAuth();
  
  const { data: claims, isLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: () => claimsAPI.list(),
  });

  if (isLoading) {
    return <Loading message="Loading claims..." />;
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      submitted: 'bg-blue-100 text-blue-700',
      under_review: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      fraud_check: 'bg-red-100 text-red-700',
    };
    return colors[status] || colors.draft;
  };

  const getRiskColor = (level) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600',
    };
    return colors[level] || colors.low;
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Claims</h1>
        {isPolicyholder && (
          <Link to="/claims/new" className="btn btn-primary inline-flex items-center w-full sm:w-auto justify-center">
            <Plus className="w-5 h-5 mr-2" />
            New Claim
          </Link>
        )}
      </div>

      {claims && claims.length > 0 ? (
        <>
          {/* Desktop Table View - Hidden on mobile */}
          <div className="hidden md:block card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Claim #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fraud Risk
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
                    <tr key={claim.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {claim.claim_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          ₹{claim.claimed_amount?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                          {claim.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${getRiskColor(claim.fraud_risk_level)}`}>
                            {claim.fraud_risk_level?.toUpperCase()}
                          </span>
                          {claim.is_flagged_for_investigation && (
                            <AlertCircle className="w-4 h-4 text-red-600 ml-2" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {claim.submitted_at ? format(new Date(claim.submitted_at), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/claims/${claim.id}`}
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View - Visible only on mobile */}
          <div className="md:hidden space-y-3">
            {claims.map((claim) => (
              <Link
                key={claim.id}
                to={`/claims/${claim.id}`}
                className="card block hover:shadow-lg transition-shadow p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm font-bold text-gray-900">
                      {claim.claim_number}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                    {claim.status?.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-semibold text-gray-900">₹{claim.claimed_amount?.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Risk Level:</span>
                    <div className="flex items-center">
                      <span className={`font-medium ${getRiskColor(claim.fraud_risk_level)}`}>
                        {claim.fraud_risk_level?.toUpperCase()}
                      </span>
                      {claim.is_flagged_for_investigation && (
                        <AlertCircle className="w-4 h-4 text-red-600 ml-2" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Submitted:</span>
                    <span className="text-gray-700">
                      {claim.submitted_at ? format(new Date(claim.submitted_at), 'MMM dd, yyyy') : '-'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-end text-primary-600 text-sm font-medium">
                  View Details
                  <Eye className="w-4 h-4 ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No claims found</h3>
          <p className="text-gray-500 mb-4">Get started by submitting your first claim</p>
          {isPolicyholder && (
            <Link to="/claims/new" className="btn btn-primary inline-flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Submit New Claim
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ClaimsList;
