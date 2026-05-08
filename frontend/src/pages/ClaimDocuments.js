import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  FileText,
  UploadCloud,
  ShieldCheck,
  XCircle,
  Clock
} from 'lucide-react';
import { claimsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const documentTypeOptions = [
  { value: 'claim_form', label: 'Claim Form' },
  { value: 'policy_document', label: 'Policy Document' },
  { value: 'medical_bill', label: 'Medical Bill' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'diagnostic_report', label: 'Diagnostic Report' },
  { value: 'accident_report', label: 'Accident Report' },
  { value: 'vehicle_damage_photo', label: 'Vehicle Damage Photo' },
  { value: 'repair_estimate', label: 'Repair Estimate' },
  { value: 'police_report', label: 'Police Report' },
  { value: 'witness_statement', label: 'Witness Statement' },
  { value: 'property_damage_photo', label: 'Property Damage Photo' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'id_proof', label: 'ID Proof' },
  { value: 'address_proof', label: 'Address Proof' },
  { value: 'other', label: 'Other' },
];

const statusStyles = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  verified: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  requires_clarification: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const ClaimDocuments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPolicyholder, isFraudInvestigator, isAdmin, isCustomerSupport } = useAuth();

  const [selectedType, setSelectedType] = useState('claim_form');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationEdits, setVerificationEdits] = useState({});

  const { data: claim, isLoading: claimLoading } = useQuery({
    queryKey: ['claim', id],
    queryFn: () => claimsAPI.get(id),
    enabled: Boolean(id),
  });

  const {
    data: documents,
    isLoading: documentsLoading,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ['claim-documents', id],
    queryFn: () => claimsAPI.listDocuments(id),
    enabled: Boolean(id),
  });

  const canVerify = useMemo(() => {
    return isAdmin || isFraudInvestigator || isCustomerSupport || !isPolicyholder;
  }, [isAdmin, isFraudInvestigator, isCustomerSupport, isPolicyholder]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files?.[0] || null);
    setError('');
    setSuccess('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');
      await claimsAPI.uploadDocument(id, selectedFile, selectedType);
      setSelectedFile(null);
      await refetchDocuments();
      setSuccess('Document uploaded successfully.');
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await claimsAPI.downloadDocument(id, doc.id);
      const blob = new Blob([response.data], { type: doc.mime_type || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.original_filename || 'document';
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError(err.response?.data?.detail || 'Failed to download document.');
    }
  };

  const handleVerify = async (doc) => {
    const edit = verificationEdits[doc.id] || {};
    const payload = {
      status: edit.status || doc.status,
      verification_notes: edit.notes || '',
    };

    try {
      setError('');
      setSuccess('');
      await claimsAPI.verifyDocument(id, doc.id, payload);
      await refetchDocuments();
      setSuccess('Document verification updated.');
    } catch (err) {
      console.error('Verification failed:', err);
      setError(err.response?.data?.detail || 'Failed to update verification.');
    }
  };

  const handleSubmitClaim = async () => {
    try {
      setSubmitLoading(true);
      setError('');
      setSuccess('');
      await claimsAPI.submit(id);
      setSuccess('Claim submitted successfully.');
      setTimeout(() => navigate(`/claims/${id}`), 1200);
    } catch (err) {
      console.error('Submit failed:', err);
      setError(err.response?.data?.detail || 'Failed to submit claim.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (claimLoading || documentsLoading) {
    return <Loading message="Loading documents..." />;
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to={`/claims/${id}`} className="inline-flex items-center gap-2 text-sm text-surface-300 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to Claim
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">Claim Documents</h1>
          <p className="text-surface-400 mt-1">
            Upload and verify documents for claim {claim?.claim_number}
          </p>
        </div>
        {isPolicyholder && claim?.status === 'draft' && (
          <button
            onClick={handleSubmitClaim}
            disabled={submitLoading}
            className="btn btn-glow px-5 py-3"
          >
            {submitLoading ? 'Submitting...' : 'Submit for Review'}
          </button>
        )}
      </div>

      {error && (
        <div className="card border border-rose-500/40 bg-rose-500/10 text-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Action required</p>
            <p className="text-sm text-rose-200/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="card border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Success</p>
            <p className="text-sm text-emerald-200/80 mt-1">{success}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary-400" />
              Upload Documents
            </h2>
            <div className="grid gap-4">
              <div>
                <label className="label">Document Type</label>
                <select
                  value={selectedType}
                  onChange={(event) => setSelectedType(event.target.value)}
                  className="input"
                >
                  {documentTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Upload File</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="input"
                />
                <p className="text-xs text-surface-400 mt-2">
                  Accepted: jpg, png, pdf, doc, docx (max 10MB)
                </p>
              </div>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="btn btn-primary"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-400" />
                Uploaded Documents
              </h2>
              <span className="text-sm text-surface-400">
                {documents?.length || 0} files
              </span>
            </div>

            {documents && documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map(doc => (
                  <div key={doc.id} className="p-4 rounded-xl border border-surface-700/50 bg-surface-800/40">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-100">{doc.original_filename}</p>
                        <p className="text-xs text-surface-400 mt-1 capitalize">{doc.document_type?.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[doc.status] || 'bg-surface-700/50 text-surface-300 border-surface-600'}`}>
                          {doc.status?.replace(/_/g, ' ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDownload(doc)}
                          className="px-3 py-1 text-xs font-semibold rounded-full border border-surface-600 text-surface-200 hover:border-primary-500/50"
                        >
                          Download
                        </button>
                      </div>
                    </div>

                    {canVerify && (
                      <div className="mt-4 grid gap-3">
                        <div>
                          <label className="label">Verification Status</label>
                          <select
                            value={verificationEdits[doc.id]?.status || doc.status}
                            onChange={(event) => setVerificationEdits(prev => ({
                              ...prev,
                              [doc.id]: {
                                status: event.target.value,
                                notes: prev[doc.id]?.notes || '',
                              }
                            }))}
                            className="input"
                          >
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                            <option value="requires_clarification">Requires Clarification</option>
                          </select>
                        </div>
                        <div>
                          <label className="label">Verification Notes</label>
                          <textarea
                            rows={3}
                            value={verificationEdits[doc.id]?.notes || ''}
                            onChange={(event) => setVerificationEdits(prev => ({
                              ...prev,
                              [doc.id]: {
                                status: prev[doc.id]?.status || doc.status,
                                notes: event.target.value,
                              }
                            }))}
                            className="input"
                            placeholder="Add verification notes..."
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleVerify(doc)}
                          className="btn btn-secondary"
                        >
                          Update Verification
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-surface-400">
                <Clock className="w-10 h-10 mx-auto mb-3 text-surface-500" />
                <p>No documents uploaded yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary-400" />
              Verification Guidance
            </h2>
            <ul className="space-y-3 text-sm text-surface-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                Ensure documents match the claim details and policy coverage.
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-yellow-400 mt-0.5" />
                Mark documents as pending if more context is needed.
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-rose-400 mt-0.5" />
                Reject documents that are incomplete or unrelated.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimDocuments;
