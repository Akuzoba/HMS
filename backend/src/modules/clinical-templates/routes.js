import { Router } from 'express';
import * as controller from './controller.js';
import { authenticate, authorize } from '../../core/middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =====================
// DRUG REGIMENS
// =====================

// GET /api/clinical-templates/drug-regimens - Get all drug regimens
router.get('/drug-regimens', controller.getDrugRegimens);

// GET /api/clinical-templates/drug-regimens/search - Search drug regimens (autocomplete)
router.get('/drug-regimens/search', controller.searchDrugRegimens);

// GET /api/clinical-templates/drug-regimens/:id - Get single drug regimen
router.get('/drug-regimens/:id', controller.getDrugRegimenById);

// POST /api/clinical-templates/drug-regimens/:id/usage - Record usage
router.post('/drug-regimens/:id/usage', controller.recordDrugRegimenUsage);

// =====================
// EXAM SECTIONS
// =====================

// GET /api/clinical-templates/exam-sections - Get all exam sections
router.get('/exam-sections', controller.getExamSections);

// GET /api/clinical-templates/exam-sections/relevant - Get relevant sections for complaint
router.get('/exam-sections/relevant', controller.getRelevantExamSections);

// GET /api/clinical-templates/exam-sections/:code - Get single exam section by code
router.get('/exam-sections/:code', controller.getExamSectionByCode);

// =====================
// CLINICAL TEMPLATES (Sentence Builders)
// =====================

// GET /api/clinical-templates/templates - Get all clinical templates
router.get('/templates', controller.getClinicalTemplates);

// GET /api/clinical-templates/templates/:id - Get single template
router.get('/templates/:id', controller.getClinicalTemplateById);

// GET /api/clinical-templates/templates/category/:category - Get templates for category
router.get('/templates/category/:category', controller.getTemplatesForCategory);

// POST /api/clinical-templates/templates/:id/generate - Generate text from template
router.post('/templates/:id/generate', controller.generateClinicalText);

// =====================
// SMART SUGGESTIONS
// =====================

// GET /api/clinical-templates/suggestions - Get smart suggestions based on chief complaint
router.get('/suggestions', controller.getSmartSuggestions);

export default router;
