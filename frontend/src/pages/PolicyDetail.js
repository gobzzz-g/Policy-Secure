import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, CreditCard, DollarSign, FileText, Shield, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { policiesAPI } from '../services/api';
import Loading from '../components/Loading';

const PolicyDetail = () => {
  const { id } = useParams();

  const { data: policy, isLoading } = useQuery({
    queryKey: ['policy', id],
    queryFn: () => policiesAPI.get(id),
    enabled: Boolean(id),
  });

  if (isLoading) return <Loading />;
  if (!policy) return <div className="card">Policy not found</div>;

  const isActive = policy.is_active === true || policy.is_active === 'true' || policy.is_active === 'True' || policy.is_active === 1;
  const startDate = policy.start_date ? format(new Date(policy.start_date), 'MMM dd, yyyy') : '-';
  const endDate = policy.end_date ? format(new Date(policy.end_date), 'MMM dd, yyyy') : '-';

  const formatTypeSpecificValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const typeSpecificEntries = Object.entries(policy.type_specific_data || {});

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/policies"
              className="inline-flex items-center gap-2 text-sm text-surface-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Policies
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">
            {policy.policy_number}
          </h1>
          <p className="text-surface-400 mt-1 capitalize flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {policy.insurance_type} policy
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
          <div className="px-4 py-3 bg-gradient-to-br from-primary-600/20 to-primary-500/10 rounded-xl border border-primary-500/30">
            <p className="text-xs text-surface-400">Sum Insured</p>
            <p className="text-xl font-bold text-primary-400">₹{policy.sum_insured?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-400" />
              Coverage & Limits
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-surface-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Sum Insured
                </dt>
                <dd className="mt-1 text-base font-semibold">₹{policy.sum_insured?.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-surface-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Per Claim Limit
                </dt>
                <dd className="mt-1 text-base font-semibold">₹{policy.per_claim_limit?.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-surface-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Deductible
                </dt>
                <dd className="mt-1 text-base font-semibold">₹{policy.deductible?.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-surface-400 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Premium Amount
                </dt>
                <dd className="mt-1 text-base font-semibold">₹{policy.premium_amount?.toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-400" />
              Policy Period
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-surface-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Start Date
                </dt>
                <dd className="mt-1 text-base font-semibold">{startDate}</dd>
              </div>
              <div>
                <dt className="text-xs text-surface-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  End Date
                </dt>
                <dd className="mt-1 text-base font-semibold">{endDate}</dd>
              </div>
              <div>
                <dt className="text-xs text-surface-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Premium Frequency
                </dt>
                <dd className="mt-1 text-base font-semibold capitalize">{policy.premium_frequency?.replace('_', ' ')}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-400" />
              Policy Snapshot
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-surface-400">Policy Number</dt>
                <dd className="mt-1 font-mono font-semibold text-gray-100 break-all">{policy.policy_number}</dd>
              </div>
              <div>
                <dt className="text-xs text-surface-400">Insurance Type</dt>
                <dd className="mt-1 font-semibold capitalize text-gray-100">{policy.insurance_type}</dd>
              </div>
              <div>
                <dt className="text-xs text-surface-400">Status</dt>
                <dd className="mt-1">
                  <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-400" />
              Type-Specific Coverage
            </h2>
            {typeSpecificEntries.length === 0 ? (
              <p className="text-sm text-surface-400">No additional coverage details provided.</p>
            ) : (
              <dl className="space-y-3">
                {typeSpecificEntries.map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between gap-4">
                    <dt className="text-xs text-surface-400 capitalize">{key.replace(/_/g, ' ')}</dt>
                    <dd className="text-sm font-semibold text-gray-100 text-right">
                      {formatTypeSpecificValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyDetail;
