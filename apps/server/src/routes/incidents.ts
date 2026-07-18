import { Router, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from '../config/firestore';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { executePagedQuery, parseQueryParams } from '../utils/queryHelper';
import { AppError } from '../utils/errors';
import { Incident } from '@crowdmind/shared';
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
 * /api/v1/incidents:
 *   get:
 *     summary: Retrieve active or historical incidents
 *     tags: [Incidents]
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
 *         name: severity
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
      const result = await executePagedQuery(db.collection('incidents'), options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/incidents:
 *   post:
 *     summary: Report a new security or safety incident
 *     tags: [Incidents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - severity
 *               - description
 *               - location
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [medical, fire, congestion, structural, security, other]
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               description:
 *                 type: string
 *               location:
 *                 type: object
 *                 required:
 *                   - sector
 *                   - level
 *                   - description
 *                 properties:
 *                   sector:
 *                     type: string
 *                   level:
 *                     type: string
 *                   description:
 *                     type: string
 *     responses:
 *       201:
 *         description: Created Incident
 */
router.post(
  '/',
  requireAuth,
  [
    body('type').isIn(['medical', 'fire', 'congestion', 'structural', 'security', 'other']),
    body('severity').isIn(['low', 'medium', 'high', 'critical']),
    body('description').isString().notEmpty().trim().escape(),
    body('location').isObject(),
    body('location.sector').isString().notEmpty().trim().escape(),
    body('location.level').isString().notEmpty().trim().escape(),
    body('location.description').isString().notEmpty().trim().escape(),
  ],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const { type, severity, description, location } = req.body;
      const incidentId = crypto.randomUUID();

      const newIncident: Incident = {
        id: incidentId,
        type,
        severity,
        status: 'reported',
        location: {
          sector: location.sector,
          level: location.level,
          description: location.description,
        },
        reportedBy: req.user.uid,
        reportedAt: new Date().toISOString(),
        description,
      };

      await db.collection('incidents').doc(incidentId).set(newIncident);
      res.status(201).json(newIncident);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/incidents/{id}:
 *   get:
 *     summary: Fetch a specific incident log by ID
 *     tags: [Incidents]
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
      const incidentDoc = await db.collection('incidents').doc(id).get();

      if (!incidentDoc.exists) {
        throw new AppError('Incident not found', 404);
      }

      res.json(incidentDoc.data());
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/incidents/{id}:
 *   put:
 *     summary: Update incident status or details
 *     tags: [Incidents]
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
 *                 enum: [reported, investigating, active, resolved]
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *     responses:
 *       200:
 *         description: Updated Incident
 */
router.put(
  '/:id',
  requireAuth,
  [
    param('id').isString().notEmpty(),
    body('status').optional().isIn(['reported', 'investigating', 'active', 'resolved']),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  ],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const callerRole = req.user?.role;
      const callerUid = req.user?.uid;

      const incidentRef = db.collection('incidents').doc(id);
      const incidentDoc = await incidentRef.get();

      if (!incidentDoc.exists) {
        throw new AppError('Incident not found', 404);
      }

      const incidentData = incidentDoc.data() as Incident;

      // Allow changes only if caller is OpsDirector/SecurityLead OR the original reporter
      if (
        callerRole !== 'OpsDirector' &&
        callerRole !== 'SecurityLead' &&
        callerUid !== incidentData.reportedBy
      ) {
        throw new AppError('Forbidden: Unauthorized to update this incident', 403);
      }

      const updates: Record<string, any> = {};
      if (req.body.severity) updates.severity = req.body.severity;
      if (req.body.status) {
        updates.status = req.body.status;
        if (req.body.status === 'resolved') {
          updates.resolvedAt = new Date().toISOString();
        }
      }

      await incidentRef.update(updates);
      const updatedDoc = await incidentRef.get();

      res.json(updatedDoc.data());
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/incidents/{id}:
 *   delete:
 *     summary: Delete an incident entry
 *     tags: [Incidents]
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
      const incidentRef = db.collection('incidents').doc(id);
      const incidentDoc = await incidentRef.get();

      if (!incidentDoc.exists) {
        throw new AppError('Incident not found', 404);
      }

      await incidentRef.delete();
      res.json({ message: 'Incident deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
