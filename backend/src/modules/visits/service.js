import { VisitRepository } from './repository.js';
import { AppError } from '../../core/middleware/errorHandler.js';

const visitRepository = new VisitRepository();

export class VisitService {
  async createVisit(data) {
    return visitRepository.create(data);
  }

  async getVisitById(id) {
    const visit = await visitRepository.findById(id);
    if (!visit) {
      throw new AppError('Visit not found', 404);
    }
    return visit;
  }

  async listVisits(filters) {
    return visitRepository.findMany(filters);
  }

  // Get visits for nurse station (all active visits)
  async getNurseVisits(filters) {
    return visitRepository.findMany({
      ...filters,
      excludeStatuses: ['COMPLETED', 'CANCELLED'],
    });
  }

  // Get visits for doctor station (all active visits)
  async getDoctorVisits(filters) {
    return visitRepository.findMany({
      ...filters,
      excludeStatuses: ['COMPLETED', 'CANCELLED'],
    });
  }

  // Get visits for pharmacy (has consultation but prescription not completed)
  async getPharmacyVisits(filters) {
    return visitRepository.findMany({
      ...filters,
      consultationCompleted: true,
      prescriptionCompleted: false,
      excludeStatuses: ['COMPLETED', 'CANCELLED'],
    });
  }

  // Get visits for lab (has lab order but not completed)
  async getLabVisits(filters) {
    return visitRepository.findMany({
      ...filters,
      labOrderCompleted: false,
      hasLabOrders: true,
      excludeStatuses: ['COMPLETED', 'CANCELLED'],
    });
  }

  async updateVisit(id, data) {
    const visit = await visitRepository.findById(id);
    if (!visit) {
      throw new AppError('Visit not found', 404);
    }
    return visitRepository.update(id, data);
  }

  async deleteVisit(id) {
    const visit = await visitRepository.findById(id);
    if (!visit) {
      throw new AppError('Visit not found', 404);
    }
    return visitRepository.delete(id);
  }

  async getPatientVisitHistory(patientId) {
    return visitRepository.getPatientVisits(patientId);
  }
}
