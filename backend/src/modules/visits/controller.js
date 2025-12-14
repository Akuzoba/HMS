import { VisitService } from './service.js';

const visitService = new VisitService();

export class VisitController {
  async createVisit(req, res) {
    const visit = await visitService.createVisit(req.body);
    res.status(201).json({
      success: true,
      data: visit,
      message: 'Visit created successfully',
    });
  }

  async getVisit(req, res) {
    const visit = await visitService.getVisitById(req.params.id);
    res.json({
      success: true,
      data: visit,
    });
  }

  async listVisits(req, res) {
    const { patientId, status, visitType, page, limit } = req.query;
    const result = await visitService.listVisits({
      patientId,
      status,
      visitType,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    
    res.json({
      success: true,
      data: result.visits,
      pagination: result.pagination,
    });
  }

  async getNurseVisits(req, res) {
    const { page, limit } = req.query;
    const result = await visitService.getNurseVisits({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    
    res.json({
      success: true,
      data: result.visits,
      pagination: result.pagination,
    });
  }

  async getDoctorVisits(req, res) {
    const { page, limit } = req.query;
    const result = await visitService.getDoctorVisits({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    
    res.json({
      success: true,
      data: result.visits,
      pagination: result.pagination,
    });
  }

  async getPharmacyVisits(req, res) {
    const { page, limit } = req.query;
    const result = await visitService.getPharmacyVisits({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    
    res.json({
      success: true,
      data: result.visits,
      pagination: result.pagination,
    });
  }

  async getLabVisits(req, res) {
    const { page, limit } = req.query;
    const result = await visitService.getLabVisits({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    
    res.json({
      success: true,
      data: result.visits,
      pagination: result.pagination,
    });
  }

  async updateVisit(req, res) {
    const visit = await visitService.updateVisit(req.params.id, req.body);
    res.json({
      success: true,
      data: visit,
      message: 'Visit updated successfully',
    });
  }

  async deleteVisit(req, res) {
    await visitService.deleteVisit(req.params.id);
    res.json({
      success: true,
      message: 'Visit deleted successfully',
    });
  }

  async getPatientVisits(req, res) {
    const visits = await visitService.getPatientVisitHistory(req.params.patientId);
    res.json({
      success: true,
      data: visits,
    });
  }
}
