/**
 * Loading Component - Premium Dark Theme
 */

import React from 'react';
import { Shield } from 'lucide-react';

const Loading = () => {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="relative inline-flex mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-violet rounded-2xl flex items-center justify-center shadow-glow animate-pulse-glow">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="absolute inset-0 rounded-2xl animate-ping bg-primary-500/20" />
        </div>
        <p className="text-surface-400 text-sm font-medium mt-4">Loading PolicySecure...</p>
      </div>
    </div>
  );
};

export default Loading;
