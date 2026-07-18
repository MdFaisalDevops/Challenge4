import { Router, Response, NextFunction } from 'express';
import { db } from '../config/firestore';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { executePagedQuery, parseQueryParams } from '../utils/queryHelper';

const router = Router();

/**
 * @openapi
 * /api/v1/audit-logs:
 *   get:
 *     summary: Retrieve administrative audit logs
 *     tags: [Audit Logs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  '/',
  requireAuth,
  requireRole(['OpsDirector']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const options = parseQueryParams(req.query);
      const result = await executePagedQuery(db.collection('AuditLogs'), options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
