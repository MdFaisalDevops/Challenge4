import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase client
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Configure Auth Emulator redirect if in development
if (process.env.NODE_ENV === 'development') {
  const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  if (emulatorHost) {
    const host = emulatorHost.split(':')[0] || 'localhost';
    const port = parseInt(emulatorHost.split(':')[1] || '9099', 10);
    console.log(`[firebase-client]: Connecting to Firebase Auth Emulator at ${host}:${port}`);
    connectAuthEmulator(auth, `http://${host}:${port}`, { disableWarnings: true });
  }
}

export { app, auth };
