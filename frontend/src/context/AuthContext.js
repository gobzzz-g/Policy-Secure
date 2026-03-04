/**
 * Authentication Context
 * Manages user authentication state across the application
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Optionally verify token with server
          const currentUser = await authAPI.getCurrentUser();
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } catch (error) {
          console.error('Failed to load user:', error);
          logout();
        }
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      const data = await authAPI.login(email, password);
      console.log('Login response received:', data);
      
      localStorage.setItem('token', data.access_token);
      
      // Get user info
      try {
        console.log('Fetching current user info...');
        const currentUser = await authAPI.getCurrentUser();
        console.log('User info received:', currentUser);
        
        setUser(currentUser);
        localStorage.setItem('user', JSON.stringify(currentUser));
        toast.success('Login successful!');
        return currentUser;
      } catch (userError) {
        console.error('Error fetching user info:', userError);
        console.error('Error details:', userError.response);
        // Clear token if we can't get user info
        localStorage.removeItem('token');
        toast.error('Failed to load user information. Please try again.');
        throw userError;
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      await authAPI.register(userData);
      toast.success('Registration successful! Please login.');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isPolicyholder: user?.role === 'policyholder',
    isFraudInvestigator: user?.role === 'fraud_investigator',
    isAdmin: user?.role === 'admin',
    isCustomerSupport: user?.role === 'customer_support',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
