'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onIdTokenChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  User as FirebaseUser,
} from 'firebase/auth';
import { User, UserRole } from '../lib/types';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAnonymously: () => Promise<void>;
  signUp: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or provision user profile from Express backend
  const fetchProfile = async (fbUser: FirebaseUser) => {
    try {
      const token = await fbUser.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const profileData = await res.json();
        setUser(profileData);
      } else {
        // If the profile does not exist yet (e.g. Google/Anonymous sign-in on first load),
        // we call /register to auto-provision a profile.
        console.log('[AuthContext]: Profile missing, provisioning profile on server...');
        const isAnonymous = fbUser.isAnonymous;
        const defaultRole: UserRole = isAnonymous ? 'Guest' : 'FieldAgent';
        const defaultName = isAnonymous ? 'Guest Agent' : (fbUser.displayName || 'Google Agent');

        const registerRes = await fetch(`${apiUrl}/api/v1/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: defaultName,
            role: defaultRole,
          }),
        });

        if (registerRes.ok) {
          const profileData = await registerRes.json();
          setUser(profileData);
        } else {
          throw new Error('Auto-provisioning failed');
        }
      }
    } catch (err) {
      console.error('[AuthContext]: Error fetching profile:', err);
      // Fallback local state if API is not responding
      setUser({
        id: fbUser.uid,
        email: fbUser.email || (fbUser.isAnonymous ? 'anonymous@crowdmind.ai' : 'guest@crowdmind.ai'),
        name: fbUser.displayName || (fbUser.isAnonymous ? 'Guest Agent' : 'Google Agent'),
        role: fbUser.isAnonymous ? 'Guest' : 'FieldAgent',
        createdAt: new Date().toISOString(),
        authProvider: fbUser.isAnonymous ? 'anonymous' : (fbUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'password'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // onIdTokenChanged fires on sign-in/sign-out and background token rotations (session management)
    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await fetchProfile(fbUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const loginAnonymously = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signUp = async (email: string, pass: string, name: string, role: UserRole) => {
    setLoading(true);
    try {
      // 1. Create credential in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;
      const token = await fbUser.getIdToken();

      // 2. Provision matching profile record on our Express backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, role }),
      });

      if (!res.ok) {
        throw new Error('Failed to provision user profile on server database');
      }

      const profile = await res.json();
      setUser(profile);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        login,
        loginWithGoogle,
        loginAnonymously,
        signUp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
