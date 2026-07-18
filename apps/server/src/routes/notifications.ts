import { Router, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from '../config/firestore';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { executePagedQuery, parseQueryParams } from '../utils/queryHelper';
import { AppError } from '../utils/errors';
import { NotificationRecord } from '@crowdmind/shared';
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
 * /api/v1/notifications:
 *   get:
 *     summary: Get historical list of notifications and announcements
 *     tags: [Notifications]
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
 *         name: targetAudience
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
      const result = await executePagedQuery(db.collection('notifications'), options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/notifications:
 *   post:
 *     summary: Broadcast a new announcement or dynamic signage instruction
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *               - targetChannels
 *               - targetAudience
 *             properties:
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               targetChannels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [sms, app-push, digital-signage]
 *               targetAudience:
 *                 type: string
 *                 enum: [all, staff, sector-specific]
 *               targetSector:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created Notification
 */
router.post(
  '/',
  requireAuth,
  requireRole(['OpsDirector', 'SecurityLead']),
  [
    body('title').isString().notEmpty().trim(),
    body('body').isString().notEmpty().trim(),
    body('targetChannels').isArray().notEmpty(),
    body('targetChannels.*').isIn(['sms', 'app-push', 'digital-signage']),
    body('targetAudience').isIn(['all', 'staff', 'sector-specific']),
    body('targetSector').optional().isString().trim(),
  ],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const { title, body: msgBody, targetChannels, targetAudience, targetSector } = req.body;
      const notifyId = crypto.randomUUID();

      const newNotification: NotificationRecord = {
        id: notifyId,
        title,
        body: msgBody,
        targetChannels,
        targetAudience,
        targetSector,
        sentBy: req.user.uid,
        sentAt: new Date().toISOString(),
        status: 'sent',
      };

      await db.collection('notifications').doc(notifyId).set(newNotification);

      res.status(201).json(newNotification);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Remove a notification record from history
 *     tags: [Notifications]
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
      const notifyRef = db.collection('notifications').doc(id);
      const notifyDoc = await notifyRef.get();

      if (!notifyDoc.exists) {
        throw new AppError('Notification not found', 404);
      }

      await notifyRef.delete();
      res.json({ message: 'Notification log deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
