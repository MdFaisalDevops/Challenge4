import { Router, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from '../config/firestore';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { executePagedQuery, parseQueryParams } from '../utils/queryHelper';
import { AppError } from '../utils/errors';
import { MedicalReport } from '@crowdmind/shared';
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
 * /api/v1/medical-reports:
 *   get:
 *     summary: Retrieve medical incident reports
 *     tags: [Medical Reports]
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
 *         name: triageLevel
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
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
      const result = await executePagedQuery(db.collection('MedicalReports'), options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/medical-reports:
 *   post:
 *     summary: Create a new medical triage report
 *     tags: [Medical Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - triageLevel
 *               - status
 *               - description
 *             properties:
 *               patientName:
 *                 type: string
 *               triageLevel:
 *                 type: string
 *                 enum: [mild, moderate, severe, critical]
 *               status:
 *                 type: string
 *                 enum: [pending, treated, transferred]
 *               description:
 *                 type: string
 *               incidentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created Report
 */
router.post(
  '/',
  requireAuth,
  requireRole(['OpsDirector', 'SecurityLead', 'FieldAgent']),
  [
    body('triageLevel').isIn(['mild', 'moderate', 'severe', 'critical']),
    body('status').isIn(['pending', 'treated', 'transferred']),
    body('description').isString().notEmpty().trim().escape(),
    body('patientName').optional().isString().trim().escape(),
    body('incidentId').optional().isString().trim().escape(),
  ],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const { triageLevel, status, description, patientName, incidentId } = req.body;
      const reportId = crypto.randomUUID();

      const newReport: MedicalReport = {
        id: reportId,
        incidentId,
        patientName,
        triageLevel,
        status,
        description,
        reportedBy: req.user.uid,
        reportedAt: new Date().toISOString(),
      };

      await db.collection('MedicalReports').doc(reportId).set(newReport);
      res.status(201).json(newReport);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/medical-reports/{id}:
 *   put:
 *     summary: Update patient details or triage status
 *     tags: [Medical Reports]
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
 *                 enum: [pending, treated, transferred]
 *               triageLevel:
 *                 type: string
 *                 enum: [mild, moderate, severe, critical]
 *               patientName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated Medical Report
 */
router.put(
  '/:id',
  requireAuth,
  requireRole(['OpsDirector', 'SecurityLead', 'FieldAgent']),
  [
    param('id').isString().notEmpty(),
    body('status').optional().isIn(['pending', 'treated', 'transferred']),
    body('triageLevel').optional().isIn(['mild', 'moderate', 'severe', 'critical']),
    body('patientName').optional().isString().trim(),
    body('description').optional().isString().trim(),
  ],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const reportRef = db.collection('MedicalReports').doc(id);
      const reportDoc = await reportRef.get();

      if (!reportDoc.exists) {
        throw new AppError('Medical report not found', 404);
      }

      const updates: Record<string, any> = {};
      if (req.body.status) {
        updates.status = req.body.status;
        if (req.body.status === 'treated') {
          updates.treatedAt = new Date().toISOString();
        }
      }
      if (req.body.triageLevel) updates.triageLevel = req.body.triageLevel;
      if (req.body.patientName) updates.patientName = req.body.patientName;
      if (req.body.description) updates.description = req.body.description;

      await reportRef.update(updates);
      const updatedDoc = await reportRef.get();

      res.json(updatedDoc.data());
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/medical-reports/{id}:
 *   delete:
 *     summary: Delete a medical report
 *     tags: [Medical Reports]
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
      const reportRef = db.collection('MedicalReports').doc(id);
      const reportDoc = await reportRef.get();

      if (!reportDoc.exists) {
        throw new AppError('Medical report not found', 404);
      }

      await reportRef.delete();
      res.json({ message: 'Medical report deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
