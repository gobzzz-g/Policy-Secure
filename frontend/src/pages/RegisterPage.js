/**
 * Register Page - Premium Dark Theme
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, User, Phone, MapPin, ArrowRight } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register({
        ...formData,
        role: 'policyholder',
      });
      navigate('/login');
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'full_name', label: 'Full Name', type: 'text', icon: User, placeholder: 'John Doe', required: true },
    { name: 'email', label: 'Email Address', type: 'email', icon: Mail, placeholder: 'you@example.com', required: true },
    { name: 'password', label: 'Password', type: 'password', icon: Lock, placeholder: '••••••••', required: true, minLength: 6 },
    { name: 'phone', label: 'Phone Number', type: 'tel', icon: Phone, placeholder: '+1-555-0000' },
  ];

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-3 sm:px-4 py-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg" />
      <div className="glow-orb w-[500px] h-[500px] bg-primary-600 top-[-200px] left-[-100px]" />
      <div className="glow-orb w-[400px] h-[400px] bg-accent-cyan bottom-[-200px] right-[-100px]" />

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-cyan rounded-2xl flex items-center justify-center shadow-glow">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Create Account</h1>
          <p className="text-surface-400 mt-2 text-sm sm:text-base">Join PolicySecure platform</p>
        </div>

        {/* Registration Form */}
        <div className="card-premium animate-fade-in-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.name}>
                  <label className="label flex items-center">
                    <Icon className="w-4 h-4 mr-2 text-primary-400" />
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="input"
                    placeholder={field.placeholder}
                    required={field.required}
                    minLength={field.minLength}
                  />
                </div>
              );
            })}

            <div>
              <label className="label flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-primary-400" />
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input"
                rows={2}
                placeholder="123 Main St, City, State"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-glow py-3.5 rounded-xl flex items-center justify-center text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-surface-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center animate-fade-in">
          <Link to="/" className="text-sm text-surface-500 hover:text-surface-300 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
