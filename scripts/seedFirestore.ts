import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const projectId = process.env.FIREBASE_PROJECT_ID || 'crowdmind-ai-dev';
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

if (getApps().length === 0) {
  if (emulatorHost) {
    console.log(`[seeder]: Connecting to Firestore Emulator at ${emulatorHost}`);
    process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
    initializeApp({ projectId });
  } else {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (serviceAccountPath) {
      console.log('[seeder]: Initializing Firestore with Service Account credentials');
      initializeApp({
        credential: cert(serviceAccountPath),
        projectId,
      });
    } else {
      console.warn('[seeder]: No credentials found. Initializing with Application Default Credentials.');
      initializeApp({ projectId });
    }
  }
}

const db = getFirestore();

// Sample Data Lists
const mockUsers = [
  { id: 'usr_ops_1', name: 'Director Sarah Jenkins', email: 'sjenkins@crowdmind.ai', role: 'OpsDirector', createdAt: new Date().toISOString(), authProvider: 'password' },
  { id: 'usr_sec_1', name: 'Chief Mark Davis', email: 'mdavis@crowdmind.ai', role: 'SecurityLead', createdAt: new Date().toISOString(), authProvider: 'google' },
  { id: 'usr_fac_1', name: 'Mgr Alice Smith', email: 'asmith@crowdmind.ai', role: 'FacilitiesMgr', createdAt: new Date().toISOString(), authProvider: 'password' },
  { id: 'usr_field_1', name: 'Officer John Doe', email: 'jdoe@crowdmind.ai', role: 'FieldAgent', createdAt: new Date().toISOString(), authProvider: 'password' },
  { id: 'usr_guest_1', name: 'Guest Agent', email: 'anonymous@crowdmind.ai', role: 'Guest', createdAt: new Date().toISOString(), authProvider: 'anonymous' },
];

const mockCrowdData = [
  { id: 'crd_1', reporterId: 'usr_field_1', nodeId: 'Gate_A_Main_Entry', peopleCount: 420, crowdDensityStatus: 'normal', reporterComment: 'Flowing smoothly, moderate security queues.', reportedAt: new Date().toISOString() },
  { id: 'crd_2', reporterId: 'usr_field_1', nodeId: 'Concourse_B_Food_Court', peopleCount: 890, crowdDensityStatus: 'congested', reporterComment: 'Long lines blocking walking corridors near restrooms.', reportedAt: new Date().toISOString() },
  { id: 'crd_3', reporterId: 'usr_field_1', nodeId: 'Exit_Staircase_12C', peopleCount: 1500, crowdDensityStatus: 'critical', reporterComment: 'Evacuating fans crowding lower staircase, potential bottleneck.', reportedAt: new Date().toISOString() },
];

const mockIncidents = [
  { id: 'inc_1', type: 'congestion', severity: 'high', status: 'active', location: { sector: 'Sector 104', level: 'Level 1', description: 'Corridor 12B Stair Exit' }, reportedBy: 'usr_field_1', reportedAt: new Date().toISOString(), description: 'Staircase blockage due to dynamic sign sync malfunction.' },
  { id: 'inc_2', type: 'medical', severity: 'medium', status: 'investigating', location: { sector: 'Sector 208', level: 'Level 2', description: 'Seat Row E' }, reportedBy: 'usr_field_1', reportedAt: new Date().toISOString(), description: 'Fan reporting severe heat exhaustion and dehydration.' },
  { id: 'inc_3', type: 'fire', severity: 'critical', status: 'resolved', location: { sector: 'Concourse C', level: 'Level 1', description: 'Kitchen Concession Stall 4' }, reportedBy: 'usr_field_1', reportedAt: new Date(Date.now() - 3600000).toISOString(), resolvedAt: new Date().toISOString(), description: 'Small oil fire extinguished by local concession staff.' },
];

