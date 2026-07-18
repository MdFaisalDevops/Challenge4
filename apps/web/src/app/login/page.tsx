'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login, loginWithGoogle, loginAnonymously } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push('/');
    } catch (err) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Google Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginAnonymously();
      router.push('/');
    } catch (err) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Guest Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#0a0f1d] relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />

      <div className="z-10 max-w-md w-full glassmorphic-card p-8 rounded-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            <span className="gradient-text">CrowdMind AI</span>
          </h1>
          <p className="text-xs text-slate-400 font-light tracking-wide uppercase">
            Command Center Login
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-mono">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Operational Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. director@crowdmind.ai"
              className="w-full px-4 py-3 bg-slate-900/60 border border-white/5 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Passcode
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-900/60 border border-white/5 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-xl text-xs font-semibold uppercase tracking-wider text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase font-semibold tracking-wider">Or continue with</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        {/* Third-Party Authentication Providers */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 bg-slate-900 border border-white/5 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-200 hover:bg-slate-800 disabled:opacity-50 transition"
          >
            {/* Simple Inline Google G Icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 bg-slate-900 border border-white/5 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-200 hover:bg-slate-800 disabled:opacity-50 transition"
          >
            👤 Guest
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400 font-light">
          No tactical profile registered?{' '}
          <Link href="/signup" className="text-sky-400 font-semibold hover:underline">
            Request Access (Sign Up)
          </Link>
        </p>
      </div>
    </main>
  );
}
