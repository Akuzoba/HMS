import { Router } from 'express';
import { PharmacyController } from './controller.js';
import { authenticate, authorize } from '../../core/middleware/auth.js';

const router = Router();
const pharmacyController = new PharmacyController();

// All routes require authentication
router.use(authenticate);

// =====================
// DASHBOARD & STATS
// =====================
router.get('/stats', pharmacyController.getStats);

// =====================
// DRUG MANAGEMENT
// =====================
router.post('/drugs', authorize('ADMIN', 'PHARMACIST'), pharmacyController.createDrug);
router.get('/drugs', pharmacyController.listDrugs);
router.get('/drugs/low-stock', pharmacyController.getLowStockDrugs);
router.get('/drugs/out-of-stock', pharmacyController.getOutOfStockDrugs);
router.get('/drugs/:id', pharmacyController.getDrug);
router.put('/drugs/:id', authorize('ADMIN', 'PHARMACIST'), pharmacyController.updateDrug);
router.delete('/drugs/:id', authorize('ADMIN'), pharmacyController.deleteDrug);

// =====================
// BATCH MANAGEMENT
// =====================
router.post('/batches', authorize('ADMIN', 'PHARMACIST'), pharmacyController.addBatch);
router.get('/batches/expiring', pharmacyController.getExpiringBatches);
router.get('/batches/expired', pharmacyController.getExpiredBatches);
router.get('/batches/:id', pharmacyController.getBatch);
router.put('/batches/:id', authorize('ADMIN', 'PHARMACIST'), pharmacyController.updateBatch);
router.post('/batches/:id/mark-expired', authorize('ADMIN', 'PHARMACIST'), pharmacyController.markBatchExpired);
router.get('/drugs/:drugId/batches', pharmacyController.getBatchesByDrug);

// =====================
// INVENTORY
// =====================
router.get('/inventory/logs', pharmacyController.getInventoryLogs);
router.post('/inventory/adjust', authorize('ADMIN', 'PHARMACIST'), pharmacyController.adjustStock);

// =====================
// DISPENSING
// =====================
router.post('/dispensing', authorize('PHARMACIST', 'ADMIN'), pharmacyController.createDispensing);
router.get('/dispensing', pharmacyController.listDispensings);
router.get('/dispensing/:id', pharmacyController.getDispensing);

// =====================
// ALERTS
// =====================
router.get('/alerts', pharmacyController.getAlerts);

export default router;
