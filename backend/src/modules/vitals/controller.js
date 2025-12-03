import { VitalService } from './service.js';

const vitalService = new VitalService();

export class VitalController {
  async recordVitals(req, res) {
    const vitals = await vitalService.recordVitals({
      ...req.body,
      recordedBy: req.user.id,
    });
    res.status(201).json({
      success: true,
      data: vitals,
      message: 'Vitals recorded successfully',
    });
  }

  async getVital(req, res) {
    const vital = await vitalService.getVitalById(req.params.id);
    res.json({
      success: true,
      data: vital,
    });
  }

  async getVisitVitals(req, res) {
    const vitals = await vitalService.getVitalsByVisit(req.params.visitId);
    res.json({
      success: true,
      data: vitals,
    });
  }

  async updateVitals(req, res) {
    const vital = await vitalService.updateVitals(req.params.id, req.body);
    res.json({
      success: true,
      data: vital,
      message: 'Vitals updated successfully',
    });
  }

  async deleteVitals(req, res) {
    await vitalService.deleteVitals(req.params.id);
    res.json({
      success: true,
      message: 'Vitals deleted successfully',
    });
  }
}
