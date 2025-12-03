import { LabRepository } from './repository.js';
import { AppError } from '../../core/middleware/errorHandler.js';
import { autoChargeService } from '../services/chargeService.js';

const labRepository = new LabRepository();

export class LabService {
  // ============ Lab Tests ============

  async createLabTest(data) {
    // Check if test code already exists
    const existing = await labRepository.findLabTestByCode(data.testCode);
    if (existing) {
      throw new AppError('Test code already exists', 400);
    }
    return labRepository.createLabTest(data);
  }

  async getLabTestById(id) {
    const test = await labRepository.findLabTestById(id);
    if (!test) {
      throw new AppError('Lab test not found', 404);
    }
    return test;
  }

  async listLabTests(filters) {
    return labRepository.findManyLabTests(filters);
  }

  async updateLabTest(id, data) {
    const test = await labRepository.findLabTestById(id);
    if (!test) {
      throw new AppError('Lab test not found', 404);
    }

    // Check if updating to existing code
    if (data.testCode && data.testCode !== test.testCode) {
      const existing = await labRepository.findLabTestByCode(data.testCode);
      if (existing) {
        throw new AppError('Test code already exists', 400);
      }
    }

    return labRepository.updateLabTest(id, data);
  }

  async deleteLabTest(id) {
    const test = await labRepository.findLabTestById(id);
    if (!test) {
      throw new AppError('Lab test not found', 404);
    }
    return labRepository.softDeleteLabTest(id);
  }

  // ============ Lab Orders ============

  async createLabOrder(data, orderedById) {
    // Create the lab order
    const labOrder = await labRepository.createLabOrder({
      ...data,
      orderedById,
    });

    // Get the consultation to find the visitId
    const consultation = await labRepository.getConsultationVisitId(data.consultationId);
    
    // Automatically update visit status to WITH_LAB so lab tech can see it
    if (consultation?.visitId) {
      await labRepository.updateVisitStatusForLab(consultation.visitId);
      
      // Auto-charge for lab tests
      try {
        await autoChargeService.chargeLabTests(
          consultation.visitId,
          labOrder.items || [],
          orderedById
        );
      } catch (err) {
        console.error('Failed to auto-charge lab tests:', err);
        // Don't fail the lab order creation
      }
    }

    return labOrder;
  }

  async getLabOrderById(id) {
    const order = await labRepository.findLabOrderById(id);
    if (!order) {
      throw new AppError('Lab order not found', 404);
    }
    return order;
  }

  async listLabOrders(filters) {
    return labRepository.findManyLabOrders(filters);
  }

  async getPendingLabOrders() {
    return labRepository.getPendingLabOrders();
  }

  async updateLabOrder(id, data) {
    const order = await labRepository.findLabOrderById(id);
    if (!order) {
      throw new AppError('Lab order not found', 404);
    }
    return labRepository.updateLabOrder(id, data);
  }

  async collectSample(orderId) {
    const order = await labRepository.findLabOrderById(orderId);
    if (!order) {
      throw new AppError('Lab order not found', 404);
    }
    if (order.status !== 'PENDING') {
      throw new AppError('Sample already collected or order not pending', 400);
    }
    return labRepository.updateLabOrder(orderId, { status: 'SAMPLE_COLLECTED' });
  }

  async cancelLabOrder(id, reason) {
    const order = await labRepository.findLabOrderById(id);
    if (!order) {
      throw new AppError('Lab order not found', 404);
    }
    if (order.status === 'COMPLETED') {
      throw new AppError('Cannot cancel completed order', 400);
    }
    return labRepository.updateLabOrder(id, { 
      status: 'CANCELLED',
      clinicalNotes: `${order.clinicalNotes || ''}\n[CANCELLED]: ${reason}`.trim(),
    });
  }

  // ============ Lab Results ============

  async submitLabResults(labOrderId, results, performedBy) {
    const order = await labRepository.findLabOrderById(labOrderId);
    if (!order) {
      throw new AppError('Lab order not found', 404);
    }
    if (order.status === 'CANCELLED') {
      throw new AppError('Cannot submit results for cancelled order', 400);
    }
    if (order.status === 'COMPLETED') {
      throw new AppError('Results already submitted and verified', 400);
    }

    return labRepository.createLabResults(labOrderId, results, performedBy);
  }

  async getLabResults(labOrderId) {
    const order = await labRepository.findLabOrderById(labOrderId);
    if (!order) {
      throw new AppError('Lab order not found', 404);
    }
    return labRepository.findLabResultsByOrderId(labOrderId);
  }

  async verifyLabResult(resultId, verifiedBy, notes) {
    return labRepository.verifyLabResult(resultId, verifiedBy, notes);
  }

  async verifyAllResults(labOrderId, verifiedBy) {
    const order = await labRepository.findLabOrderById(labOrderId);
    if (!order) {
      throw new AppError('Lab order not found', 404);
    }
    if (order.results.length === 0) {
      throw new AppError('No results to verify', 400);
    }
    return labRepository.verifyAllResultsForOrder(labOrderId, verifiedBy);
  }

  async getPatientLabHistory(patientId) {
    return labRepository.getPatientLabHistory(patientId);
  }
}
