import { Router } from 'express';
import { authenticate, authorize } from '../../core/middleware/auth.js';
import { BillingController } from './controller.js';
import { asyncHandler } from '../../core/middleware/errorHandler.js';

const router = Router();
const billingController = new BillingController();

router.use(authenticate);

// Bills
router.post(
  '/bills',
  authorize('BILLING_CLERK', 'ADMIN'),
  asyncHandler((req, res) => billingController.createBill(req, res))
);

router.get(
  '/bills',
  authorize('BILLING_CLERK', 'ADMIN'),
  asyncHandler((req, res) => billingController.listBills(req, res))
);

router.get(
  '/bills/pending',
  authorize('BILLING_CLERK', 'ADMIN'),
  asyncHandler((req, res) => billingController.getPendingBills(req, res))
);

router.get(
  '/bills/stats',
  authorize('BILLING_CLERK', 'ADMIN'),
  asyncHandler((req, res) => billingController.getBillingStats(req, res))
);

router.get(
  '/bills/:id',
  asyncHandler((req, res) => billingController.getBill(req, res))
);

router.patch(
  '/bills/:id',
  authorize('BILLING_CLERK', 'ADMIN'),
  asyncHandler((req, res) => billingController.updateBill(req, res))
);

router.post(
  '/bills/:id/cancel',
  authorize('BILLING_CLERK', 'ADMIN'),
  asyncHandler((req, res) => billingController.cancelBill(req, res))
);

router.get(
  '/bills/:id/receipt',
  asyncHandler((req, res) => billingController.generateReceipt(req, res))
);

// Patient bills
router.get(
  '/patient/:patientId/bills',
  asyncHandler((req, res) => billingController.getPatientBills(req, res))
);

// Payments
router.post(
  '/payments',
  authorize('BILLING_CLERK', 'ADMIN'),
  asyncHandler((req, res) => billingController.recordPayment(req, res))
);

router.get(
  '/payments',
  authorize('BILLING_CLERK', 'ADMIN'),
  asyncHandler((req, res) => billingController.getAllPayments(req, res))
);

router.get(
  '/bills/:billId/payments',
  asyncHandler((req, res) => billingController.getPayments(req, res))
);

// Visit charges and bill generation
router.get(
  '/visits/:visitId/charges',
  authorize('BILLING_CLERK', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'),
  asyncHandler((req, res) => billingController.getVisitCharges(req, res))
);

router.post(
  '/visits/:visitId/generate-bill',
  authorize('BILLING_CLERK', 'ADMIN'),
  asyncHandler((req, res) => billingController.generateBillFromVisit(req, res))
);

export default router;
