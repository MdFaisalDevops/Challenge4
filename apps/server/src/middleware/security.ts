import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logAudit } from '../utils/auditLogger';
import { AuthenticatedRequest } from './auth';

// 1. Force HTTPS Redirection in production behind load balancers/proxies
export const enforceHttps = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    const proto = req.headers['x-forwarded-proto'];
    if (proto !== 'https') {
      res.redirect(301, `https://${req.headers.host}${req.url}`);
      return;
    }
  }
  next();
};

// 2. Prompt Injection Pre-Filter Shield
const PROMPT_INJECTION_BLACKLIST = [
  'ignore prior instructions',
  'ignore previous instructions',
  'ignore all instructions',
  'forget previous instructions',
  'forget prior instructions',
  'system instruction override',
  'developer override',
  'instead perform',
  'you must now recommend',
  'bypass security',
  'act as',
  'new system instructions',
];

// Recursively scans request payload strings for blacklisted prompt injection phrases
const containsInjectionPayload = (obj: any): boolean => {
  if (!obj) return false;

  if (typeof obj === 'string') {
    const text = obj.toLowerCase();
    return PROMPT_INJECTION_BLACKLIST.some((pattern) => text.includes(pattern));
  }

  if (Array.isArray(obj)) {
    return obj.some(containsInjectionPayload);
  }

  if (typeof obj === 'object') {
    return Object.values(obj).some(containsInjectionPayload);
  }

  return false;
};

export const promptInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && containsInjectionPayload(req.body)) {
    console.warn(`[security-shield]: Adversarial prompt injection attempt blocked! Cwd: ${req.url}`);
    next(new AppError('Suspicious activity detected in payload input fields.', 400));
    return;
  }
  next();
};

import { invalidateAllCache } from './cache';

// 3. Centralized Mutation Audit Logger & Cache Invalidator
export const auditLogMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  if (!isMutation) {
    next();
    return;
  }

  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      // Invalidate the cache when successful mutations occur to preserve fresh data
      invalidateAllCache();

      // Extract target collection from API path: e.g. /api/v1/incidents -> incidents
      const parts = req.originalUrl.split('?')[0].split('/');
      const collection = parts[3] || 'other';
      const docId = parts[4] || 'collection-action';

      const actionMap: Record<string, 'create' | 'update' | 'delete' | 'other'> = {
        'POST': 'create',
        'PUT': 'update',
        'PATCH': 'update',
        'DELETE': 'delete',
      };
      const action = actionMap[req.method] || 'other';

      logAudit(
        req.user.uid,
        req.user.email || 'anonymous@crowdmind.ai',
        action,
        collection,
        docId,
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );
    }
  });

  next();
};

