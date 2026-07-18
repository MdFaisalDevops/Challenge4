'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../lib/types';

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('FieldAgent');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signUp(email, password, name, role);
      router.push('/');
    } catch (err) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Signup failed. Please try again.');
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
            <span className="gradient-text">Register Profile</span>
          </h1>
          <p className="text-xs text-slate-400 font-light tracking-wide uppercase">
            Request CrowdMind AI Credentials
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-mono">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Capt. James Miller"
              className="w-full px-4 py-3 bg-slate-900/60 border border-white/5 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Operational Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jmiller@crowdmind.ai"
              className="w-full px-4 py-3 bg-slate-900/60 border border-white/5 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Security Passcode
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-4 py-3 bg-slate-900/60 border border-white/5 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Tactical Assignment (Role)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500/50 transition"
            >
              <option value="FieldAgent">Field Agent / Responder</option>
              <option value="FacilitiesMgr">Facilities & Concessions Manager</option>
              <option value="SecurityLead">Safety & Security Lead</option>
              <option value="OpsDirector">Operations Director</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-xl text-xs font-semibold uppercase tracking-wider text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition"
          >
            {loading ? 'Submitting Request...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400 font-light">
          Already registered?{' '}
          <Link href="/login" className="text-sky-400 font-semibold hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </main>
  );
}
