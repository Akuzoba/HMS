import { PatientService } from './service.js';

export class PatientController {
  constructor() {
    this.service = new PatientService();
  }

  create = async (req, res, next) => {
    try {
      const patient = await this.service.createPatient(req.body);
      
      res.status(201).json({
        success: true,
        data: patient
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
}
