import { Response, NextFunction, Request } from 'express';
import { auth } from 'firebase-admin';
import { db } from '../config/firestore';
import { UserRole } from '@crowdmind/shared';

export interface AuthenticatedRequest extends Request {
  user?: auth.DecodedIdToken & {
    role?: UserRole;
  };
}

// Middleware to authenticate Firebase ID Tokens
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Pass checkRevoked = true to inspect if token has been revoked (production safety)
    const decodedToken = await auth().verifyIdToken(token, true);
    req.user = decodedToken as AuthenticatedRequest['user'];
    next();
  } catch (error: any) {
    console.error('[auth-middleware]: Token verification failed:', error);
    
    if (error.code === 'auth/id-token-expired') {
      res.status(401).json({ error: 'Unauthorized: Authentication token has expired', code: 'TOKEN_EXPIRED' });
    } else if (error.code === 'auth/id-token-revoked') {
      res.status(401).json({ error: 'Unauthorized: Authentication token was revoked', code: 'TOKEN_REVOKED' });
    } else {
      res.status(401).json({ error: 'Unauthorized: Invalid authentication token', code: 'TOKEN_INVALID' });
    }
    return;
  }
};

// Middleware to restrict access by Role (requires requireAuth to be run first)
export const requireRole = (allowedRoles: UserRole[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: User not authenticated' });
      return;
    }

    try {
      const uid = req.user.uid;
      const userDoc = await db.collection('users').doc(uid).get();

      if (!userDoc.exists) {
        res.status(403).json({ error: 'Forbidden: Operational profile not found in database' });
        return;
      }

      const userData = userDoc.data();
      const userRole = userData?.role as UserRole;

      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({ error: `Forbidden: Restricted to operational roles: ${allowedRoles.join(', ')}` });
        return;
      }

      // Append verified role to req.user for use in downstream request handlers
      req.user.role = userRole;
      next();
    } catch (error) {
      console.error('[auth-middleware]: Role check failed:', error);
      res.status(500).json({ error: 'Internal Server Error validating operational permissions' });
      return;
    }
  };
};
