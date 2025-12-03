import { Router } from 'express';
import { authenticate, authorize } from '../../core/middleware/auth.js';
import { validate } from '../../core/middleware/validate.js';
import { PrescriptionController } from './controller.js';
import {
  createPrescriptionSchema,
  updatePrescriptionSchema,
  dispensePrescriptionSchema,
} from './schema.js';

const router = Router();
const prescriptionController = new PrescriptionController();

// All routes require authentication
router.use(authenticate);

// Create new prescription
router.post(
  '/',
  authorize('DOCTOR', 'ADMIN'),
  validate(createPrescriptionSchema),
  (req, res, next) =>
    prescriptionController.createPrescription(req, res).catch(next)
);

// Get pending prescriptions (for pharmacy)
router.get(
  '/pending',
  authorize('PHARMACIST', 'ADMIN'),
  (req, res, next) =>
    prescriptionController.getPendingPrescriptions(req, res).catch(next)
);

// List prescriptions with filters
router.get(
  '/',
  authorize('DOCTOR', 'PHARMACIST', 'ADMIN'),
  (req, res, next) => prescriptionController.listPrescriptions(req, res).catch(next)
);

// Get prescriptions by consultation ID
router.get(
  '/consultation/:consultationId',
  authorize('DOCTOR', 'PHARMACIST', 'NURSE', 'ADMIN'),
  (req, res, next) =>
    prescriptionController.getConsultationPrescriptions(req, res).catch(next)
);

// Get specific prescription
router.get(
  '/:id',
  authorize('DOCTOR', 'PHARMACIST', 'ADMIN'),
  (req, res, next) => prescriptionController.getPrescription(req, res).catch(next)
);

// Update prescription (before dispensing)
router.patch(
  '/:id',
  authorize('DOCTOR', 'ADMIN'),
  validate(updatePrescriptionSchema),
  (req, res, next) =>
    prescriptionController.updatePrescription(req, res).catch(next)
);

// Dispense prescription
router.post(
  '/:id/dispense',
  authorize('PHARMACIST', 'ADMIN'),
  validate(dispensePrescriptionSchema),
  (req, res, next) =>
    prescriptionController.dispensePrescription(req, res).catch(next)
);

// Cancel prescription
router.post(
  '/:id/cancel',
  authorize('DOCTOR', 'ADMIN'),
  (req, res, next) =>
    prescriptionController.cancelPrescription(req, res).catch(next)
);

export default router;
