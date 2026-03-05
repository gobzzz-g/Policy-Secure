import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { claimsAPI } from '../services/api';
import Loading from '../components/Loading';

const ClaimDetail = () => {
  const { id } = useParams();
  const { data: claim, isLoading } = useQuery({
    queryKey: ['claim', id],
    queryFn: () => claimsAPI.get(id),
  });

  if (isLoading) return <Loading />;
  if (!claim) return <div>Claim not found</div>;

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold">{claim.claim_number}</h1>
      <div className="card p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Claim Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <dt className="text-xs sm:text-sm font-medium text-gray-500">Claimed Amount</dt>
            <dd className="mt-1 text-base sm:text-lg font-semibold text-gray-900">₹{claim.claimed_amount?.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs sm:text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1"><span className="badge badge-info text-xs sm:text-sm">{claim.status}</span></dd>
          </div>
          <div>
            <dt className="text-xs sm:text-sm font-medium text-gray-500">Fraud Risk</dt>
            <dd className="mt-1 text-base sm:text-lg font-semibold">{claim.fraud_risk_score?.toFixed(1)}/100</dd>
          </div>
          <div>
            <dt className="text-xs sm:text-sm font-medium text-gray-500">Recommended Settlement</dt>
            <dd className="mt-1 text-base sm:text-lg font-semibold text-success-600">₹{claim.recommended_settlement?.toLocaleString()}</dd>
          </div>
        </dl>
        {claim.fraud_explanation && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Fraud Analysis</h3>
            <p className="text-sm text-gray-700">{claim.fraud_explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimDetail;
