import { PrescriptionService } from './service.js';

const prescriptionService = new PrescriptionService();

export class PrescriptionController {
  async createPrescription(req, res) {
    const prescription = await prescriptionService.createPrescription({
      ...req.body,
      prescribedBy: req.user.id,
    });
    res.status(201).json({
      success: true,
      data: prescription,
      message: 'Prescription created successfully',
    });
  }

  async getPrescription(req, res) {
    const prescription = await prescriptionService.getPrescriptionById(
      req.params.id
    );
    res.json({
      success: true,
      data: prescription,
    });
  }

  async getConsultationPrescriptions(req, res) {
    const prescriptions = await prescriptionService.getPrescriptionsByConsultation(
      req.params.consultationId
    );
    res.json({
      success: true,
      data: prescriptions,
    });
  }

  async listPrescriptions(req, res) {
    const { page, limit, status, patientId } = req.query;
    const result = await prescriptionService.listPrescriptions(
      { status, patientId },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20 }
    );
    res.json({
      success: true,
      ...result,
    });
  }

  async updatePrescription(req, res) {
    const prescription = await prescriptionService.updatePrescription(
      req.params.id,
      req.body
    );
    res.json({
      success: true,
      data: prescription,
      message: 'Prescription updated successfully',
    });
  }

  async dispensePrescription(req, res) {
    const prescription = await prescriptionService.dispensePrescription(
      req.params.id,
      req.user.id,
      req.body
    );
    res.json({
      success: true,
      data: prescription,
      message: 'Prescription dispensed successfully',
    });
  }

  async getPendingPrescriptions(req, res) {
    const prescriptions = await prescriptionService.getPendingPrescriptions();
    res.json({
      success: true,
      data: prescriptions,
    });
  }

  async cancelPrescription(req, res) {
    const prescription = await prescriptionService.cancelPrescription(
      req.params.id
    );
    res.json({
      success: true,
      data: prescription,
      message: 'Prescription cancelled successfully',
    });
  }
}
