import { VitalRepository } from './repository.js';
import { AppError } from '../../core/middleware/errorHandler.js';
import prisma from '../../core/database/prisma.js';

const vitalRepository = new VitalRepository();

export class VitalService {
  async recordVitals(data) {
    // Calculate BMI if height and weight are provided
    if (data.height && data.weight) {
      const heightInMeters = data.height / 100;
      data.bmi = (data.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }

    const vital = await vitalRepository.create(data);
    
    // Mark vitals as completed for this visit
    await prisma.visit.update({
      where: { id: data.visitId },
      data: { vitalsCompleted: true },
    });
    
    return vital;
  }

  async getVitalById(id) {
    const vital = await vitalRepository.findById(id);
    if (!vital) {
      throw new AppError('Vital record not found', 404);
    }
    return vital;
  }

  async getVitalsByVisit(visitId) {
    return vitalRepository.findByVisitId(visitId);
  }

  async updateVitals(id, data) {
    const vital = await vitalRepository.findById(id);
    if (!vital) {
      throw new AppError('Vital record not found', 404);
    }

    // Recalculate BMI if height or weight changed
    if ((data.height || vital.height) && (data.weight || vital.weight)) {
      const height = data.height || vital.height;
      const weight = data.weight || vital.weight;
      const heightInMeters = height / 100;
      data.bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }

    return vitalRepository.update(id, data);
  }

  async deleteVitals(id) {
    const vital = await vitalRepository.findById(id);
    if (!vital) {
      throw new AppError('Vital record not found', 404);
    }
    return vitalRepository.delete(id);
  }
}
