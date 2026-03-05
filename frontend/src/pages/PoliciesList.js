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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold">My Policies</h1>
      <div className="grid gap-3 sm:gap-4 md:gap-6">
        {policies?.map((policy) => (
          <div key={policy.id} className="card p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-2">{policy.policy_number}</h3>
            <p className="text-gray-600 text-sm sm:text-base">Type: {policy.insurance_type}</p>
            <p className="text-gray-600 text-sm sm:text-base">Sum Insured: ${policy.sum_insured?.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PoliciesList;
