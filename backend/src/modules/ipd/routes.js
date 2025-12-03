import express from 'express';
import { IPDController } from './controller.js';
import { authenticate, authorize } from '../../core/middleware/auth.js';

const router = express.Router();
const ipdController = new IPDController();

// Apply authentication to all IPD routes
router.use(authenticate);

// =====================
// WARD ROUTES
// =====================

// GET /api/ipd/wards - List all wards
router.get(
  '/wards',
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'),
  ipdController.listWards
);

// GET /api/ipd/wards/occupancy - Get ward occupancy stats
router.get(
  '/wards/occupancy',
  authorize('ADMIN', 'DOCTOR', 'NURSE'),
  ipdController.getWardOccupancy
);

// GET /api/ipd/wards/:id - Get single ward
router.get(
  '/wards/:id',
  authorize('ADMIN', 'DOCTOR', 'NURSE'),
  ipdController.getWard
);

// POST /api/ipd/wards - Create new ward
router.post(
  '/wards',
  authorize('ADMIN'),
  ipdController.createWard
);

// PUT /api/ipd/wards/:id - Update ward
router.put(
  '/wards/:id',
  authorize('ADMIN'),
  ipdController.updateWard
);

// =====================
// BED ROUTES
// =====================

// GET /api/ipd/beds/available - Get available beds
router.get(
  '/beds/available',
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'),
  ipdController.getAvailableBeds
);

// GET /api/ipd/beds/ward/:wardId - Get beds by ward
router.get(
  '/beds/ward/:wardId',
  authorize('ADMIN', 'DOCTOR', 'NURSE'),
  ipdController.getBedsByWard
);

// GET /api/ipd/beds/:id - Get single bed
router.get(
  '/beds/:id',
  authorize('ADMIN', 'DOCTOR', 'NURSE'),
  ipdController.getBed
);

// POST /api/ipd/beds - Create new bed
router.post(
  '/beds',
  authorize('ADMIN'),
  ipdController.createBed
);

// POST /api/ipd/beds/bulk - Create multiple beds at once
router.post(
  '/beds/bulk',
  authorize('ADMIN'),
  ipdController.createMultipleBeds
);

// PUT /api/ipd/beds/:id - Update bed
router.put(
  '/beds/:id',
  authorize('ADMIN'),
  ipdController.updateBed
);

// PATCH /api/ipd/beds/:id/status - Update bed status
router.patch(
  '/beds/:id/status',
  authorize('ADMIN', 'NURSE'),
  ipdController.updateBedStatus
);

// =====================
// ADMISSION ROUTES
// =====================

// GET /api/ipd/admissions - List all admissions (with filters)
router.get(
  '/admissions',
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'),
  ipdController.listAdmissions
);

// GET /api/ipd/admissions/current - Get currently admitted patients
router.get(
  '/admissions/current',
  authorize('ADMIN', 'DOCTOR', 'NURSE'),
  ipdController.getCurrentAdmissions
);

// GET /api/ipd/admissions/number/:admissionNumber - Get admission by number
router.get(
  '/admissions/number/:admissionNumber',
  authorize('ADMIN', 'DOCTOR', 'NURSE'),
  ipdController.getAdmissionByNumber
);

// GET /api/ipd/admissions/:id - Get single admission
router.get(
  '/admissions/:id',
  authorize('ADMIN', 'DOCTOR', 'NURSE'),
  ipdController.getAdmission
);

// POST /api/ipd/admissions - Create new admission
router.post(
  '/admissions',
  authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'),
  ipdController.createAdmission
);

// PUT /api/ipd/admissions/:id - Update admission
router.put(
  '/admissions/:id',
  authorize('ADMIN', 'DOCTOR'),
  ipdController.updateAdmission
);

// POST /api/ipd/admissions/:id/discharge - Discharge patient
router.post(
  '/admissions/:id/discharge',
  authorize('ADMIN', 'DOCTOR'),
  ipdController.dischargePatient
);

// POST /api/ipd/admissions/:id/transfer - Transfer patient to different bed
router.post(
  '/admissions/:id/transfer',
  authorize('ADMIN', 'DOCTOR', 'NURSE'),
  ipdController.transferBed
);

// =====================
// DAILY ROUNDS ROUTES
// =====================

// GET /api/ipd/rounds/today - Get today's rounds
router.get(
  '/rounds/today',
  authorize('ADMIN', 'DOCTOR', 'NURSE'),
  ipdController.getTodayRounds
);

// GET /api/ipd/rounds/admission/:admissionId - Get rounds for an admission
router.get(
  '/rounds/admission/:admissionId',
  authorize('ADMIN', 'DOCTOR', 'NURSE'),
  ipdController.getDailyRoundsByAdmission
);

// POST /api/ipd/rounds - Create daily round
router.post(
  '/rounds',
  authorize('DOCTOR'),
  ipdController.createDailyRound
);

// =====================
// NURSING NOTES ROUTES
// =====================

// GET /api/ipd/nursing-notes/admission/:admissionId - Get nursing notes for admission
router.get(
  '/nursing-notes/admission/:admissionId',
  authorize('ADMIN', 'DOCTOR', 'NURSE'),
  ipdController.getNursingNotesByAdmission
);

// POST /api/ipd/nursing-notes - Create nursing note
router.post(
  '/nursing-notes',
  authorize('NURSE'),
  ipdController.createNursingNote
);

// =====================
// IPD VITALS ROUTES
// =====================

// GET /api/ipd/vitals/admission/:admissionId - Get vitals for admission
router.get(
  '/vitals/admission/:admissionId',
  authorize('ADMIN', 'DOCTOR', 'NURSE'),
  ipdController.getVitalsByAdmission
);

// POST /api/ipd/vitals - Record vital signs
router.post(
  '/vitals',
  authorize('DOCTOR', 'NURSE'),
  ipdController.createIPDVital
);

// =====================
// IPD MEDICATIONS ROUTES
// =====================

// GET /api/ipd/medications/schedule/:admissionId - Get medication schedule
router.get(
  '/medications/schedule/:admissionId',
  authorize('ADMIN', 'DOCTOR', 'NURSE'),
  ipdController.getMedicationSchedule
);

// POST /api/ipd/medications - Add medication to schedule
router.post(
  '/medications',
  authorize('DOCTOR'),
  ipdController.createIPDMedication
);

// POST /api/ipd/medications/:id/administer - Mark medication as administered
router.post(
  '/medications/:id/administer',
  authorize('NURSE'),
  ipdController.administerMedication
);

// POST /api/ipd/medications/:id/hold - Hold medication
router.post(
  '/medications/:id/hold',
  authorize('DOCTOR', 'NURSE'),
  ipdController.holdMedication
);

// =====================
// DASHBOARD / STATS
// =====================

// GET /api/ipd/stats - Get IPD statistics
router.get(
  '/stats',
  authorize('ADMIN', 'DOCTOR'),
  ipdController.getStats
);

export default router;
