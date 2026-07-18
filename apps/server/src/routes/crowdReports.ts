import { Router, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from '../config/firestore';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { executePagedQuery, parseQueryParams } from '../utils/queryHelper';
import { AppError } from '../utils/errors';
import { CrowdData } from '@crowdmind/shared';
import crypto from 'crypto';

const router = Router();

const validateResult = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

/**
 * @openapi
 * /api/v1/crowd-reports:
 *   get:
 *     summary: List all crowd telemetry data records
 *     tags: [Crowd Reports]
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
 *         name: crowdDensityStatus
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const options = parseQueryParams(req.query);
      const result = await executePagedQuery(db.collection('CrowdData'), options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/crowd-reports:
 *   post:
 *     summary: Submit a new crowd data log
 *     tags: [Crowd Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nodeId
 *               - peopleCount
 *               - crowdDensityStatus
 *             properties:
 *               nodeId:
 *                 type: string
 *               peopleCount:
 *                 type: integer
 *               crowdDensityStatus:
 *                 type: string
 *                 enum: [low, normal, congested, critical]
 *               reporterComment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created Report
 */
router.post(
  '/',
  requireAuth,
  [
    body('nodeId').isString().notEmpty().trim().escape(),
    body('peopleCount').isInt({ min: 0 }),
    body('crowdDensityStatus').isIn(['low', 'normal', 'congested', 'critical']),
    body('reporterComment').optional().isString().trim().escape(),
  ],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { nodeId, peopleCount, crowdDensityStatus, reporterComment } = req.body;
      const reportId = crypto.randomUUID();

      const newReport: CrowdData = {
        id: reportId,
        reporterId: req.user.uid,
        nodeId,
        peopleCount,
        crowdDensityStatus,
        reporterComment: reporterComment || '',
        reportedAt: new Date().toISOString(),
      };

      await db.collection('CrowdData').doc(reportId).set(newReport);

      res.status(201).json(newReport);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/crowd-reports/{id}:
 *   get:
 *     summary: Fetch a specific crowd data record by ID
 *     tags: [Crowd Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not Found
 */
router.get(
  '/:id',
  requireAuth,
  [param('id').isString().notEmpty()],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const reportDoc = await db.collection('CrowdData').doc(id).get();

      if (!reportDoc.exists) {
        throw new AppError('Crowd report record not found', 404);
      }

      res.json(reportDoc.data());
    } catch (error) {
      next(error);
    }
  }
);

export default router;
