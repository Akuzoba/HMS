import { Router } from 'express';
import { VisitController } from './controller.js';
import { authenticate, authorize } from '../../core/middleware/auth.js';
import { validate } from '../../core/middleware/validate.js';
import { createVisitSchema, updateVisitSchema } from './schema.js';

const router = Router();
const visitController = new VisitController();

// All routes require authentication
router.use(authenticate);

// Create visit
router.post(
  '/',
  authorize('FRONT_DESK', 'NURSE', 'ADMIN'),
  validate(createVisitSchema),
  visitController.createVisit.bind(visitController)
);

// List visits
router.get(
  '/',
  visitController.listVisits.bind(visitController)
);

// Get patient visit history
router.get(
  '/patient/:patientId',
  visitController.getPatientVisits.bind(visitController)
);

// Get visit by ID
router.get(
  '/:id',
  visitController.getVisit.bind(visitController)
);

// Update visit
router.patch(
  '/:id',
  authorize('FRONT_DESK', 'NURSE', 'DOCTOR', 'PHARMACIST', 'LAB_TECH', 'ADMIN'),
  validate(updateVisitSchema),
  visitController.updateVisit.bind(visitController)
);

// Delete visit
router.delete(
  '/:id',
  authorize('ADMIN'),
  visitController.deleteVisit.bind(visitController)
);

export default router;
