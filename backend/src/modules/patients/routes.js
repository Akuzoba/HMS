import { Router } from 'express';
import { PatientController } from './controller.js';
import { validate } from '../../core/middleware/validate.js';
import { authenticate, authorize } from '../../core/middleware/auth.js';
import { createPatientSchema, updatePatientSchema, searchPatientSchema } from './schema.js';

const router = Router();
const controller = new PatientController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/patients
 * @desc    Register a new patient
 * @access  Front Desk, Admin
 */
router.post('/', authorize('FRONT_DESK', 'ADMIN'), validate(createPatientSchema), controller.create);

/**
 * @route   GET /api/patients/search
 * @desc    Search for patients
 * @access  All authenticated users
 */
router.get('/search', validate(searchPatientSchema), controller.search);

/**
 * @route   GET /api/patients
 * @desc    List all patients (paginated)
 * @access  All authenticated users
 */
router.get('/', controller.list);

/**
 * @route   GET /api/patients/:id
 * @desc    Get patient by ID
 * @access  All authenticated users
 */
router.get('/:id', controller.getById);

/**
 * @route   GET /api/patients/:id/visits
 * @desc    Get patient visit history
 * @access  All authenticated users
 */
router.get('/:id/visits', controller.getVisitHistory);

/**
 * @route   PATCH /api/patients/:id
 * @desc    Update patient information
 * @access  Front Desk, Admin
 */
router.patch('/:id', authorize('FRONT_DESK', 'ADMIN'), validate(updatePatientSchema), controller.update);

/**
 * @route   DELETE /api/patients/:id
 * @desc    Soft delete a patient
 * @access  Admin only
 */
router.delete('/:id', authorize('ADMIN'), controller.delete);

export default router;
