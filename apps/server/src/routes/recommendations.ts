import { Router, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from '../config/firestore';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { executePagedQuery, parseQueryParams } from '../utils/queryHelper';
import { AppError } from '../utils/errors';
import { Recommendation } from '@crowdmind/shared';
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
 * /api/v1/recommendations:
 *   get:
 *     summary: Retrieve tactical recommendations
 *     tags: [Recommendations]
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
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
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
      const result = await executePagedQuery(db.collection('recommendations'), options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/recommendations:
 *   post:
 *     summary: Submit a new AI or Operator recommendation
 *     tags: [Recommendations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - actionableSteps
 *               - priority
 *             properties:
 *               incidentId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               actionableSteps:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               generatedBy:
 *                 type: string
 *                 enum: [system-ai, operator]
 *     responses:
 *       201:
 *         description: Created Recommendation
 */
router.post(
  '/',
  requireAuth,
  [
    body('title').isString().notEmpty().trim(),
    body('description').isString().notEmpty().trim(),
    body('actionableSteps').isArray().notEmpty(),
    body('priority').isIn(['low', 'medium', 'high', 'critical']),
    body('generatedBy').optional().isIn(['system-ai', 'operator']),
    body('incidentId').optional().isString().trim(),
  ],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { title, description, actionableSteps, priority, generatedBy, incidentId } = req.body;
      const recId = crypto.randomUUID();

      const newRec: Recommendation = {
        id: recId,
        incidentId,
        title,
        description,
        actionableSteps,
        priority,
        status: 'pending',
        generatedBy: generatedBy || 'operator',
        createdAt: new Date().toISOString(),
      };

      await db.collection('recommendations').doc(recId).set(newRec);
      res.status(201).json(newRec);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/recommendations/{id}:
 *   get:
 *     summary: Fetch a specific recommendation detail
 *     tags: [Recommendations]
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
      const recDoc = await db.collection('recommendations').doc(id).get();

      if (!recDoc.exists) {
        throw new AppError('Recommendation not found', 404);
      }

      res.json(recDoc.data());
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/recommendations/{id}:
 *   put:
 *     summary: Approve or dismiss a recommendation
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, dismissed]
 *     responses:
 *       200:
 *         description: Updated Recommendation
 */
router.put(
  '/:id',
  requireAuth,
  requireRole(['OpsDirector', 'SecurityLead']),
  [
    param('id').isString().notEmpty(),
    body('status').isIn(['pending', 'approved', 'dismissed']),
  ],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const callerUid = req.user?.uid;

      const recRef = db.collection('recommendations').doc(id);
      const recDoc = await recRef.get();

      if (!recDoc.exists) {
        throw new AppError('Recommendation not found', 404);
      }

      const updates: Record<string, any> = { status };
      if (status === 'approved') {
        updates.approvedBy = callerUid;
      }

      await recRef.update(updates);
      const updatedDoc = await recRef.get();

      res.json(updatedDoc.data());
    } catch (error) {
      next(error);
    }
  }
);

export default router;
