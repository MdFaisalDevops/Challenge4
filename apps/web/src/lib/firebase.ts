import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard: Firebase Client SDK only works in the browser.
// Accessing it during SSR/static generation at build time causes crashes.
let app: FirebaseApp;
let auth: Auth;

if (typeof window !== 'undefined') {
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
  // Server-side stub — never actually called at runtime, only satisfies module resolution
  app = {} as FirebaseApp;
  auth = {} as Auth;
}

export { app, auth };
