import { Router, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from '../config/firestore';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { executePagedQuery, parseQueryParams } from '../utils/queryHelper';
import { AppError } from '../utils/errors';
import { TransportationRoute } from '@crowdmind/shared';
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
 * /api/v1/transportation:
 *   get:
 *     summary: Get stadium transport status
 *     tags: [Transportation]
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
 *         name: crowdLevel
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
      const result = await executePagedQuery(db.collection('transportation'), options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/transportation:
 *   post:
 *     summary: Add a new transportation route log
 *     tags: [Transportation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - routeName
 *               - type
 *               - status
 *               - currentFrequencyMinutes
 *               - estimatedWaitTimeSeconds
 *               - crowdLevel
 *             properties:
 *               routeName:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [bus, train, shuttle, walkway]
 *               status:
 *                 type: string
 *                 enum: [normal, delayed, suspended]
 *               currentFrequencyMinutes:
 *                 type: integer
 *               estimatedWaitTimeSeconds:
 *                 type: integer
 *               crowdLevel:
 *                 type: string
 *                 enum: [empty, moderate, busy, full]
 *     responses:
 *       201:
 *         description: Created Transportation Route
 */
router.post(
  '/',
  requireAuth,
  requireRole(['OpsDirector', 'FacilitiesMgr']),
  [
    body('routeName').isString().notEmpty().trim(),
    body('type').isIn(['bus', 'train', 'shuttle', 'walkway']),
    body('status').isIn(['normal', 'delayed', 'suspended']),
    body('currentFrequencyMinutes').isInt({ min: 0 }),
    body('estimatedWaitTimeSeconds').isInt({ min: 0 }),
    body('crowdLevel').isIn(['empty', 'moderate', 'busy', 'full']),
  ],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { routeName, type, status, currentFrequencyMinutes, estimatedWaitTimeSeconds, crowdLevel } = req.body;
      const transportId = crypto.randomUUID();

      const newRoute: TransportationRoute = {
        id: transportId,
        routeName,
        type,
        status,
        currentFrequencyMinutes,
        estimatedWaitTimeSeconds,
        crowdLevel,
        lastUpdatedAt: new Date().toISOString(),
      };

      await db.collection('transportation').doc(transportId).set(newRoute);
      res.status(201).json(newRoute);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/transportation/{id}:
 *   put:
 *     summary: Update wait times or status of a transport route
 *     tags: [Transportation]
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [normal, delayed, suspended]
 *               currentFrequencyMinutes:
 *                 type: integer
 *               estimatedWaitTimeSeconds:
 *                 type: integer
 *               crowdLevel:
 *                 type: string
 *                 enum: [empty, moderate, busy, full]
 *     responses:
 *       200:
 *         description: Updated Route
 */
router.put(
  '/:id',
  requireAuth,
  requireRole(['OpsDirector', 'FacilitiesMgr']),
  [
    param('id').isString().notEmpty(),
    body('status').optional().isIn(['normal', 'delayed', 'suspended']),
    body('currentFrequencyMinutes').optional().isInt({ min: 0 }),
    body('estimatedWaitTimeSeconds').optional().isInt({ min: 0 }),
    body('crowdLevel').optional().isIn(['empty', 'moderate', 'busy', 'full']),
  ],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const transportRef = db.collection('transportation').doc(id);
      const transportDoc = await transportRef.get();

      if (!transportDoc.exists) {
        throw new AppError('Transportation route not found', 404);
      }

      const updates: Record<string, any> = {
        lastUpdatedAt: new Date().toISOString(),
      };
      if (req.body.status) updates.status = req.body.status;
      if (req.body.currentFrequencyMinutes !== undefined) {
        updates.currentFrequencyMinutes = req.body.currentFrequencyMinutes;
      }
      if (req.body.estimatedWaitTimeSeconds !== undefined) {
        updates.estimatedWaitTimeSeconds = req.body.estimatedWaitTimeSeconds;
      }
      if (req.body.crowdLevel) updates.crowdLevel = req.body.crowdLevel;

      await transportRef.update(updates);
      const updatedDoc = await transportRef.get();

      res.json(updatedDoc.data());
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/transportation/{id}:
 *   delete:
 *     summary: Delete a transportation route entry
 *     tags: [Transportation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success message
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole(['OpsDirector']),
  [param('id').isString().notEmpty()],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const transportRef = db.collection('transportation').doc(id);
      const transportDoc = await transportRef.get();

      if (!transportDoc.exists) {
        throw new AppError('Transportation route not found', 404);
      }

      await transportRef.delete();
      res.json({ message: 'Transportation route deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
