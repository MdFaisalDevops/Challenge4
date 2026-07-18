'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { 
  ShieldAlert, Users, Bus, HeartPulse, Settings as SettingsIcon, User as UserIcon, 
  MapPin, AlertTriangle, Play, CheckCircle, RefreshCw, Send, Check
} from 'lucide-react';
import { 
  Switch, Slider, TextField, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, Select, MenuItem, InputLabel, FormControl 
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { Incident, TransportationRoute, Volunteer, User } from '../lib/types';

// Mock chart data representing turnstile ingress rates and crowd densities
const crowdFlowData = [
  { time: '17:00', GateA: 120, GateB: 80, GateD: 40 },
  { time: '17:15', GateA: 240, GateB: 150, GateD: 90 },
  { time: '17:30', GateA: 450, GateB: 210, GateD: 180 },
  { time: '17:45', GateA: 850, GateB: 320, GateD: 210 },
  { time: '18:00', GateA: 1100, GateB: 450, GateD: 290 },
  { time: '18:15', GateA: 820, GateB: 610, GateD: 420 },
];

const waitTimeData = [
  { name: 'Gate A', Current: 28, Average: 15 },
  { name: 'Gate B', Current: 5, Average: 12 },
  { name: 'Gate C', Current: 14, Average: 10 },
  { name: 'Gate D', Current: 8, Average: 11 },
];

// --- 1. OVERVIEW VIEW ---
export const OverviewView: React.FC<{ 
  onNavigateTab: (tab: string) => void;
}> = ({ onNavigateTab }) => {
  return (
    <div className="space-y-6">
      {/* Visual stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div 
          onClick={() => onNavigateTab('crowd')}
          className="glassmorphic-card p-5 rounded-2xl hover:border-sky-500/20 cursor-pointer transition"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 bg-sky-500/10 text-sky-400 rounded-xl"><Users size={20} /></span>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">+12% flow</span>
          </div>
          <h3 className="text-xs text-slate-400 font-light mb-1">Total Active Occupancy</h3>
          <p className="text-2xl font-bold text-slate-100">42,850 <span className="text-xs text-slate-500 font-light">fans</span></p>
        </div>

        <div 
          onClick={() => onNavigateTab('incidents')}
          className="glassmorphic-card p-5 rounded-2xl hover:border-red-500/20 cursor-pointer transition"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 bg-red-500/10 text-red-400 rounded-xl"><ShieldAlert size={20} /></span>
            <span className="text-[10px] text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">2 Active</span>
          </div>
          <h3 className="text-xs text-slate-400 font-light mb-1">Safety Incidents</h3>
          <p className="text-2xl font-bold text-slate-100">12 Total</p>
        </div>

        <div 
          onClick={() => onNavigateTab('transportation')}
          className="glassmorphic-card p-5 rounded-2xl hover:border-indigo-500/20 cursor-pointer transition"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl"><Bus size={20} /></span>
            <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Delayed</span>
          </div>
          <h3 className="text-xs text-slate-400 font-light mb-1">Transit Wait Time</h3>
          <p className="text-2xl font-bold text-slate-100">15m <span className="text-xs text-slate-500 font-light">Avg</span></p>
        </div>

        <div 
          onClick={() => onNavigateTab('volunteers')}
          className="glassmorphic-card p-5 rounded-2xl hover:border-purple-500/20 cursor-pointer transition"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><HeartPulse size={20} /></span>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">85% Active</span>
          </div>
          <h3 className="text-xs text-slate-400 font-light mb-1">Volunteers Deployed</h3>
          <p className="text-2xl font-bold text-slate-100">45 / 52</p>
        </div>
      </div>

      {/* Main dashboard body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glassmorphic-card p-6 rounded-2xl flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Live Ingress Rates</h3>
            <p className="text-[10px] text-slate-500">Real-time turnstile counts across Gate entries</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={crowdFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#475569" style={{ fontSize: '10px' }} />
                <YAxis stroke="#475569" style={{ fontSize: '10px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                <Area type="monotone" dataKey="GateA" stroke="#f43f5e" fill="rgba(244, 63, 94, 0.1)" />
                <Area type="monotone" dataKey="GateB" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glassmorphic-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2">Gate Queue Analysis</h3>
            <p className="text-[10px] text-slate-500 mb-4">Turnstile wait times (minutes) compared to averages</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waitTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" style={{ fontSize: '10px' }} />
                <YAxis stroke="#475569" style={{ fontSize: '10px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                <Bar dataKey="Current" fill="#38bdf8" />
                <Bar dataKey="Average" fill="#334155" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 2. CROWD VIEW ---
export const CrowdView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="glassmorphic-card p-6 rounded-2xl">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">Ingress Throughput (Gates A & B)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={crowdFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
              <Legend />
              <Area type="monotone" name="Gate A (North)" dataKey="GateA" stroke="#f43f5e" fill="rgba(244, 63, 94, 0.15)" />
              <Area type="monotone" name="Gate B (East)" dataKey="GateB" stroke="#10b981" fill="rgba(16, 185, 129, 0.15)" />
              <Area type="monotone" name="Gate D (West)" dataKey="GateD" stroke="#a855f7" fill="rgba(168, 85, 247, 0.15)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glassmorphic-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">Estimated Entry Queue Lines</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waitTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                <Bar name="Current Queue Wait (mins)" dataKey="Current" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glassmorphic-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">Concourse Occupancy Index</h3>
            <div className="space-y-4 text-xs font-light text-slate-400">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span>North Concourse (Level 1)</span>
                <span className="text-red-450 font-bold">92% Occupancy</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span>East Food Court (Level 1)</span>
                <span className="text-amber-500 font-bold">78% Occupancy</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span>South Exit Corridors</span>
                <span className="text-emerald-400 font-bold">45% Occupancy</span>
              </div>
              <div className="flex items-center justify-between">
                <span>West General Ramps</span>
                <span className="text-emerald-400 font-bold">38% Occupancy</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-900/40 border border-white/5 rounded-xl text-center text-xs text-slate-500">
            Telemetry is updated every 15 seconds from stadium entry sensors.
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 3. INCIDENTS VIEW ---
export const IncidentsView: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  // Form parameters to report new incidents
  const [type, setType] = useState('congestion');
  const [severity, setSeverity] = useState('medium');
  const [sector, setSector] = useState('');
  const [description, setDescription] = useState('');
  const { firebaseUser } = useAuth();
  const { startDictation } = useAccessibility();

  const fetchIncidents = async () => {
    try {
      const token = await firebaseUser?.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/v1/incidents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const payload = await res.json();
        setIncidents(payload.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (firebaseUser) fetchIncidents();
  }, [firebaseUser]);

  const handleCreateIncident = async () => {
    try {
      const token = await firebaseUser?.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/v1/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          severity,
          location: { sector, level: '1', description: 'Operations Log' },
          description,
        }),
      });

      if (res.ok) {
        setOpenModal(false);
        fetchIncidents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveIncident = async (id: string) => {
    try {
      const token = await firebaseUser?.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/v1/incidents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'resolved' }),
      });
      if (res.ok) fetchIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Safety Incident Registry</h2>
          <p className="text-[10px] text-slate-500">Track active alarms, fire hazard containment, and medical dispatches</p>
        </div>
        <button
          onClick={() => setOpenModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-90 rounded-xl text-xs font-semibold uppercase tracking-wider text-white transition"
        >
          ➕ Report Incident
        </button>
      </div>

      <div className="glassmorphic-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/40 text-slate-400 border-b border-white/5">
                <th className="p-4 font-semibold">Incident Type</th>
                <th className="p-4 font-semibold">Severity</th>
                <th className="p-4 font-semibold">Location</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Reported At</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 animate-pulse">Loading incidents...</td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-light">No incidents logged. Stadium is secure.</td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4 font-bold capitalize flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg ${inc.type === 'medical' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {inc.type === 'medical' ? <HeartPulse size={14} /> : <AlertTriangle size={14} />}
                      </span>
                      {inc.type}
                    </td>
                    <td className="p-4 capitalize">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${inc.severity === 'critical' ? 'bg-red-500/10 text-red-500' : inc.severity === 'high' ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="p-4">{inc.location.sector}</td>
                    <td className="p-4 capitalize">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${inc.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[10px] text-slate-500">
                      {new Date(inc.reportedAt).toLocaleTimeString()}
                    </td>
                    <td className="p-4">
                      {inc.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolveIncident(inc.id)}
                          className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-semibold transition"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MUI Dialog for Creating New Incidents */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        PaperProps={{
          style: {
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px',
            color: '#cbd5e1'
          }
        }}
      >
        <DialogTitle className="font-bold text-slate-100">Report Safety Incident</DialogTitle>
        <DialogContent className="space-y-4 pt-4">
          <FormControl fullWidth size="small" margin="dense">
            <InputLabel id="type-select-label" style={{ color: '#64748b' }}>Type</InputLabel>
            <Select
              labelId="type-select-label"
              value={type}
              label="Type"
              onChange={(e) => setType(e.target.value)}
              style={{ color: '#fff', border: '1px solid #334155' }}
            >
              <MenuItem value="medical">Medical emergency</MenuItem>
              <MenuItem value="congestion">Crowd congestion</MenuItem>
              <MenuItem value="fire">Fire hazard</MenuItem>
              <MenuItem value="security">Security threat</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" margin="dense">
            <InputLabel id="severity-select-label" style={{ color: '#64748b' }}>Severity</InputLabel>
            <Select
              labelId="severity-select-label"
              value={severity}
              label="Severity"
              onChange={(e) => setSeverity(e.target.value)}
              style={{ color: '#fff', border: '1px solid #334155' }}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Location (e.g. Sector 104)"
            variant="outlined"
            size="small"
            margin="dense"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            InputLabelProps={{ style: { color: '#64748b' } }}
            inputProps={{ style: { color: '#fff' } }}
          />

          <div className="relative">
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Situation details"
              variant="outlined"
              size="small"
              margin="dense"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              InputLabelProps={{ style: { color: '#64748b' } }}
              inputProps={{ style: { color: '#fff', paddingRight: '40px' } }}
            />
            <button
              type="button"
              onClick={() => {
                startDictation(
                  (text) => setDescription((prev) => (prev ? prev + ' ' + text : text)),
                  (err) => console.error(err)
                );
              }}
              aria-label="Dictate situation details using voice"
              className="absolute right-3 bottom-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg transition border border-white/5"
            >
              🎙️
            </button>
          </div>
        </DialogContent>
        <DialogActions className="p-4 border-t border-white/5">
          <Button onClick={() => setOpenModal(false)} style={{ color: '#94a3b8' }}>Cancel</Button>
          <Button onClick={handleCreateIncident} variant="contained" color="primary">Report</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

// --- 4. TRANSPORTATION VIEW ---
export const TransportationView: React.FC = () => {
  const [routes, setRoutes] = useState<TransportationRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const { firebaseUser } = useAuth();

  const fetchTransit = async () => {
    try {
      const token = await firebaseUser?.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/v1/transportation`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const payload = await res.json();
        setRoutes(payload.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (firebaseUser) fetchTransit();
  }, [firebaseUser]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Transit Coordination</h2>
        <p className="text-[10px] text-slate-500">Monitor shuttle bus wait times and light rail delay schedules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center text-slate-500 p-8 animate-pulse">Loading transportation routes...</div>
        ) : routes.length === 0 ? (
          <div className="col-span-3 text-center text-slate-500 p-8">No transit services registered.</div>
        ) : (
          routes.map((rt) => (
            <div key={rt.id} className="glassmorphic-card p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="p-3 bg-sky-500/10 text-sky-400 rounded-xl"><Bus size={20} /></span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${rt.status === 'normal' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {rt.status}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-200 mb-1">{rt.routeName}</h3>
                <p className="text-[10px] text-slate-500 capitalize mb-4">{rt.type} Route</p>
              </div>

              <div className="space-y-2 text-xs border-t border-white/5 pt-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Frequency</span>
                  <span className="text-slate-200 font-semibold">{rt.currentFrequencyMinutes} mins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Wait Time</span>
                  <span className="text-slate-200 font-semibold">{Math.round(rt.estimatedWaitTimeSeconds / 60)} mins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Capacity Load</span>
                  <span className={`font-semibold capitalize ${rt.crowdLevel === 'full' ? 'text-red-400' : 'text-emerald-400'}`}>{rt.crowdLevel}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- 5. VOLUNTEERS VIEW ---
export const VolunteersView: React.FC = () => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const { firebaseUser } = useAuth();

  const fetchVolunteers = async () => {
    try {
      const token = await firebaseUser?.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/v1/volunteers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const payload = await res.json();
        setVolunteers(payload.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (firebaseUser) fetchVolunteers();
  }, [firebaseUser]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Volunteer Marshal Roster</h2>
        <p className="text-[10px] text-slate-500">Track active personnel sectors, safety certifications, and dispatches</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-4 text-center text-slate-500 p-8 animate-pulse">Loading marshals...</div>
        ) : volunteers.length === 0 ? (
          <div className="col-span-4 text-center text-slate-500 p-8">No volunteers on shift.</div>
        ) : (
          volunteers.map((vol) => (
            <div key={vol.id} className="glassmorphic-card p-5 rounded-2xl text-left">
              <div className="flex justify-between items-start mb-4">
                <span className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><UserIcon size={20} /></span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${vol.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-white/5'}`}>
                  {vol.status}
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-200 mb-1">{vol.name}</h3>
              <p className="text-[10px] text-sky-400 font-semibold mb-3 flex items-center gap-1">
                <MapPin size={10} /> {vol.assignedSector}
              </p>
              
              <div className="text-[10px] border-t border-white/5 pt-3 space-y-2">
                <div className="text-slate-500">Skills directory:</div>
                <div className="flex flex-wrap gap-1">
                  {vol.skills.map((skill, index) => (
                    <span key={index} className="px-1.5 py-0.5 bg-slate-900 border border-white/5 rounded text-[8px] font-medium text-slate-400">
                      {skill}
                    </span>
                  ))}
                </div>
                {vol.currentTaskId && (
                  <div className="border-t border-white/5 pt-2 mt-2">
                    <div className="text-slate-500 text-[9px]">Active task:</div>
                    <div className="text-slate-300 font-medium text-[9px] mt-0.5">{vol.currentTaskId}</div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- 6. SETTINGS VIEW ---
export const SettingsView: React.FC = () => {
  const [alertThreshold, setAlertThreshold] = useState<number>(85);
  const [autoRoute, setAutoRoute] = useState(true);
  const [geminiSimulation, setGeminiSimulation] = useState(true);
  const [temperature, setTemperature] = useState<number>(0.1);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const { firebaseUser } = useAuth();
  const {
    highContrast, toggleHighContrast,
    largeFonts, toggleLargeFonts,
    reducedMotion, toggleReducedMotion,
    ttsEnabled, toggleTtsEnabled,
    voiceCommandsActive, toggleVoiceCommands
  } = useAccessibility();

  // Load configuration from localstorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTemp = localStorage.getItem('gemini-temperature');
      if (savedTemp) {
        setTemperature(parseFloat(savedTemp));
      }
    }
  }, []);

  const handleTempChange = (val: number) => {
    setTemperature(val);
    localStorage.setItem('gemini-temperature', val.toString());
  };

  const handleRunScan = async () => {
    setScanning(true);
    setScanResult(null);
    setScanError(null);
    try {
      const token = await firebaseUser?.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/v1/decision-engine/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          crowdDensity: 'high',
          weather: {
            temperatureCelsius: 28,
            condition: 'sunny',
            humidityPercent: 65
          },
          parking: [
            { lotId: 'Lot A', occupancyPercent: 95 },
            { lotId: 'Lot B', occupancyPercent: 80 }
          ],
          queueLength: [
            { locationId: 'gate-a', name: 'Gate A Turnstile', waitTimeMinutes: 25 },
            { locationId: 'gate-b', name: 'Gate B Turnstile', waitTimeMinutes: 12 }
          ],
          temperature: temperature
        })
      });

      if (res.ok) {
        const payload = await res.json();
        setScanResult(payload.data || payload);
      } else {
        const errorPayload = await res.json().catch(() => ({}));
        setScanError(errorPayload.message || 'Analysis scan failed.');
      }
    } catch (err: any) {
      setScanError(err.message || 'API connection failed.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl text-left">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Operations Threshold System</h2>
        <p className="text-[10px] text-slate-500">Configure parameters for automatic safety reroutes and GenAI simulations</p>
      </div>

      <div className="glassmorphic-card p-6 rounded-2xl space-y-6">
        {/* MUI Slider */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex justify-between">
            <span>Critical Density Alert Threshold</span>
            <span className="text-sky-400">{alertThreshold}% capacity</span>
          </label>
          <Slider
            value={alertThreshold}
            onChange={(_, val) => setAlertThreshold(val as number)}
            aria-label="Critical Density Alert Threshold"
            valueLabelDisplay="auto"
            style={{ color: '#0ea5e9' }}
          />
          <p className="text-[10px] text-slate-500 font-light">
            Trigger automatic sign board updates when turnstile density exceeds this threshold.
          </p>
        </div>

        {/* Model Temperature Slider */}
        <div className="space-y-2 pt-4 border-t border-white/5">
          <label className="text-xs font-semibold text-slate-300 flex justify-between">
            <span>Gemini Model Temperature</span>
            <span className="text-violet-400">{temperature.toFixed(1)}</span>
          </label>
          <Slider
            value={temperature}
            min={0.0}
            max={1.0}
            step={0.1}
            onChange={(_, val) => handleTempChange(val as number)}
            aria-label="Gemini Model Temperature"
            valueLabelDisplay="auto"
            style={{ color: '#8b5cf6' }}
          />
          <p className="text-[10px] text-slate-500 font-light">
            Adjusting creativity bounds. 0.0 is deterministic (recommended for security audits), 1.0 is creative.
          </p>
        </div>

        {/* Interactive Tactical Scan Run Trigger */}
        <div className="pt-4 border-t border-white/5 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Trigger AI Tactical Audit Scan</span>
              <span className="text-[10px] text-slate-500 font-light">Simulate real-time analysis logs run using current telemetry parameters</span>
            </div>
            <button
              onClick={handleRunScan}
              disabled={scanning}
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-violet-600 hover:from-sky-600 hover:to-violet-700 text-white text-[10px] font-bold rounded-xl transition uppercase tracking-wider flex items-center gap-2 shadow shadow-sky-500/10 disabled:opacity-50"
            >
              {scanning ? 'Running...' : 'Run Scan'}
            </button>
          </div>

          {scanResult && (
            <div className="p-4 bg-slate-950/60 border border-white/5 rounded-xl space-y-2 text-left animate-fadeIn">
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider border-b border-white/5 pb-2">
                <span className="text-sky-400">Risk: {scanResult.riskScore * 100}%</span>
                <span className="text-violet-400">Confidence: {scanResult.confidenceScore * 100}%</span>
                <span className="text-amber-400">Priority: {scanResult.priority}</span>
              </div>
              <p className="text-[10px] text-slate-300 font-light leading-relaxed"><strong className="text-slate-400">AI Reasoning:</strong> {scanResult.reasoning}</p>
              <div className="text-[9px] text-emerald-400 font-semibold pt-1">
                <strong className="text-slate-400 font-normal">Recommendations:</strong> {scanResult.recommendations?.join(', ')}
              </div>
            </div>
          )}

          {scanError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded-xl font-light">
              Error: {scanError}
            </div>
          )}
        </div>

        {/* MUI Switch List */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Automatic Rerouting Dispatches</span>
              <span className="text-[10px] text-slate-500 font-light">Enable system tools to edit sign directions on high-risk events</span>
            </div>
            <Switch
              checked={autoRoute}
              onChange={(e) => setAutoRoute(e.target.checked)}
              color="primary"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Active GenAI Evacuation Simulator</span>
              <span className="text-[10px] text-slate-500 font-light">Stream dynamic pathfinding scenarios using Google Gemini models</span>
            </div>
            <Switch
              checked={geminiSimulation}
              onChange={(e) => setGeminiSimulation(e.target.checked)}
              color="primary"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">WCAG 2.2 AA Accessibility Panel</h2>
        <p className="text-[10px] text-slate-500">Enable high contrast layout constraints, custom font adjustments, and voice commands</p>
      </div>

      <div className="glassmorphic-card p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-200 block">High Contrast Interface Mode</span>
            <span className="text-[10px] text-slate-500 font-light">Redefine colors to meet WCAG AA 4.5:1 / 7:1 color contrast parameters</span>
          </div>
          <Switch
            checked={highContrast}
            onChange={toggleHighContrast}
            color="primary"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <span className="text-xs font-semibold text-slate-200 block">Large Accessible Typography</span>
            <span className="text-[10px] text-slate-500 font-light">Increase typography scale on text components for enhanced readability</span>
          </div>
          <Switch
            checked={largeFonts}
            onChange={toggleLargeFonts}
            color="primary"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <span className="text-xs font-semibold text-slate-200 block">Reduce Graphic Motion & Blurs</span>
            <span className="text-[10px] text-slate-500 font-light">Disable visual transitions on tabs and layout loads</span>
          </div>
          <Switch
            checked={reducedMotion}
            onChange={toggleReducedMotion}
            color="primary"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <span className="text-xs font-semibold text-slate-200 block">Text-To-Speech (TTS) Voice Announcements</span>
            <span className="text-[10px] text-slate-500 font-light">Automatically speak incoming safety incident logs or recommendations</span>
          </div>
          <Switch
            checked={ttsEnabled}
            onChange={toggleTtsEnabled}
            color="primary"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <span className="text-xs font-semibold text-slate-200 block">Voice Navigation Controls</span>
            <span className="text-[10px] text-slate-500 font-light">Speak navigation commands like "show map", "show incidents", "show dashboard"</span>
          </div>
          <Switch
            checked={voiceCommandsActive}
            onChange={toggleVoiceCommands}
            color="primary"
          />
        </div>
      </div>
    </div>
  );
};

// --- 7. PROFILE VIEW ---
export const ProfileView: React.FC = () => {
  const { user, firebaseUser } = useAuth();

  return (
    <div className="space-y-6 max-w-xl text-left">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">User Profile Card</h2>
        <p className="text-[10px] text-slate-500">Security profile credentials and active RBAC clearance</p>
      </div>

      <div className="glassmorphic-card p-6 rounded-2xl flex items-center gap-6">
        <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl uppercase shadow-lg shadow-sky-500/10">
          {user?.name?.slice(0, 2) || 'OP'}
        </div>
        
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-200">{user?.name || 'Operator Profile'}</h3>
          <p className="text-xs text-slate-400 font-light">{user?.email || firebaseUser?.email}</p>
          <div className="pt-2 flex gap-2">
            <span className="px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold rounded">
              Clearance: {user?.role || 'Guest'}
            </span>
            <span className="px-2 py-0.5 bg-slate-900 border border-white/5 text-slate-500 text-[10px] rounded">
              Provider: {user?.authProvider || 'Email'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
