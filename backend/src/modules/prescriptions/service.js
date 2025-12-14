import { PrescriptionRepository } from './repository.js';
import { AppError } from '../../core/middleware/errorHandler.js';
import { autoChargeService } from '../services/chargeService.js';
import prisma from '../../core/database/prisma.js';

const prescriptionRepository = new PrescriptionRepository();

export class PrescriptionService {
  async createPrescription(data) {
    return prescriptionRepository.create(data);
  }

  async getPrescriptionById(id) {
    const prescription = await prescriptionRepository.findById(id);
    if (!prescription) {
      throw new AppError('Prescription not found', 404);
    }
    return prescription;
  }

  async getPrescriptionsByConsultation(consultationId) {
    return prescriptionRepository.findByConsultationId(consultationId);
  }

  async listPrescriptions(filters, pagination) {
    return prescriptionRepository.findMany(filters, pagination);
  }

  async updatePrescription(id, data) {
    const prescription = await prescriptionRepository.findById(id);
    if (!prescription) {
      throw new AppError('Prescription not found', 404);
    }

    if (prescription.status === 'DISPENSED') {
      throw new AppError('Cannot update dispensed prescription', 400);
    }

    return prescriptionRepository.update(id, data);
  }

  async dispensePrescription(id, dispensedBy, dispensedData) {
    const prescription = await prescriptionRepository.findById(id);
    if (!prescription) {
      throw new AppError('Prescription not found', 404);
    }

    if (prescription.status !== 'PENDING') {
      throw new AppError('Prescription is not pending', 400);
    }

    try {
      const dispensed = await prescriptionRepository.dispense(id, dispensedBy, dispensedData);
      
      // Get consultation to find visitId
      const consultation = await prisma.consultation.findUnique({
        where: { id: prescription.consultationId },
        select: { visitId: true }
      });
      
      // Mark prescription as completed for this visit
      if (consultation?.visitId) {
        await prisma.visit.update({
          where: { id: consultation.visitId },
          data: { prescriptionCompleted: true },
        });
      }
      
      // Auto-charge for dispensed medications
      try {
        if (consultation?.visitId && dispensed.items) {
          await autoChargeService.chargePrescription(
            consultation.visitId,
            dispensed.items,
            dispensedBy
          );
        }
      } catch (err) {
        console.error('Failed to auto-charge prescription:', err);
        // Don't fail the dispensing
      }
      
      return dispensed;
    } catch (error) {
      if (error.message.includes('Insufficient stock') || error.message.includes('Drug not found')) {
        throw new AppError(error.message, 400);
      }
      throw error;
    }
  }

  async getPendingPrescriptions() {
    return prescriptionRepository.getPendingPrescriptions();
  }

  async cancelPrescription(id) {
    const prescription = await prescriptionRepository.findById(id);
    if (!prescription) {
      throw new AppError('Prescription not found', 404);
    }

    if (prescription.status === 'DISPENSED') {
      throw new AppError('Cannot cancel dispensed prescription', 400);
    }

    return prescriptionRepository.update(id, { status: 'CANCELLED' });
  }
}
