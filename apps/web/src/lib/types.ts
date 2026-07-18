// Inlined shared types for Vercel standalone deployment
// (replaces @crowdmind/shared workspace package)

export type UserRole = 'OpsDirector' | 'SecurityLead' | 'FacilitiesMgr' | 'FieldAgent' | 'Guest';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  authProvider?: 'password' | 'google' | 'anonymous';
}

export interface TelemetryRecord {
  timestamp: string;
  nodeId: string;
  peopleCount: number;
  flowRate: number;
  averageVelocityMps: number;
}

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'reported' | 'investigating' | 'active' | 'resolved';
export type IncidentType = 'medical' | 'fire' | 'congestion' | 'structural' | 'security' | 'other';

export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: {
    sector: string;
    level: string;
    description: string;
    coordinates?: { x: number; y: number; z: number };
  };
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  description: string;
  playbookDraftId?: string;
}

export interface CrowdData {
  id: string;
  reporterId: string;
  nodeId: string;
  peopleCount: number;
  crowdDensityStatus: 'low' | 'normal' | 'congested' | 'critical';
  reporterComment?: string;
  reportedAt: string;
}

export interface Recommendation {
  id: string;
  incidentId?: string;
  title: string;
  description: string;
  actionableSteps: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'dismissed';
  generatedBy: 'system-ai' | 'operator';
  createdAt: string;
  approvedBy?: string;
}

export interface TransportationRoute {
  id: string;
  routeName: string;
  type: 'bus' | 'train' | 'shuttle' | 'walkway';
  status: 'normal' | 'delayed' | 'suspended';
  currentFrequencyMinutes: number;
  estimatedWaitTimeSeconds: number;
  crowdLevel: 'empty' | 'moderate' | 'busy' | 'full';
  lastUpdatedAt: string;
}

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  assignedSector: string;
  status: 'active' | 'break' | 'off-duty';
  skills: string[];
  currentTaskId?: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  targetChannels: ('sms' | 'app-push' | 'digital-signage')[];
  targetAudience: 'all' | 'staff' | 'sector-specific';
  targetSector?: string;
  sentBy: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'scheduled';
}

export interface MedicalReport {
  id: string;
  incidentId?: string;
  patientName?: string;
  triageLevel: 'mild' | 'moderate' | 'severe' | 'critical';
  status: 'pending' | 'treated' | 'transferred';
  description: string;
  reportedBy: string;
  reportedAt: string;
  treatedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: 'create' | 'update' | 'delete' | 'other';
  collection: string;
  docId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DecisionEngineInput {
  crowdDensity: string;
  weather: {
    temperatureCelsius: number;
    condition: string;
    humidityPercent: number;
  };
  parking: { lotId: string; occupancyPercent: number }[];
  queueLength: { locationId: string; name: string; waitTimeMinutes: number }[];
}

export interface DecisionEngineOutput {
  recommendations: string[];
  confidenceScore: number;
  riskScore: number;
  reasoning: string;
  expectedImpact: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}
