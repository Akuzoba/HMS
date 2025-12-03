import { ConsultationService } from './service.js';

const consultationService = new ConsultationService();

export class ConsultationController {
  async createConsultation(req, res) {
    const consultation = await consultationService.createConsultation({
      ...req.body,
      consultedBy: req.user.id,
    });
    res.status(201).json({
      success: true,
      data: consultation,
      message: 'Consultation created successfully',
    });
  }

  async getConsultation(req, res) {
    const consultation = await consultationService.getConsultationById(
      req.params.id
    );
    res.json({
      success: true,
      data: consultation,
    });
  }

  async getVisitConsultations(req, res) {
    const consultations = await consultationService.getConsultationsByVisit(
      req.params.visitId
    );
    res.json({
      success: true,
      data: consultations,
    });
  }

  async listConsultations(req, res) {
    const { page, limit, doctorId, status } = req.query;
    const result = await consultationService.listConsultations(
      { doctorId, status },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20 }
    );
    res.json({
      success: true,
      ...result,
    });
  }

  async updateConsultation(req, res) {
    const consultation = await consultationService.updateConsultation(
      req.params.id,
      req.body
    );
    res.json({
      success: true,
      data: consultation,
      message: 'Consultation updated successfully',
    });
  }

  async addDiagnosis(req, res) {
    const diagnosis = await consultationService.addDiagnosis(
      req.params.id,
      req.body
    );
    res.status(201).json({
      success: true,
      data: diagnosis,
      message: 'Diagnosis added successfully',
    });
  }

  async getDiagnoses(req, res) {
    const diagnoses = await consultationService.getDiagnoses(req.params.id);
    res.json({
      success: true,
      data: diagnoses,
    });
  }
}
