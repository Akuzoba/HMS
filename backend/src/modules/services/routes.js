import { Router } from 'express';
import { authenticate, authorize } from '../../core/middleware/auth.js';
import { validate } from '../../core/middleware/validate.js';
import { ServiceController } from './controller.js';
import { createServiceSchema, updateServiceSchema, chargeServiceSchema } from './schema.js';
import { asyncHandler } from '../../core/middleware/errorHandler.js';

const router = Router();
const serviceController = new ServiceController();

router.use(authenticate);

// Hospital Services Management
router.post(
  '/',
  authorize('BILLING_CLERK', 'ADMIN'),
  validate(createServiceSchema),
  asyncHandler((req, res) => serviceController.createService(req, res))
);

router.get(
  '/',
  asyncHandler((req, res) => serviceController.listServices(req, res))
);

router.get(
  '/:id',
  asyncHandler((req, res) => serviceController.getService(req, res))
);

router.patch(
  '/:id',
  authorize('BILLING_CLERK', 'ADMIN'),
  validate(updateServiceSchema),
  asyncHandler((req, res) => serviceController.updateService(req, res))
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  asyncHandler((req, res) => serviceController.deleteService(req, res))
);

// Visit Charges
router.post(
  '/charges',
  authorize('BILLING_CLERK', 'ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECH', 'PHARMACIST'),
  validate(chargeServiceSchema),
  asyncHandler((req, res) => serviceController.chargeService(req, res))
);

// Also support the alternative URL pattern used by frontend
router.post(
  '/visits/:visitId/charges',
  authorize('BILLING_CLERK', 'ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECH', 'PHARMACIST'),
  asyncHandler((req, res) => {
    // Add visitId to body for consistency
    req.body.visitId = req.params.visitId;
    return serviceController.chargeService(req, res);
  })
);

router.get(
  '/charges/visit/:visitId',
  asyncHandler((req, res) => serviceController.getVisitCharges(req, res))
);

// Also support the alternative URL pattern used by frontend
router.get(
  '/visits/:visitId/charges',
  asyncHandler((req, res) => serviceController.getVisitCharges(req, res))
);

router.get(
  '/charges/visit/:visitId/unbilled',
  asyncHandler((req, res) => serviceController.getUnbilledCharges(req, res))
);

router.delete(
  '/charges/:chargeId',
  authorize('BILLING_CLERK', 'ADMIN'),
  asyncHandler((req, res) => serviceController.removeCharge(req, res))
);

// Sync lab tests to services
router.post(
  '/sync-lab-tests',
  authorize('ADMIN'),
  asyncHandler((req, res) => serviceController.syncLabTestsToServices(req, res))
);

export default router;
