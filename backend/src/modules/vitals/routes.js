import { Router } from 'express';
import { authenticate, authorize } from '../../core/middleware/auth.js';
import { validate } from '../../core/middleware/validate.js';
import { VitalController } from './controller.js';
import { createVitalSchema, updateVitalSchema } from './schema.js';

const router = Router();
const vitalController = new VitalController();

// All routes require authentication
router.use(authenticate);

// Record new vitals
router.post(
  '/',
  authorize('NURSE', 'DOCTOR', 'ADMIN'),
  validate(createVitalSchema),
  (req, res, next) => vitalController.recordVitals(req, res).catch(next)
);

// Get vitals by visit ID
router.get(
  '/visit/:visitId',
  authorize('NURSE', 'DOCTOR', 'ADMIN', 'FRONT_DESK'),
  (req, res, next) => vitalController.getVisitVitals(req, res).catch(next)
);

// Get specific vital record
router.get(
  '/:id',
  authorize('NURSE', 'DOCTOR', 'ADMIN'),
  (req, res, next) => vitalController.getVital(req, res).catch(next)
);

// Update vital record
router.patch(
  '/:id',
  authorize('NURSE', 'DOCTOR', 'ADMIN'),
  validate(updateVitalSchema),
  (req, res, next) => vitalController.updateVitals(req, res).catch(next)
);

// Delete vital record
router.delete(
  '/:id',
  authorize('ADMIN'),
  (req, res, next) => vitalController.deleteVitals(req, res).catch(next)
);

export default router;
