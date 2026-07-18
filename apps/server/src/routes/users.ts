import { Router, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from '../config/firestore';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { executePagedQuery, parseQueryParams } from '../utils/queryHelper';
import { AppError } from '../utils/errors';
import { UserRole } from '@crowdmind/shared';

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
 * /api/v1/users:
 *   get:
 *     summary: Retrieve a paginated list of operational users
 *     tags: [Users]
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
 *         name: role
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  '/',
  requireAuth,
  requireRole(['OpsDirector', 'SecurityLead']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const options = parseQueryParams(req.query);
      const result = await executePagedQuery(db.collection('users'), options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get a user profile by ID
 *     tags: [Users]
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
      const userDoc = await db.collection('users').doc(id).get();

      if (!userDoc.exists) {
        throw new AppError('User profile not found', 404);
      }

      res.json(userDoc.data());
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update a user profile
 *     tags: [Users]
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
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated User
 */
router.put(
  '/:id',
  requireAuth,
  [
    param('id').isString().notEmpty(),
    body('name').optional().isString().trim().notEmpty(),
    body('role')
      .optional()
      .isIn(['OpsDirector', 'SecurityLead', 'FacilitiesMgr', 'FieldAgent', 'Guest']),
  ],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const callerUid = req.user?.uid;
      const callerRole = req.user?.role;

      // Allow edit only if caller is the user themselves or an OpsDirector
      if (callerUid !== id && callerRole !== 'OpsDirector') {
        throw new AppError('Forbidden: Unauthorized to edit this profile', 403);
      }

      const userRef = db.collection('users').doc(id);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new AppError('User profile not found', 404);
      }

      const updates: Record<string, any> = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.role) {
        // Only OpsDirectors can change roles
        if (callerRole !== 'OpsDirector') {
          throw new AppError('Forbidden: Only Operations Directors can assign roles', 403);
        }
        updates.role = req.body.role;
      }

      await userRef.update(updates);
      const updatedDoc = await userRef.get();

      res.json(updatedDoc.data());
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete a user operational profile
 *     tags: [Users]
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
      const userRef = db.collection('users').doc(id);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new AppError('User profile not found', 404);
      }

      await userRef.delete();
      res.json({ message: 'User operational profile deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
