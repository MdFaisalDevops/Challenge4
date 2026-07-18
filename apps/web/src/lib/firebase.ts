import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// True when running in the browser AND all required env vars are present
export const isFirebaseConfigured =
  typeof window !== 'undefined' &&
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.appId);

let app: FirebaseApp;
let auth: Auth;

if (isFirebaseConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);

  if (process.env.NODE_ENV === 'development') {
    const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
    if (emulatorHost) {
      const host = emulatorHost.split(':')[0] || 'localhost';
      const port = parseInt(emulatorHost.split(':')[1] || '9099', 10);
      console.log(`[firebase-client]: Connecting to Firebase Auth Emulator at ${host}:${port}`);
      connectAuthEmulator(auth, `http://${host}:${port}`, { disableWarnings: true });
    }
  }
} else {
  // Server-side or missing env vars — safe stubs, never called at runtime
  app = {} as FirebaseApp;
  auth = {} as Auth;
}

export { app, auth };
