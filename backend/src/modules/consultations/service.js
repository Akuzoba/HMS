import { ConsultationRepository } from './repository.js';
import { AppError } from '../../core/middleware/errorHandler.js';
import { autoChargeService } from '../services/chargeService.js';

const consultationRepository = new ConsultationRepository();

export class ConsultationService {
  async createConsultation(data) {
    const consultation = await consultationRepository.create(data);
    
    // Auto-charge for consultation
    try {
      await autoChargeService.chargeConsultation(
        data.visitId,
        'General Consultation',
        data.consultedBy
      );
    } catch (err) {
      console.error('Failed to auto-charge consultation:', err);
      // Don't fail the consultation creation
    }
    
    return consultation;
  }

  async getConsultationById(id) {
    const consultation = await consultationRepository.findById(id);
    if (!consultation) {
      throw new AppError('Consultation not found', 404);
    }
    return consultation;
  }

  async getConsultationsByVisit(visitId) {
    return consultationRepository.findByVisitId(visitId);
  }

  async listConsultations(filters, pagination) {
    return consultationRepository.findMany(filters, pagination);
  }

  async updateConsultation(id, data) {
    const consultation = await consultationRepository.findById(id);
    if (!consultation) {
      throw new AppError('Consultation not found', 404);
    }
    
    return consultationRepository.update(id, data);
  }

  async addDiagnosis(consultationId, diagnosisData) {
    const consultation = await consultationRepository.findById(consultationId);
    if (!consultation) {
      throw new AppError('Consultation not found', 404);
    }
    return consultationRepository.addDiagnosis(consultationId, diagnosisData);
  }

  async getDiagnoses(consultationId) {
    const consultation = await consultationRepository.findById(consultationId);
    if (!consultation) {
      throw new AppError('Consultation not found', 404);
    }
    return consultationRepository.getDiagnoses(consultationId);
  }
}
