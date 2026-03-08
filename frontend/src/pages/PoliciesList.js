import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { policiesAPI } from '../services/api';
import { Shield, Calendar, DollarSign, FileText, ChevronRight, Filter, Search, CheckCircle, Clock } from 'lucide-react';
import Loading from '../components/Loading';

const PoliciesList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  const { data: policies, isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: () => policiesAPI.list(),
  });

  if (isLoading) return <Loading />;

  const getInsuranceTypeIcon = (type) => {
    const icons = {
      health: '🏥',
      motor: '🚗',
      home: '🏠',
      life: '❤️',
      travel: '✈️'
    };
    return icons[type] || '📋';
  };

  const getInsuranceTypeColor = (type) => {
    const colors = {
      health: 'from-blue-500 to-cyan-500',
      motor: 'from-orange-500 to-red-500',
      home: 'from-green-500 to-emerald-500',
      life: 'from-purple-500 to-pink-500',
      travel: 'from-yellow-500 to-amber-500'
    };
    return colors[type] || 'from-gray-500 to-slate-500';
  };

  const filteredPolicies = policies?.filter(p => {
    const matchesSearch = p.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.insurance_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || p.insurance_type === filterType;
    return matchesSearch && matchesType;
  });

  const insuranceTypes = [...new Set(policies?.map(p => p.insurance_type) || [])];
  const totalCoverage = policies?.reduce((sum, p) => sum + (p.sum_insured || 0), 0) || 0;

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            My Policies
          </h1>
          <p className="text-surface-400 mt-1">Manage and view your insurance policies</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="px-4 py-3 bg-gradient-to-br from-primary-600/20 to-primary-500/10 rounded-xl border border-primary-500/30 backdrop-blur-sm">
            <p className="text-xs text-surface-400">Total Policies</p>
            <p className="text-2xl font-bold text-primary-400">{policies?.length || 0}</p>
          </div>
          <div className="px-4 py-3 bg-gradient-to-br from-emerald-600/20 to-emerald-500/10 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
            <p className="text-xs text-surface-400">Total Coverage</p>
            <p className="text-2xl font-bold text-emerald-400">${(totalCoverage / 1000).toFixed(0)}K</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search policies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-3 rounded-xl font-medium transition-all ${
              filterType === 'all'
                ? 'bg-gradient-to-r from-primary-600 to-accent-violet text-white shadow-glow'
                : 'bg-surface-800/50 border border-surface-700 text-gray-300 hover:border-primary-500/50'
            }`}
          >
            All
          </button>
          {insuranceTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-3 rounded-xl font-medium transition-all capitalize ${
                filterType === type
                  ? 'bg-gradient-to-r from-primary-600 to-accent-violet text-white shadow-glow'
                  : 'bg-surface-800/50 border border-surface-700 text-gray-300 hover:border-primary-500/50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Policies Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredPolicies?.map((policy) => (
          <div
            key={policy.id}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-800/80 to-surface-900/80 backdrop-blur-xl border border-surface-700/50 hover:border-primary-500/50 hover:shadow-premium transition-all duration-300 cursor-pointer"
          >
            {/* Gradient Header */}
            <div className={`h-32 bg-gradient-to-br ${getInsuranceTypeColor(policy.insurance_type)} p-6 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-8 -mt-8"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-6 -mb-6"></div>
              <div className="relative flex justify-between items-start">
                <div className="text-5xl">{getInsuranceTypeIcon(policy.insurance_type)}</div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-white font-bold text-lg mt-2 capitalize">{policy.insurance_type}</h3>
            </div>

            {/* Policy Details */}
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center text-sm text-surface-400 mb-1">
                  <FileText className="w-4 h-4 mr-2" />
                  Policy Number
                </div>
                <p className="font-mono font-bold text-gray-100">{policy.policy_number}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center text-sm text-surface-400 mb-1">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Sum Insured
                  </div>
                  <p className="font-bold text-primary-400">${policy.sum_insured?.toLocaleString()}</p>
                </div>
                <div>
                  <div className="flex items-center text-sm text-surface-400 mb-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    Status
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                    <p className="font-semibold text-emerald-400">Active</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-700/50">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-primary-600 to-accent-violet text-white rounded-xl font-medium hover:shadow-glow transition-all group-hover:scale-105">
                  View Details
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Hover Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/0 to-purple-600/0 group-hover:from-primary-600/5 group-hover:to-purple-600/5 transition-all pointer-events-none"></div>
          </div>
        ))}
      </div>

      {filteredPolicies?.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Policies Found</h3>
          <p className="text-surface-400">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default PoliciesList;
