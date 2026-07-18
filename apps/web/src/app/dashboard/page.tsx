'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import nextDynamic from 'next/dynamic';
import { AuthGuard } from '../../components/AuthGuard';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Recommendation } from '../../lib/types';
import { 
  OverviewView, CrowdView, IncidentsView, TransportationView, 
  VolunteersView, SettingsView, ProfileView 
} from '../../components/DashboardViews';
import { 
  LayoutDashboard, Users, Map, ShieldAlert, Bus, 
  HeartPulse, Settings, User, LogOut, Menu, X, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Code split heavy maps modules to boost initial page layout interactive latency (FID/TTI)
const StadiumMap = nextDynamic(() => import('../../components/StadiumMap').then((mod) => mod.StadiumMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-900 border border-white/5 rounded-2xl min-h-[350px]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-sky-500/20 border-t-sky-500 animate-spin" />
        <p className="text-xs text-slate-400 font-light">Loading Maps Engine...</p>
      </div>
    </div>
  ),
});

type TabType = 'dashboard' | 'crowd' | 'navigation' | 'incidents' | 'transportation' | 'volunteers' | 'settings' | 'profile';

export default function DashboardPage() {
  const { firebaseUser, logout, user } = useAuth();
  const { reducedMotion, speakText } = useAccessibility();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Hook voice navigation commands from Accessibility Provider
  useEffect(() => {
    const handleVoiceNavigate = (e: Event) => {
      const command = (e as CustomEvent).detail;
      if (command === 'logout') {
        logout();
      } else {
        setActiveTab(command);
      }
    };
    window.addEventListener('voice-navigate', handleVoiceNavigate);
    return () => {
      window.removeEventListener('voice-navigate', handleVoiceNavigate);
    };
  }, [logout]);

  // Map variables
  const [selectedRoute, setSelectedRoute] = useState<'fastest' | 'leastCrowded' | 'wheelchair' | 'emergency'>('fastest');
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Recommendations variables
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  const fetchRecommendations = async () => {
    try {
      const token = await firebaseUser?.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/v1/recommendations?status=pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const payload = await res.json();
        setRecommendations(payload.data || []);
      }
    } catch (err) {
      console.error('[Dashboard]: Failed to load AI recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    if (firebaseUser) {
      fetchRecommendations();
    }
  }, [firebaseUser]);

  const handleRecClick = useCallback((rec: Recommendation) => {
    setActiveTab('navigation');
    if (rec.title.includes('Redirect') || rec.title.includes('Gate')) {
      setFocusLocation({ lat: 51.5568, lng: -0.2781 }); // Pan to Gate B
      setSelectedRoute('leastCrowded');
    } else if (rec.title.includes('Medical') || rec.title.includes('Triage') || rec.title.includes('hydration')) {
      setFocusLocation({ lat: 51.5562, lng: -0.2802 }); // Pan to medical incident area
      setSelectedRoute('wheelchair');
    } else {
      setFocusLocation({ lat: 51.556, lng: -0.2795 }); // Center
      setSelectedRoute('emergency');
    }
  }, []);

  // Memoize sidebar items config list to prevent layout re-allocation cycles
  const sidebarItems = useMemo(() => [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'crowd', name: 'Crowd Density', icon: <Users size={18} /> },
    { id: 'navigation', name: 'Navigation Map', icon: <Map size={18} /> },
    { id: 'incidents', name: 'Safety Incidents', icon: <ShieldAlert size={18} /> },
    { id: 'transportation', name: 'Transportation', icon: <Bus size={18} /> },
    { id: 'volunteers', name: 'Volunteers', icon: <HeartPulse size={18} /> },
    { id: 'settings', name: 'Settings', icon: <Settings size={18} /> },
    { id: 'profile', name: 'User Profile', icon: <User size={18} /> },
  ] as const, []);

  // Memoize recommendations renderer to optimize state render updates
  const renderedRecommendations = useMemo(() => {
    if (loadingRecs) {
      return (
        <div className="h-40 flex items-center justify-center text-xs text-slate-500 animate-pulse">
          Syncing recommendations...
        </div>
      );
    }
    if (recommendations.length === 0) {
      return (
        <div className="p-4 bg-slate-900/40 border border-white/5 rounded-xl text-center text-xs text-slate-500 font-light">
          Normal state. No warnings logged.
        </div>
      );
    }
    return recommendations.map((rec) => (
      <div
        key={rec.id}
        onClick={() => handleRecClick(rec)}
        className="p-3 bg-slate-900/40 border border-white/5 hover:border-sky-500/30 rounded-xl cursor-pointer transition text-left"
      >
        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider block w-fit mb-2 ${
          rec.priority === 'critical' || rec.priority === 'high'
            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        }`}>
          {rec.priority}
        </span>
        <h4 className="text-xs font-bold text-slate-200 mb-1">{rec.title}</h4>
        <p className="text-[10px] text-slate-500 font-light leading-relaxed mb-2">
          {rec.description}
        </p>
        <div className="text-[9px] text-sky-400 font-semibold flex items-center gap-1">
          <span>Plot Route</span>
          <ArrowRight size={10} />
        </div>
      </div>
    ));
  }, [recommendations, loadingRecs, handleRecClick]);

  return (
    <AuthGuard allowedRoles={['OpsDirector', 'SecurityLead']}>
      <main className="min-h-screen bg-[#070b19] text-slate-100 flex relative overflow-hidden">
        {/* Background Visual Blurs */}
        <div className="absolute top-0 left-0 w-[50%] h-[30%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[30%] rounded-full bg-cyan-500/5 blur-[150px] pointer-events-none" />

        {/* 1. SIDEBAR (DESKTOP) */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-slate-950/40 backdrop-blur-md z-20">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight gradient-text">CrowdMind AI</h1>
            <span className="px-1.5 py-0.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[8px] font-bold rounded uppercase">
              Ops
            </span>
          </div>

          <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === item.id 
                    ? 'bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20 text-sky-400' 
                    : 'text-slate-400 hover:bg-white/[0.02] border border-transparent'
                }`}
              >
                {item.icon}
                {item.name}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* 2. MOBILE SIDEBAR DRAWER */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-white/5 z-30 flex flex-col p-4"
            >
              <div className="flex justify-between items-center pb-6 border-b border-white/5">
                <span className="text-sm font-bold gradient-text">CrowdMind AI</span>
                <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400"><X size={20} /></button>
              </div>

              <nav className="flex-grow space-y-1 py-4">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                      activeTab === item.id 
                        ? 'bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20 text-sky-400' 
                        : 'text-slate-400 hover:bg-white/[0.02]'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </button>
                ))}
              </nav>

              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/20"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* 3. MAIN WORKSPACE CONTENT PANEL */}
        <div className="flex-grow flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <header className="z-10 border-b border-white/5 bg-slate-950/20 backdrop-blur-md px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <Menu size={20} />
              </button>
              <h2 className="text-md font-bold capitalize text-slate-200">
                {activeTab.replace(/([A-Z])/g, ' $1')} View
              </h2>
            </div>
            
            <div className="flex items-center gap-3 text-xs">
              <div className="text-right hidden sm:block">
                <p className="text-slate-200 font-semibold">{user?.name || 'Operator'}</p>
                <p className="text-slate-500 text-[10px]">Role: <span className="text-sky-400 font-semibold">{user?.role || 'Guest'}</span></p>
              </div>
              <div className="h-8 w-8 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold flex items-center justify-center uppercase">
                {user?.name?.slice(0, 2) || 'OP'}
              </div>
            </div>
          </header>

          {/* Main viewport */}
          <div className="flex-grow p-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                transition={{ duration: reducedMotion ? 0 : 0.15 }}
                className="h-full"
              >
                {activeTab === 'dashboard' && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full items-start">
                    {/* Main tactical overview */}
                    <div className="lg:col-span-3 space-y-6">
                      <OverviewView onNavigateTab={(tab) => setActiveTab(tab as TabType)} />
                    </div>

                    {/* AI Decision Panel right-aligned */}
                    <div className="glassmorphic-card rounded-2xl p-5 flex flex-col max-h-[500px]">
                      <div className="mb-4">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          AI Decision Panel
                        </h2>
                        <p className="text-[10px] text-slate-500">Live operational warning updates</p>
                      </div>

                      <div className="flex-grow overflow-y-auto space-y-3 pr-1">
                        {renderedRecommendations}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'crowd' && <CrowdView />}

                {activeTab === 'navigation' && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full items-stretch">
                    <div className="lg:col-span-3 h-[calc(100vh-210px)]">
                      <StadiumMap
                        selectedRoute={selectedRoute}
                        focusLocation={focusLocation}
                        showHeatmap={showHeatmap}
                      />
                    </div>

                    <div className="glassmorphic-card p-5 rounded-2xl flex flex-col justify-between">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Map Controls</h3>
                          <button
                            onClick={() => setShowHeatmap(!showHeatmap)}
                            className={`w-full py-2.5 rounded-xl border text-xs font-medium transition ${
                              showHeatmap
                                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                                : 'bg-slate-900 border-white/5 text-slate-400'
                            }`}
                          >
                            {showHeatmap ? '🔥 Hide Heatmap' : '🔥 Show Heatmap'}
                          </button>
                        </div>

                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Rerouting options</h3>
                          <div className="flex flex-col gap-2">
                            {(['fastest', 'leastCrowded', 'wheelchair', 'emergency'] as const).map((type) => (
                              <button
                                key={type}
                                onClick={() => {
                                  setSelectedRoute(type);
                                  setFocusLocation(null);
                                }}
                                className={`w-full py-2.5 rounded-xl border text-left px-4 text-xs font-semibold uppercase tracking-wider transition ${
                                  selectedRoute === type
                                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 border-none text-white'
                                    : 'bg-slate-900 border-white/5 text-slate-300 hover:border-white/10'
                                }`}
                              >
                                {type.replace(/([A-Z])/g, ' $1')}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setFocusLocation(null);
                          setSelectedRoute('fastest');
                        }}
                        className="w-full py-3 bg-slate-900 border border-white/5 hover:border-white/10 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-400 transition"
                      >
                        Reset camera
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'incidents' && <IncidentsView />}
                {activeTab === 'transportation' && <TransportationView />}
                {activeTab === 'volunteers' && <VolunteersView />}
                {activeTab === 'settings' && <SettingsView />}
                {activeTab === 'profile' && <ProfileView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
