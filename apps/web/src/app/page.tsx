'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, firebaseUser, logout } = useAuth();
  const [healthData, setHealthData] = useState<{
    status: string;
    timestamp: string;
    services?: { express: string; firestore: string };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/health` 
          : 'http://localhost:5000/health',
        { headers }
      );
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      setHealthData(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect to API server';
      setError(errorMsg);
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, [firebaseUser]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-12 relative overflow-hidden bg-[#0a0f1d]">
      {/* Background visual accents */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="z-10 max-w-6xl w-full items-center justify-between text-sm flex flex-col md:flex-row gap-4 border-b border-white/5 bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl mb-12">
        <p className="flex justify-center font-semibold text-slate-200">
          CrowdMind AI Foundation Dashboard
        </p>

        <div className="flex items-center gap-4">
          {firebaseUser ? (
            <div className="flex items-center gap-3 text-xs">
              <div className="text-right">
                <p className="text-slate-200 font-medium">{user?.name || 'Loading Operator...'}</p>
                <p className="text-slate-400 font-light text-[10px]">Role: <span className="text-sky-400 font-semibold">{user?.role || '...'}</span></p>
              </div>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-lg font-semibold text-white transition text-center"
              >
                Command Center
              </Link>
              <button
                onClick={logout}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-lg font-medium text-slate-300 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex gap-2 text-xs">
              <Link
                href="/login"
                className="px-4 py-2 bg-slate-900 border border-white/10 hover:border-white/20 rounded-lg text-slate-300 transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-lg text-white font-medium hover:opacity-90 transition"
              >
                Request Access
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Banner */}
      <div className="z-10 flex flex-col items-center max-w-4xl text-center my-12 md:my-24">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          <span className="gradient-text">CrowdMind AI</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl font-light">
          Next-generation Predictive Stadium Operations and Crowd Management Platform powered by Generative AI.
        </p>
      </div>

      {/* Interactive Cards Group */}
      <div className="z-10 grid text-left lg:max-w-5xl lg:w-full lg:grid-cols-3 gap-6 mb-12">
        <div className="glassmorphic-card p-6 rounded-2xl transition duration-300 hover:scale-[1.01] hover:border-white/20">
          <h2 className="text-xl font-bold mb-3 text-sky-400 flex items-center gap-2">
            <span>Edge Telemetry</span>
            <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
          </h2>
          <p className="text-sm text-slate-400 font-light leading-relaxed">
            Real-time counting nodes monitoring entryways and staircase levels. Standardized schemas ready.
          </p>
        </div>

        <div className="glassmorphic-card p-6 rounded-2xl transition duration-300 hover:scale-[1.01] hover:border-white/20">
          <h2 className="text-xl font-bold mb-3 text-indigo-400 flex items-center gap-2">
            <span>GenAI Sandbox</span>
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          </h2>
          <p className="text-sm text-slate-400 font-light leading-relaxed">
            Run "What-If" bottleneck scenarios in natural language and retrieve vector-searched safety SOP actions.
          </p>
        </div>

        <div className="glassmorphic-card p-6 rounded-2xl transition duration-300 hover:scale-[1.01] hover:border-white/20">
          <h2 className="text-xl font-bold mb-3 text-violet-400 flex items-center gap-2">
            <span>System Core API</span>
            <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
          </h2>
          <p className="text-sm text-slate-400 font-light leading-relaxed">
            Express/Node endpoint mapping with dynamic schema-valid Firestore integrations.
          </p>
        </div>
      </div>

      {/* Health Check Integration Monitor */}
      <div className="z-10 max-w-2xl w-full glassmorphic-card p-6 rounded-2xl border-white/5 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-200">Integration Monitor</h3>
            <p className="text-xs text-slate-400 font-light">Validates connectivity between Next.js and the Express backend API.</p>
          </div>
          <button
            onClick={checkHealth}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-lg text-xs font-semibold uppercase tracking-wider text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-mono">
            ⚠️ Connection Error: {error}
          </div>
        )}

        {healthData && (
          <div className="p-4 bg-slate-950/40 border border-white/5 rounded-xl text-xs font-mono">
            <div className="flex justify-between border-b border-white/5 pb-2 mb-2">
              <span className="text-slate-400">Endpoint Status</span>
              <span className={`font-semibold ${healthData.status === 'UP' ? 'text-emerald-400' : 'text-red-400'}`}>
                {healthData.status}
              </span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2 mb-2">
              <span className="text-slate-400">Response Timestamp</span>
              <span className="text-slate-200">{healthData.timestamp}</span>
            </div>
            {healthData.services && (
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Internal Services</p>
                <div className="flex justify-between">
                  <span className="text-slate-400">Express Host</span>
                  <span className="text-emerald-400 font-semibold">{healthData.services.express}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Firestore Connection</span>
                  <span className={`font-semibold ${healthData.services.firestore === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {healthData.services.firestore}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="z-10 text-slate-500 text-xs mt-12 font-light">
        © 2026 CrowdMind AI. Google Distinguished Engineering Team.
      </div>
    </main>
  );
}
