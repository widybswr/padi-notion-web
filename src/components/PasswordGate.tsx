'use client';

import React, { useState } from 'react';
import { Lock, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface PasswordGateProps {
  onAuthenticated: () => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    setTimeout(() => {
      if (password === 'padi2026') {
        localStorage.setItem('padi_workspace_auth', 'padi2026');
        onAuthenticated();
      } else {
        setError(true);
        setIsLoading(false);
      }
    }, 250);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-sans select-none">
      <div className="w-full max-w-sm">
        {/* Figma Org / Notion Style Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-8 shadow-xl shadow-zinc-200/40 dark:shadow-none transition-all">
          {/* Logo / Org Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-2xl mb-3 shadow-inner">
              🌾
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-medium mb-2">
              <ShieldCheck className="w-3 h-3" />
              <span>PaDi Design Organization</span>
            </div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Q4 2026 Workspace
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Enter the organization password to continue
            </p>
          </div>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  className={`w-full pl-9 pr-10 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none transition-all ${
                    error
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-zinc-200 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-zinc-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="text-[11px] text-red-500 mt-1.5 pl-1 animate-in fade-in duration-200">
                  Incorrect password. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <span>{isLoading ? 'Verifying...' : 'Enter Workspace'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Org Hint */}
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-400 font-mono">
              Protected Organization Asset
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
