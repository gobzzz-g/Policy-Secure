/**
 * API Service
 * Handles all HTTP requests to the backend API
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Log the API URL being used
console.log('=== API Configuration ===');
console.log('REACT_APP_API_URL from env:', process.env.REACT_APP_API_URL);
console.log('Final API_URL being used:', API_URL);
console.log('========================');

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },
};

// Claims APIs
export const claimsAPI = {
  list: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/api/claims', { params });
    return response.data;
  },
  
  get: async (claimId) => {
    const response = await api.get(`/api/claims/${claimId}`);
    return response.data;
  },
  
  create: async (claimData) => {
    const response = await api.post('/api/claims', claimData);
    return response.data;
  },
  
  submit: async (claimId) => {
    const response = await api.post(`/api/claims/${claimId}/submit`);
    return response.data;
  },
  
  review: async (claimId, reviewData) => {
    const response = await api.put(`/api/claims/${claimId}/review`, reviewData);
    return response.data;
  },
  
  fraudReview: async (claimId, reviewData) => {
    const response = await api.put(`/api/claims/${claimId}/fraud-review`, reviewData);
    return response.data;
  },
  
  delete: async (claimId) => {
    const response = await api.delete(`/api/claims/${claimId}`);
    return response.data;
  },

  listDocuments: async (claimId) => {
    const response = await api.get(`/api/claims/${claimId}/documents`);
    return response.data;
  },

  uploadDocument: async (claimId, file, documentType) => {
    const formData = new FormData();
    formData.append('file', file);
    if (documentType) {
      formData.append('document_type', documentType);
    }

    const response = await api.post(`/api/claims/${claimId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  verifyDocument: async (claimId, documentId, payload) => {
    const response = await api.put(`/api/claims/${claimId}/documents/${documentId}/verify`, payload);
    return response.data;
  },

  downloadDocument: async (claimId, documentId) => {
    const response = await api.get(`/api/claims/${claimId}/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response;
  },

  timeline: async (claimId) => {
    const response = await api.get(`/api/claims/${claimId}/timeline`);
    return response.data;
  },
};

// Policies APIs
export const policiesAPI = {
  list: async () => {
    const response = await api.get('/api/policies');
    return response.data;
  },
  
  get: async (policyId) => {
    const response = await api.get(`/api/policies/${policyId}`);
    return response.data;
  },
  
  create: async (policyData) => {
    const response = await api.post('/api/policies', policyData);
    return response.data;
  },
};

// Admin APIs
export const adminAPI = {
  getAnalytics: async () => {
    const response = await api.get('/api/admin/analytics/overview');
    return response.data;
  },
  
  getFraudTrends: async () => {
    const response = await api.get('/api/admin/analytics/fraud-trends');
    return response.data;
  },
  
  listUsers: async () => {
    const response = await api.get('/api/admin/users');
    return response.data;
  },
  
  toggleUserActive: async (userId) => {
    const response = await api.put(`/api/admin/users/${userId}/toggle-active`);
    return response.data;
  },
};

// Utility APIs
export const utilityAPI = {
  getInsuranceTypes: async () => {
    const response = await api.get('/api/insurance-types');
    return response.data;
  },
  
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