const mockRecommendations = [
  { id: 'rec_1', incidentId: 'inc_1', title: 'Redirect Egress Traffic', description: 'Reroute Sector 104 outflow through Corridor 12A bypass gates.', actionableSteps: ['Open Gate 12A manually', 'Push dynamic signs arrow directions left', 'Deploy 2 marshalls to guide flow'], priority: 'high', status: 'approved', generatedBy: 'system-ai', createdAt: new Date().toISOString(), approvedBy: 'usr_ops_1' },
  { id: 'rec_2', incidentId: 'inc_2', title: 'Dispatch Triage Team', description: 'Send nearby Sector 200 medical marshalls with hydration packs.', actionableSteps: ['Locate volunteer at Sector 208', 'Dispatch first aid team', 'Clear path for medical cart'], priority: 'medium', status: 'pending', generatedBy: 'operator', createdAt: new Date().toISOString() },
];

const mockVolunteers = [
  { id: 'vol_1', name: 'Robert Vance', phone: '+1-555-0199', assignedSector: 'Sector 104', status: 'active', skills: ['First Aid', 'Crowd Routing'], createdAt: new Date().toISOString() },
  { id: 'vol_2', name: 'Clara Oswald', phone: '+1-555-0245', assignedSector: 'Concourse B', status: 'break', skills: ['Customer Service', 'Multilingual'], createdAt: new Date().toISOString() },
];

const mockNotifications = [
  { id: 'not_1', title: 'Gate A Queue Congestion Alert', body: 'Attention: Gate A queues are elevated. Please utilize Gate B exits.', targetChannels: ['app-push', 'digital-signage'], targetAudience: 'all', sentBy: 'usr_sec_1', sentAt: new Date().toISOString(), status: 'sent' },
  { id: 'not_2', title: 'Active Emergency Containment Protocol', body: 'All staff report to Sector 104 safety corridors.', targetChannels: ['sms'], targetAudience: 'staff', sentBy: 'usr_ops_1', sentAt: new Date().toISOString(), status: 'sent' },
];

const mockMedicalReports = [
  { id: 'med_1', incidentId: 'inc_2', patientName: 'Jane Smith', triageLevel: 'moderate', status: 'pending', description: 'Heat exhaustion, symptoms of dizziness. Awaiting paramedic check.', reportedBy: 'usr_field_1', reportedAt: new Date().toISOString() },
];

const mockTransportation = [
  { id: 'trn_1', routeName: 'West Parking Shuttle Bus', type: 'shuttle', status: 'normal', currentFrequencyMinutes: 5, estimatedWaitTimeSeconds: 120, crowdLevel: 'moderate', lastUpdatedAt: new Date().toISOString() },
  { id: 'trn_2', routeName: 'Stadium Express Light Rail', type: 'train', status: 'delayed', currentFrequencyMinutes: 15, estimatedWaitTimeSeconds: 900, crowdLevel: 'full', lastUpdatedAt: new Date().toISOString() },
];

const mockAuditLogs = [
  { id: 'aud_1', userId: 'usr_ops_1', userEmail: 'sjenkins@crowdmind.ai', action: 'update', collection: 'users', docId: 'usr_field_1', timestamp: new Date().toISOString(), metadata: { updatedFields: ['role'] } },
  { id: 'aud_2', userId: 'usr_sec_1', userEmail: 'mdavis@crowdmind.ai', action: 'create', collection: 'notifications', docId: 'not_1', timestamp: new Date().toISOString() },
];

// Seeding engine execution
const seedDatabase = async () => {
  console.log('[seeder]: Starting database seeding process...');

  const collections = [
    { name: 'users', data: mockUsers },
    { name: 'CrowdData', data: mockCrowdData },
    { name: 'incidents', data: mockIncidents },
    { name: 'recommendations', data: mockRecommendations },
    { name: 'volunteers', data: mockVolunteers },
    { name: 'notifications', data: mockNotifications },
    { name: 'MedicalReports', data: mockMedicalReports },
    { name: 'transportation', data: mockTransportation },
    { name: 'AuditLogs', data: mockAuditLogs },
  ];

  try {
    for (const col of collections) {
      console.log(`[seeder]: Seeding collection "${col.name}" with ${col.data.length} records...`);
      const colRef = db.collection(col.name);
      
      for (const doc of col.data) {
        await colRef.doc(doc.id).set(doc);
      }
    }
    console.log('[seeder]: Firestore Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[seeder]: Seeding failed with errors:', error);
    process.exit(1);
  }
};

seedDatabase();
