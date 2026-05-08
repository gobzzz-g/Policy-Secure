import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { claimsAPI } from '../services/api';
import Loading from '../components/Loading';
import { AlertCircle, Clock, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ClaimDetail = () => {
  const { id } = useParams();
  const { isFraudInvestigator, isAdmin } = useAuth();
  const [reviewDecision, setReviewDecision] = useState('genuine');
  const [reviewRiskLevel, setReviewRiskLevel] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const { data: claim, isLoading, refetch } = useQuery({
    queryKey: ['claim', id],
    queryFn: () => claimsAPI.get(id),
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['claim-timeline', id],
    queryFn: () => claimsAPI.timeline(id),
    enabled: Boolean(id),
  });

  if (isLoading) return <Loading />;
  if (!claim) return <div>Claim not found</div>;

  const handleFraudReview = async () => {
    if (!reviewNotes.trim()) {
      setReviewError('Please add verification notes.');
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError('');
      setReviewSuccess('');

      const payload = {
        is_genuine: reviewDecision === 'genuine',
        investigator_remarks: reviewNotes.trim(),
      };

      if (reviewRiskLevel) {
        payload.fraud_risk_level = reviewRiskLevel;
      }

      await claimsAPI.fraudReview(id, payload);
      await refetch();
      setReviewSuccess('Fraud verification submitted.');
    } catch (err) {
      console.error('Fraud review failed:', err);
      setReviewError(err.response?.data?.detail || 'Failed to submit fraud review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

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

      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Claim Documents</h2>
            <p className="text-sm text-gray-500">Review uploaded documents and verification status.</p>
          </div>
          <Link
            to={`/claims/${id}/documents`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-surface-600 text-surface-200 text-sm font-medium rounded-xl hover:border-primary-500/50 transition-all"
          >
            <FileText className="w-4 h-4" />
            Open Documents
          </Link>
        </div>
      </div>

      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-400" />
            Claim History
          </h2>
          <span className="text-sm text-gray-500">{timeline?.length || 0} events</span>
        </div>

        {timelineLoading ? (
          <Loading message="Loading history..." />
        ) : timeline && timeline.length > 0 ? (
          <div className="space-y-3">
            {timeline.map(entry => (
              <div key={entry.id} className="flex items-start gap-3 p-3 bg-surface-800/40 rounded-xl border border-surface-700/50">
                <div className="mt-1 w-2 h-2 rounded-full bg-primary-400" />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-100">{entry.action_description}</p>
                    <span className="text-xs text-surface-400">
                      {entry.created_at ? new Date(entry.created_at).toLocaleString() : '-'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-surface-400 flex flex-wrap gap-3">
                    {entry.actor_name && <span>By {entry.actor_name}</span>}
                    {entry.old_status && entry.new_status && (
                      <span>{entry.old_status} → {entry.new_status}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-surface-400">No history available yet.</div>
        )}
      </div>

      {(isFraudInvestigator || isAdmin) && (
        <div className="card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Fraud Verification</h2>

          {reviewError && (
            <div className="mb-4 flex items-start gap-2 text-sm text-rose-500">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              {reviewError}
            </div>
          )}

          {reviewSuccess && (
            <div className="mb-4 text-sm text-emerald-500">{reviewSuccess}</div>
          )}

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Decision</label>
              <select
                value={reviewDecision}
                onChange={(event) => setReviewDecision(event.target.value)}
                className="input"
              >
                <option value="genuine">Genuine</option>
                <option value="fraud">Fraud Suspected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Override Risk Level (optional)</label>
              <select
                value={reviewRiskLevel}
                onChange={(event) => setReviewRiskLevel(event.target.value)}
                className="input"
              >
                <option value="">Keep current</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Verification Notes</label>
              <textarea
                rows={4}
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
                className="input"
                placeholder="Add details about the investigation..."
              />
            </div>

            <button
              type="button"
              onClick={handleFraudReview}
              disabled={reviewSubmitting}
              className="btn btn-primary"
            >
              {reviewSubmitting ? 'Submitting...' : 'Submit Fraud Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimDetail;
