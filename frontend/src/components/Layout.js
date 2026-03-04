/**
 * Layout Component
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
  User,
  Settings,
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
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Mobile Menu Button */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <Link to="/dashboard" className="flex items-center ml-2 lg:ml-0">
                <Shield className="w-8 h-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">
                  Policy Secure
                </span>
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
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
            fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform
            transition-transform duration-200 ease-in-out lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex flex-col h-full pt-20 lg:pt-6 pb-4">
            <nav className="flex-1 px-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                      ${
                        isActive(item.path)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
