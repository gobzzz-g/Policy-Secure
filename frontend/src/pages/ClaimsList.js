/**
 * Claims List Page - Enhanced Version
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { claimsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileText, AlertCircle, Plus, Eye, Filter, Search, Download, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import Loading from '../components/Loading';
import { format } from 'date-fns';

const ClaimsList = () => {
  const { isPolicyholder } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  
  const { data: claims, isLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: () => claimsAPI.list(),
  });

  if (isLoading) {
    return <Loading message="Loading claims..." />;
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700 border-gray-300',
      submitted: 'bg-blue-100 text-blue-700 border-blue-300',
      under_review: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      approved: 'bg-green-100 text-green-700 border-green-300',
      rejected: 'bg-red-100 text-red-700 border-red-300',
      fraud_check: 'bg-orange-100 text-orange-700 border-orange-300',
    };
    return colors[status] || colors.draft;
  };

  const getRiskColor = (level) => {
    const colors = {
      low: 'text-green-600 bg-green-50',
      medium: 'text-yellow-600 bg-yellow-50',
      high: 'text-orange-600 bg-orange-50',
      critical: 'text-red-600 bg-red-50',
    };
    return colors[level] || colors.low;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'under_review':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const filteredClaims = claims?.filter(claim => {
    const matchesSearch = claim.claim_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || claim.fraud_risk_level === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const stats = {
    total: claims?.length || 0,
    submitted: claims?.filter(c => c.status === 'submitted').length || 0,
    approved: claims?.filter(c => c.status === 'approved').length || 0,
    pending: claims?.filter(c => c.status === 'under_review').length || 0,
    totalAmount: claims?.reduce((sum, c) => sum + (c.claimed_amount || 0), 0) || 0
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            Claims Management
          </h1>
          <p className="text-gray-600 mt-1">Track and manage your insurance claims</p>
        </div>
        {isPolicyholder && (
          <Link to="/claims/new" className="btn btn-primary inline-flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
            <Plus className="w-5 h-5" />
            New Claim
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <FileText className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm opacity-90">Total Claims</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-4 text-white shadow-lg">
          <Clock className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{stats.pending}</p>
          <p className="text-sm opacity-90">Under Review</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-4 text-white shadow-lg">
          <CheckCircle className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{stats.approved}</p>
          <p className="text-sm opacity-90">Approved</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 text-white shadow-lg">
          <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{stats.submitted}</p>
          <p className="text-sm opacity-90">Submitted</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl p-4 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-1">Total Amount</div>
          <p className="text-2xl font-bold">₹{(stats.totalAmount / 1000).toFixed(0)}K</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by claim number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2 items-center">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Status:</span>
          </div>
          {['all', 'submitted', 'under_review', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                statusFilter === status
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2 items-center">
            <AlertCircle className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Risk:</span>
          </div>
          {['all', 'low', 'medium', 'high', 'critical'].map(risk => (
            <button
              key={risk}
              onClick={() => setRiskFilter(risk)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                riskFilter === risk
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {risk.charAt(0).toUpperCase() + risk.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Claims List */}
      {filteredClaims && filteredClaims.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Claim #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Fraud Risk
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getStatusColor(claim.status).split(' ')[0]}`}>
                          {getStatusIcon(claim.status)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{claim.claim_number}</p>
                          <p className="text-xs text-gray-500">{claim.insurance_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-gray-900">₹{claim.claimed_amount?.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(claim.status)}`}>
                        {claim.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getRiskColor(claim.fraud_risk_level)}`}>
                          {claim.fraud_risk_level?.toUpperCase()}
                        </span>
                        {claim.is_flagged_for_investigation && (
                          <AlertCircle className="w-4 h-4 text-red-600 animate-pulse" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {claim.submitted_at ? format(new Date(claim.submitted_at), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        to={`/claims/${claim.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden grid gap-4 md:grid-cols-2">
            {filteredClaims.map((claim) => (
              <Link
                key={claim.id}
                to={`/claims/${claim.id}`}
                className="block bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-primary-400 hover:shadow-lg transition-all p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(claim.status).split(' ')[0]}`}>
                      {getStatusIcon(claim.status)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{claim.claim_number}</p>
                      <p className="text-xs text-gray-500 capitalize">{claim.insurance_type}</p>
                    </div>
                  </div>
                  {claim.is_flagged_for_investigation && (
                    <AlertCircle className="w-5 h-5 text-red-600 animate-pulse" />
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Amount</span>
                    <span className="text-lg font-bold text-gray-900">₹{claim.claimed_amount?.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(claim.status)}`}>
                      {claim.status?.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Risk Level</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${getRiskColor(claim.fraud_risk_level)}`}>
                      {claim.fraud_risk_level?.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Submitted</span>
                    <span className="text-sm text-gray-700">
                      {claim.submitted_at ? format(new Date(claim.submitted_at), 'MMM dd, yyyy') : '-'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end text-primary-600 text-sm font-medium">
                  View Details
                  <Eye className="w-4 h-4 ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16">
          <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No claims found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all' || riskFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by submitting your first claim'}
          </p>
          {isPolicyholder && !searchTerm && statusFilter === 'all' && riskFilter === 'all' && (
            <Link to="/claims/new" className="btn btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Submit New Claim
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ClaimsList;
