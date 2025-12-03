import { Router } from 'express';
import { authenticate, authorize } from '../../core/middleware/auth.js';
import { LabController } from './controller.js';
import { asyncHandler } from '../../core/middleware/errorHandler.js';

const router = Router();
const labController = new LabController();

router.use(authenticate);

// ============ Lab Tests (Admin/Lab Tech) ============
router.post(
  '/tests',
  authorize('ADMIN', 'LAB_TECH'),
  asyncHandler((req, res) => labController.createLabTest(req, res))
);

router.get(
  '/tests',
  asyncHandler((req, res) => labController.listLabTests(req, res))
);

router.get(
  '/tests/:id',
  asyncHandler((req, res) => labController.getLabTest(req, res))
);

router.patch(
  '/tests/:id',
  authorize('ADMIN', 'LAB_TECH'),
  asyncHandler((req, res) => labController.updateLabTest(req, res))
);

router.delete(
  '/tests/:id',
  authorize('ADMIN'),
  asyncHandler((req, res) => labController.deleteLabTest(req, res))
);

// ============ Lab Orders ============
router.post(
  '/orders',
  authorize('DOCTOR', 'ADMIN'),
  asyncHandler((req, res) => labController.createLabOrder(req, res))
);

router.get(
  '/orders',
  asyncHandler((req, res) => labController.listLabOrders(req, res))
);

router.get(
  '/orders/pending',
  authorize('LAB_TECH', 'ADMIN'),
  asyncHandler((req, res) => labController.getPendingOrders(req, res))
);

router.get(
  '/orders/:id',
  asyncHandler((req, res) => labController.getLabOrder(req, res))
);

router.patch(
  '/orders/:id',
  authorize('LAB_TECH', 'DOCTOR', 'ADMIN'),
  asyncHandler((req, res) => labController.updateLabOrder(req, res))
);

router.post(
  '/orders/:id/collect-sample',
  authorize('LAB_TECH', 'NURSE', 'ADMIN'),
  asyncHandler((req, res) => labController.collectSample(req, res))
);

router.post(
  '/orders/:id/cancel',
  authorize('DOCTOR', 'ADMIN'),
  asyncHandler((req, res) => labController.cancelLabOrder(req, res))
);

// ============ Lab Results ============
router.post(
  '/results',
  authorize('LAB_TECH', 'ADMIN'),
  asyncHandler((req, res) => labController.submitResults(req, res))
);

router.get(
  '/orders/:orderId/results',
  asyncHandler((req, res) => labController.getResults(req, res))
);

router.post(
  '/results/:resultId/verify',
  authorize('LAB_TECH', 'DOCTOR', 'ADMIN'),
  asyncHandler((req, res) => labController.verifyResult(req, res))
);

router.post(
  '/orders/:orderId/verify-all',
  authorize('LAB_TECH', 'DOCTOR', 'ADMIN'),
  asyncHandler((req, res) => labController.verifyAllResults(req, res))
);

// ============ Patient Lab History ============
router.get(
  '/patient/:patientId/history',
  asyncHandler((req, res) => labController.getPatientLabHistory(req, res))
);

export default router;
