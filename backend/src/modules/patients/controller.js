import { PatientService } from './service.js';

export class PatientController {
  constructor() {
    this.service = new PatientService();
  }

  create = async (req, res, next) => {
    try {
      const { confirmNotDuplicate } = req.query;
      
      // Use MPI-enabled creation
      const result = await this.service.createPatientWithMPI(req.body, {
        confirmedNotDuplicate: confirmNotDuplicate === 'true'
      });

      if (result.status === 'DUPLICATE_WARNING') {
        // Return 200 with warning - frontend should handle
        return res.status(200).json({
          success: true,
          status: 'DUPLICATE_WARNING',
          message: result.message,
          duplicateCheck: result.duplicateCheck,
          requiresConfirmation: true
        });
      }
      
      res.status(201).json({
        success: true,
        status: 'CREATED',
        data: result.patient
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const patient = await this.service.getPatientById(req.params.id);
      
      res.json({
        success: true,
        data: patient
      });
    } catch (error) {
      next(error);
    }
  };

  search = async (req, res, next) => {
    try {
      const { q, page = 1, limit = 20 } = req.query;
      const result = await this.service.searchPatients(q, parseInt(page), parseInt(limit));
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await this.service.listPatients(parseInt(page), parseInt(limit));
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const patient = await this.service.updatePatient(req.params.id, req.body);
      
      res.json({
        success: true,
        data: patient
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      await this.service.deletePatient(req.params.id);
      
      res.json({
        success: true,
        message: 'Patient deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getVisitHistory = async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await this.service.getPatientVisitHistory(
        req.params.id,
        parseInt(page),
        parseInt(limit)
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check for duplicate patients before registration
   * POST /api/patients/check-duplicates
   */
  checkDuplicates = async (req, res, next) => {
    try {
      const result = await this.service.checkForDuplicates(req.body);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Advanced fuzzy search for patients
   * GET /api/patients/fuzzy-search?q=search_term
   */
  fuzzySearch = async (req, res, next) => {
    try {
      const { q, page = 1, limit = 20 } = req.query;
      
      if (!q || q.length < 2) {
        return res.json({
          success: true,
          data: {
            patients: [],
            pagination: { page: 1, limit: 20, total: 0, pages: 0 }
          }
        });
      }

      const result = await this.service.fuzzySearchPatients(q, parseInt(page), parseInt(limit));
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}
