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
