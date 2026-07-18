import { Router, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from '../config/firestore';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { executePagedQuery, parseQueryParams } from '../utils/queryHelper';
import { AppError } from '../utils/errors';
import { Volunteer } from '@crowdmind/shared';
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
 * /api/v1/volunteers:
 *   get:
 *     summary: Retrieve volunteer roster
 *     tags: [Volunteers]
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
 *         name: assignedSector
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
      const result = await executePagedQuery(db.collection('volunteers'), options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/volunteers:
 *   post:
 *     summary: Enroll a new volunteer marshall
 *     tags: [Volunteers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - assignedSector
 *               - status
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               assignedSector:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, break, off-duty]
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Created Volunteer
 */
router.post(
  '/',
  requireAuth,
  requireRole(['OpsDirector', 'SecurityLead']),
  [
    body('name').isString().notEmpty().trim(),
    body('phone').isString().notEmpty().trim(),
    body('assignedSector').isString().notEmpty().trim(),
    body('status').isIn(['active', 'break', 'off-duty']),
    body('skills').isArray(),
  ],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { name, phone, assignedSector, status, skills } = req.body;
      const volunteerId = crypto.randomUUID();

      const newVolunteer: Volunteer = {
        id: volunteerId,
        name,
        phone,
        assignedSector,
        status,
        skills,
        createdAt: new Date().toISOString(),
      };

      await db.collection('volunteers').doc(volunteerId).set(newVolunteer);
      res.status(201).json(newVolunteer);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/volunteers/{id}:
 *   put:
 *     summary: Update volunteer shift details or task assignment
 *     tags: [Volunteers]
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
 *                 enum: [active, break, off-duty]
 *               assignedSector:
 *                 type: string
 *               currentTaskId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated Volunteer
 */
router.put(
  '/:id',
  requireAuth,
  requireRole(['OpsDirector', 'SecurityLead']),
  [
    param('id').isString().notEmpty(),
    body('status').optional().isIn(['active', 'break', 'off-duty']),
    body('assignedSector').optional().isString().notEmpty().trim(),
    body('currentTaskId').optional().isString().trim(),
  ],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const volunteerRef = db.collection('volunteers').doc(id);
      const volunteerDoc = await volunteerRef.get();

      if (!volunteerDoc.exists) {
        throw new AppError('Volunteer not found', 404);
      }

      const updates: Record<string, any> = {};
      if (req.body.status) updates.status = req.body.status;
      if (req.body.assignedSector) updates.assignedSector = req.body.assignedSector;
      if (req.body.currentTaskId !== undefined) updates.currentTaskId = req.body.currentTaskId;

      await volunteerRef.update(updates);
      const updatedDoc = await volunteerRef.get();

      res.json(updatedDoc.data());
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/volunteers/{id}:
 *   delete:
 *     summary: Dismiss a volunteer from the active registry
 *     tags: [Volunteers]
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
      const volunteerRef = db.collection('volunteers').doc(id);
      const volunteerDoc = await volunteerRef.get();

      if (!volunteerDoc.exists) {
        throw new AppError('Volunteer not found', 404);
      }

      await volunteerRef.delete();
      res.json({ message: 'Volunteer dismissed and removed from system successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
