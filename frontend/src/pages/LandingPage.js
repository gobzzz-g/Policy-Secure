/**
 * Landing Page
 * Welcome page for non-authenticated users
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  TrendingUp,
  Users,
  ArrowRight,
  Brain,
  FileCheck,
  Clock,
} from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Gemini AI evaluates claims for fraud risk and provides intelligent recommendations',
    },
    {
      icon: FileCheck,
      title: 'Multi-Insurance Support',
      description: 'Handle Health, Motor, Property, Travel, Crop, and Personal Accident claims',
    },
    {
      icon: Clock,
      title: 'Fast Processing',
      description: 'Automated workflows reduce claim processing time significantly',
    },
    {
      icon: Shield,
      title: 'Fraud Detection',
      description: 'Hybrid rule-based + AI system identifies suspicious patterns',
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Dedicated interfaces for policyholders, officers, investigators, and admins',
    },
    {
      icon: TrendingUp,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights into claims, fraud trends, and performance metrics',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                Policy Secure
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
            AI-Powered Insurance
            <span className="text-primary-600"> Claims Processing</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your insurance claims with intelligent fraud detection,
            automated settlement calculations, and seamless processing across all insurance types.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn btn-primary px-8 py-3 text-lg inline-flex items-center justify-center">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link to="/login" className="btn btn-secondary px-8 py-3 text-lg">
              Sign In
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          {[
            { label: '6 Insurance Types', value: 'Supported' },
            { label: 'AI-Powered', value: 'Analysis' },
            { label: '5 User Roles', value: 'Supported' },
          ].map((stat, idx) => (
            <div key={idx} className="card text-center">
              <p className="text-3xl font-bold text-primary-600 mb-2">{stat.value}</p>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Claims Management
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to process insurance claims efficiently and securely
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="card hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Claims Process?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of insurance professionals using AI-powered claims management
            </p>
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-3 bg-white text-primary-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="w-6 h-6 text-primary-400" />
              <span className="text-lg font-semibold text-white">
                Insurance Claims Platform
              </span>
            </div>
            <p className="text-sm">
              © 2025 Unified AI Insurance Claims Processing Platform. All rights reserved.
            </p>
            <p className="text-xs mt-2 text-gray-500">
              Demo application - No real payments processed
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
