import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firestore';
import { User, UserRole } from '@crowdmind/shared';

const router = Router();

// Retrieve currently authenticated user profile
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const uid = req.user.uid;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      res.status(404).json({ error: 'User profile not found' });
      return;
    }

    res.json(userDoc.data());
  } catch (error) {
    console.error('[auth-router]: Failed to fetch profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Register / provision a new user profile document
router.post('/register', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const uid = req.user.uid;

  try {
    // 1. Check if profile already exists to prevent duplicate writes and overwrites
    const existingDoc = await db.collection('users').doc(uid).get();
    if (existingDoc.exists) {
      console.log(`[auth-router]: Returning existing profile for user ${uid}`);
      res.status(200).json(existingDoc.data());
      return;
    }

    // 2. Identify signup authentication provider
    const signInProvider = req.user.firebase.sign_in_provider;
    let authProvider: 'password' | 'google' | 'anonymous' = 'password';
    if (signInProvider === 'anonymous') {
      authProvider = 'anonymous';
    } else if (signInProvider === 'google.com') {
      authProvider = 'google';
    }

    // 3. Extract parameters and configure defaults based on provider
    let { name, role } = req.body;

    if (authProvider === 'anonymous') {
      name = name || 'Guest Agent';
      role = role || 'Guest';
    } else if (authProvider === 'google') {
      name = name || req.user.name || 'Google Agent';
      role = role || 'FieldAgent';
    } else {
      // Standard email/password flow requires credentials
      name = name || 'Stadium Agent';
      role = role || 'FieldAgent';
    }

    const validRoles: UserRole[] = ['OpsDirector', 'SecurityLead', 'FacilitiesMgr', 'FieldAgent', 'Guest'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: `Invalid operational role: ${role}` });
      return;
    }

    const email = req.user.email || (authProvider === 'anonymous' ? 'anonymous@crowdmind.ai' : '');

    const newUser: User = {
      id: uid,
      name,
      email,
      role,
      authProvider,
      createdAt: new Date().toISOString(),
    };

    // Save profile to Firestore
    await db.collection('users').doc(uid).set(newUser);
    console.log(`[auth-router]: Provisioned new profile for ${email || uid} as ${role} (${authProvider})`);

    res.status(201).json(newUser);
  } catch (error) {
    console.error('[auth-router]: Profile provisioning failed:', error);
    res.status(500).json({ error: 'Internal Server Error provisioning profile' });
  }
});

export default router;
