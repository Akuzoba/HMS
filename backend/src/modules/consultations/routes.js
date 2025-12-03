import { Router } from 'express';
import { authenticate, authorize } from '../../core/middleware/auth.js';
import { validate } from '../../core/middleware/validate.js';
import { ConsultationController } from './controller.js';
import {
  createConsultationSchema,
  updateConsultationSchema,
  addDiagnosisSchema,
} from './schema.js';

const router = Router();
const consultationController = new ConsultationController();

// All routes require authentication
router.use(authenticate);

// Create new consultation
router.post(
  '/',
  authorize('DOCTOR', 'ADMIN'),
  validate(createConsultationSchema),
  (req, res, next) =>
    consultationController.createConsultation(req, res).catch(next)
);

// List consultations with filters
router.get(
  '/',
  authorize('DOCTOR', 'NURSE', 'ADMIN'),
  (req, res, next) => consultationController.listConsultations(req, res).catch(next)
);

// Get consultations by visit ID
router.get(
  '/visit/:visitId',
  authorize('DOCTOR', 'NURSE', 'ADMIN', 'PHARMACIST', 'LAB_TECH'),
  (req, res, next) =>
    consultationController.getVisitConsultations(req, res).catch(next)
);

// Get specific consultation
router.get(
  '/:id',
  authorize('DOCTOR', 'NURSE', 'ADMIN', 'PHARMACIST', 'LAB_TECH'),
  (req, res, next) => consultationController.getConsultation(req, res).catch(next)
);

// Update consultation
router.patch(
  '/:id',
  authorize('DOCTOR', 'ADMIN'),
  validate(updateConsultationSchema),
  (req, res, next) =>
    consultationController.updateConsultation(req, res).catch(next)
);

// Add diagnosis to consultation
router.post(
  '/:id/diagnosis',
  authorize('DOCTOR', 'ADMIN'),
  validate(addDiagnosisSchema),
  (req, res, next) => consultationController.addDiagnosis(req, res).catch(next)
);

// Get diagnoses for consultation
router.get(
  '/:id/diagnosis',
  authorize('DOCTOR', 'NURSE', 'ADMIN'),
  (req, res, next) => consultationController.getDiagnoses(req, res).catch(next)
);

export default router;
