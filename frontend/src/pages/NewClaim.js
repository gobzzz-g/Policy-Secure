import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, DollarSign, MapPin, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { claimsAPI, policiesAPI } from '../services/api';
import Loading from '../components/Loading';

const NewClaim = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [policies, setPolicies] = useState([]);
  const [selectedPolicyDetails, setSelectedPolicyDetails] = useState(null);
  const [loadingPolicyDetails, setLoadingPolicyDetails] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    policy_id: '',
    incident_date: '',
    incident_description: '',
    claimed_amount: '',
    estimated_loss: '',
    incident_location: '',
    witnesses: [],
    claim_specific_data: {}
  });
  
  const [witness, setWitness] = useState({ name: '', contact: '', statement: '' });

  useEffect(() => {
    loadPolicies();
  }, []);

  useEffect(() => {
    const loadPolicyDetails = async () => {
      if (!formData.policy_id) {
        setSelectedPolicyDetails(null);
        return;
      }

      try {
        setLoadingPolicyDetails(true);
        const policy = await policiesAPI.get(formData.policy_id);
        setSelectedPolicyDetails(policy);
      } catch (err) {
        console.error('Error loading policy details:', err);
        setSelectedPolicyDetails(null);
      } finally {
        setLoadingPolicyDetails(false);
      }
    };

    loadPolicyDetails();
  }, [formData.policy_id]);

  const loadPolicies = async () => {
    try {
      setLoadingPolicies(true);
      const data = await policiesAPI.list();
      const activePolicies = data.filter(p => p.is_active === true || p.is_active === 'true' || p.is_active === 1 || p.is_active === '1');
      setPolicies(activePolicies);
      
      if (activePolicies.length === 0) {
        setError('You do not have any active policies. Please purchase a policy before submitting a claim.');
      }
    } catch (err) {
      console.error('Error loading policies:', err);
      setError('Failed to load policies. Please try again.');
    } finally {
      setLoadingPolicies(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleWitnessChange = (e) => {
    const { name, value } = e.target;
    setWitness(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addWitness = () => {
    if (witness.name && witness.contact) {
      setFormData(prev => ({
        ...prev,
        witnesses: [...prev.witnesses, { ...witness }]
      }));
      setWitness({ name: '', contact: '', statement: '' });
    }
  };

  const removeWitness = (index) => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.policy_id) {
      setError('Please select a policy');
      return false;
    }
    if (!formData.incident_date) {
      setError('Please provide the incident date');
      return false;
    }
    if (!formData.incident_description || formData.incident_description.length < 10) {
      setError('Please provide a detailed incident description (at least 10 characters)');
      return false;
    }
    if (!formData.claimed_amount || parseFloat(formData.claimed_amount) <= 0) {
      setError('Please provide a valid claimed amount');
      return false;
    }
    if (!formData.estimated_loss || parseFloat(formData.estimated_loss) <= 0) {
      setError('Please provide a valid estimated loss amount');
      return false;
    }
    
    const incidentDate = new Date(formData.incident_date);
    const today = new Date();
    if (incidentDate > today) {
      setError('Incident date cannot be in the future');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Convert string amounts to numbers and format data
      const claimData = {
        ...formData,
        policy_id: parseInt(formData.policy_id),
        claimed_amount: parseFloat(formData.claimed_amount),
        estimated_loss: parseFloat(formData.estimated_loss),
        incident_date: new Date(formData.incident_date).toISOString(),
      };
      
      const response = await claimsAPI.create(claimData);
      
      setSuccess('Claim created successfully! Redirecting to document upload...');
      
      // Redirect to claim detail page after 2 seconds
      setTimeout(() => {
        navigate(`/claims/${response.id}/documents`);
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting claim:', err);
      setError(err.response?.data?.detail || 'Failed to submit claim. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPolicy = () => {
    return policies.find(p => p.id === parseInt(formData.policy_id));
  };

  const selectedPolicy = selectedPolicyDetails || getSelectedPolicy();

  if (loadingPolicies) {
    return <Loading />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Submit New Claim</h1>
        <p className="text-surface-400 mt-2 text-sm sm:text-base">
          Fill out the form below to submit your insurance claim
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-rose-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-rose-300">Error</h3>
            <p className="text-sm text-rose-400/90 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-emerald-300">Success</h3>
            <p className="text-sm text-emerald-400/90 mt-1">{success}</p>
          </div>
        </div>
      )}

      {policies.length === 0 ? (
        <div className="card-premium text-center py-12">
          <AlertCircle className="h-12 w-12 text-surface-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-100 mb-2">No Active Policies</h3>
          <p className="text-surface-400 mb-6">
            You need to have an active policy to submit a claim.
          </p>
          <button
            onClick={() => navigate('/policies')}
            className="btn btn-primary"
          >
            View Policies
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Policy Selection */}
          <div className="card-premium p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center text-gray-100">
              <FileText className="h-5 w-5 mr-2 text-primary-400" />
              Policy Information
            </h2>
            
            <div>
              <label className="label">
                Select Policy <span className="text-rose-500">*</span>
              </label>
              <select
                name="policy_id"
                value={formData.policy_id}
                onChange={handleChange}
                className="input pr-8"
                required
              >
                <option value="">-- Select a Policy --</option>
                {policies.map(policy => (
                  <option key={policy.id} value={policy.id}>
                    {policy.policy_number} - {policy.insurance_type.toUpperCase()} 
                    (Coverage: ${policy.sum_insured ? policy.sum_insured.toLocaleString() : 'N/A'})
                  </option>
                ))}
              </select>
              
              {formData.policy_id && selectedPolicy && (
                <div className="mt-3 p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl text-sm">
                  <p className="text-gray-300">
                    <span className="font-medium text-white">Policy Type:</span>{' '}
                    {selectedPolicy.insurance_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium text-white">Per Claim Limit:</span>{' '}
                    ${selectedPolicy.per_claim_limit ? selectedPolicy.per_claim_limit.toLocaleString() : 'N/A'}
                  </p>
                  {(selectedPolicy.deductible || 0) > 0 && (
                    <p className="text-gray-300">
                      <span className="font-medium text-white">Deductible:</span>{' '}
                      ${selectedPolicy.deductible ? selectedPolicy.deductible.toLocaleString() : 'N/A'}
                    </p>
                  )}
                  {loadingPolicyDetails && (
                    <p className="text-surface-400 mt-2">Loading full policy details...</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Incident Details */}
          <div className="card-premium">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-100">
              <Calendar className="h-5 w-5 mr-2 text-amber-400" />
              Incident Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">
                  Incident Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="incident_date"
                  value={formData.incident_date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="input cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="label flex items-center">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Incident Location
                </label>
                <input
                  type="text"
                  name="incident_location"
                  value={formData.incident_location}
                  onChange={handleChange}
                  placeholder="e.g., 123 Main Street, City, State"
                  className="input"
                />
              </div>

              <div>
                <label className="label">
                  Incident Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="incident_description"
                  value={formData.incident_description}
                  onChange={handleChange}
                  rows="6"
                  placeholder="Please provide a detailed description of what happened, including date, time, circumstances, and any other relevant information..."
                  className="input"
                  required
                  minLength="10"
                />
                <p className="text-xs text-surface-400 mt-1">
                  Minimum 10 characters. Be as detailed as possible.
                </p>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="card-premium">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-100">
              <DollarSign className="h-5 w-5 mr-2 text-emerald-400" />
              Financial Details
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Claimed Amount <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-surface-400">₹</span>
                  <input
                    type="number"
                    name="claimed_amount"
                    value={formData.claimed_amount}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className="input pl-8"
                    required
                  />
                </div>
                <p className="text-xs text-surface-400 mt-1">
                  Amount you are claiming
                </p>
              </div>

              <div>
                <label className="label">
                  Estimated Loss <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-surface-400">₹</span>
                  <input
                    type="number"
                    name="estimated_loss"
                    value={formData.estimated_loss}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className="input pl-8"
                    required
                  />
                </div>
                <p className="text-xs text-surface-400 mt-1">
                  Total estimated loss or damage
                </p>
              </div>
            </div>
          </div>

          {/* Witnesses */}
          <div className="card-premium">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-100">
              <Users className="h-5 w-5 mr-2 text-violet-400" />
              Witnesses (Optional)
            </h2>
            
            {formData.witnesses.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.witnesses.map((w, index) => (
                  <div key={index} className="flex items-start justify-between p-3 bg-surface-700 border border-surface-600 rounded-xl">
                    <div className="flex-1">
                      <p className="font-medium text-gray-100">{w.name}</p>
                      <p className="text-sm text-surface-300">{w.contact}</p>
                      {w.statement && (
                        <p className="text-sm text-surface-400 mt-1">{w.statement}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeWitness(index)}
                      className="text-rose-500 hover:text-rose-400 text-sm font-medium ml-4 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="text"
                  name="name"
                  value={witness.name}
                  onChange={handleWitnessChange}
                  placeholder="Witness Name"
                  className="input"
                />
                <input
                  type="text"
                  name="contact"
                  value={witness.contact}
                  onChange={handleWitnessChange}
                  placeholder="Contact (Phone/Email)"
                  className="input"
                />
              </div>
              <input
                type="text"
                name="statement"
                value={witness.statement}
                onChange={handleWitnessChange}
                placeholder="Brief statement (optional)"
                className="input"
              />
              <button
                type="button"
                onClick={addWitness}
                disabled={!witness.name || !witness.contact}
                className="btn btn-secondary w-full"
              >
                Add Witness
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/claims')}
              className="btn btn-secondary px-6"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary px-8"
            >
              {loading ? 'Submitting...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewClaim;
