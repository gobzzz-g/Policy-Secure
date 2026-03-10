/**
 * Login Page - Premium Dark Theme
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, ArrowRight, Sparkles, ArrowLeft } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickLogins = [
    { email: 'user@example.com', password: 'user123', role: 'Policyholder' },
    { email: 'fraud@insurance.com', password: 'fraud123', role: 'Fraud Investigator' },
    { email: 'admin@insurance.com', password: 'admin123', role: 'Admin' },
  ];

  const quickLogin = (credentials) => {
    setEmail(credentials.email);
    setPassword(credentials.password);
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Back Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-surface-800/80 backdrop-blur-sm border border-surface-700/50 rounded-xl text-surface-300 hover:border-primary-500/50 hover:bg-surface-800 hover:text-primary-300 transition-all duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back</span>
      </Link>

      {/* Background effects */}
      <div className="absolute inset-0 grid-bg" />
      <div className="glow-orb w-[500px] h-[500px] bg-primary-600 top-[-200px] right-[-100px]" />
      <div className="glow-orb w-[400px] h-[400px] bg-accent-violet bottom-[-200px] left-[-100px]" />

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-violet rounded-2xl flex items-center justify-center shadow-glow">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-surface-400 mt-2 text-sm sm:text-base">Sign in to your PolicySecure account</p>
        </div>

        {/* Login Form */}
        <div className="card-premium animate-fade-in-up">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label flex items-center">
                <Mail className="w-4 h-4 mr-2 text-primary-400" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="label flex items-center">
                <Lock className="w-4 h-4 mr-2 text-primary-400" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-glow py-3.5 rounded-xl flex items-center justify-center text-base"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-surface-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Quick Login (Demo Only) */}
        <div className="mt-6 card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-sm font-medium text-surface-300 mb-3 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-accent-amber" />
            Quick Login (Demo)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickLogins.map((cred, idx) => (
              <button
                key={idx}
                onClick={() => quickLogin(cred)}
                className="text-xs sm:text-sm px-3 py-2.5 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-300 hover:border-primary-500/30 hover:bg-primary-500/5 hover:text-primary-300 transition-all duration-200"
              >
                {cred.role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
