/**
 * Layout Component - Premium Dark Theme
 * Main application layout with navigation
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  FileText,
  Shield,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, isPolicyholder, isAdmin, isFraudInvestigator } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items based on role
  const getNavigationItems = () => {
    const baseItems = [
      { path: '/dashboard', icon: Home, label: 'Dashboard' },
    ];

    if (isPolicyholder) {
      return [
        ...baseItems,
        { path: '/claims', icon: FileText, label: 'Claims' },
        { path: '/policies', icon: Shield, label: 'My Policies' },
      ];
    }

    if (isFraudInvestigator) {
      return [
        ...baseItems,
        { path: '/investigator/dashboard', icon: Shield, label: 'Investigation Dashboard' },
        { path: '/claims', icon: FileText, label: 'Flagged Claims' },
        { path: '/admin/analytics', icon: BarChart3, label: 'Fraud Analytics' },
      ];
    }

    if (isAdmin) {
      return [
        ...baseItems,
        { path: '/officer/dashboard', icon: BarChart3, label: 'Officer View' },
        { path: '/investigator/dashboard', icon: Shield, label: 'Investigator View' },
        { path: '/claims', icon: FileText, label: 'All Claims' },
        { path: '/policies', icon: Shield, label: 'Policies' },
        { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
      ];
    }

    return [
      ...baseItems,
      { path: '/claims', icon: FileText, label: 'Claims' },
    ];
  };

  const navigationItems = getNavigationItems();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Top Navigation Bar */}
      <nav className="bg-surface-900/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Mobile Menu Button */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl text-surface-400 hover:text-white hover:bg-white/5 transition-all"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link to="/dashboard" className="flex items-center ml-2 lg:ml-0 group">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-violet rounded-xl flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold text-white tracking-tight" style={{ textShadow: '0 2px 10px rgba(99, 102, 241, 0.5)' }}>
                  Policy<span className="text-primary-400" style={{ textShadow: '0 2px 15px rgba(99, 102, 241, 0.8)' }}>Secure</span>
                </span>
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center text-white text-sm font-bold">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user?.full_name}</p>
                  <p className="text-xs text-surface-500 capitalize">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-surface-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50 w-64 backdrop-blur-xl border-r border-gray-700 shadow-2xl lg:shadow-none transform
            transition-transform duration-300 ease-in-out lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          style={{ backgroundColor: '#0f172a' }}
        >
          <div className="flex flex-col h-full pt-20 lg:pt-6 pb-4" style={{ backgroundColor: '#0f172a' }}>
            {/* Mobile sidebar header - visible only on mobile */}
            <div className="lg:hidden px-4 pb-4 mb-2 border-b border-gray-600">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-violet rounded-xl flex items-center justify-center shadow-glow">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold text-white tracking-tight" style={{ textShadow: '0 2px 10px rgba(99, 102, 241, 0.5)' }}>
                  Policy<span className="text-primary-400" style={{ textShadow: '0 2px 15px rgba(99, 102, 241, 0.8)' }}>Secure</span>
                </span>
              </div>
            </div>
            
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                      ${isActive(item.path)
                        ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30 shadow-md'
                        : 'text-surface-300 hover:text-white hover:bg-surface-800/80 hover:border hover:border-surface-700/50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {isActive(item.path) && (
                      <ChevronRight className="w-4 h-4 ml-auto text-primary-400" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
