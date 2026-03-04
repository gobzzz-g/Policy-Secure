import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { policiesAPI } from '../services/api';
import Loading from '../components/Loading';

const PoliciesList = () => {
  const { data: policies, isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: () => policiesAPI.list(),
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Policies</h1>
      <div className="grid gap-6">
        {policies?.map((policy) => (
          <div key={policy.id} className="card">
            <h3 className="text-lg font-semibold mb-2">{policy.policy_number}</h3>
            <p className="text-gray-600">Type: {policy.insurance_type}</p>
            <p className="text-gray-600">Sum Insured: ${policy.sum_insured?.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PoliciesList;
