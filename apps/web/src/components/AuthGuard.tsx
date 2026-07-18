'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@crowdmind/shared';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/login');
    }
  }, [firebaseUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
          <p className="text-xs font-semibold tracking-widest text-sky-400 uppercase animate-pulse">
            Authenticating Session...
          </p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  // Enforce Role-Based Access Control if specified
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0f1d]">
        <div className="max-w-md w-full glassmorphic-card p-8 rounded-2xl border-red-500/20 text-center">
          <div className="h-16 w-16 mx-auto mb-6 flex items-center justify-center bg-red-500/10 rounded-full text-red-500">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-slate-400 text-sm font-light mb-6">
            Your current operational role (<strong className="text-slate-200">{user.role}</strong>) does not have authorization to view this command portal.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold uppercase tracking-wider rounded-lg transition"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
