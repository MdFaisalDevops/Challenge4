import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID || 'crowdmind-ai-dev';

// Configure Firebase Admin SDK
if (getApps().length === 0) {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

  if (emulatorHost) {
    // In emulator mode, project ID is sufficient, no key needed
    console.log(`[firestore]: Connecting to Firestore Emulator at ${emulatorHost}`);
    process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
    initializeApp({ projectId });
  } else {
    // In production mode, look for service account configuration
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (serviceAccountPath) {
      console.log('[firestore]: Initializing Firestore with Service Account credentials');
      initializeApp({
        credential: cert(serviceAccountPath),
        projectId,
      });
    } else {
      console.warn(
        '[firestore]: GOOGLE_APPLICATION_CREDENTIALS not specified. Falling back to Application Default Credentials.'
      );
      initializeApp({ projectId });
    }
  }
}

export const db = getFirestore();
try {
  db.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  console.log('[firestore]: settings already set, skipping re-initialization.');
}
