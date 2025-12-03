import { ServiceRepository } from './repository.js';
import { AppError } from '../../core/middleware/errorHandler.js';

const serviceRepository = new ServiceRepository();

export class ServiceService {
  // Hospital Services
  async createService(data) {
    // Check for duplicate service code
    const existing = await serviceRepository.findServiceByCode(data.serviceCode);
    if (existing) {
      throw new AppError('Service code already exists', 400);
    }

    return serviceRepository.createService(data);
  }

  async getServiceById(id) {
    const service = await serviceRepository.findServiceById(id);
    if (!service) {
      throw new AppError('Service not found', 404);
    }
    return service;
  }

  async listServices(filters = {}) {
    return serviceRepository.findAllServices(filters);
  }

  async updateService(id, data) {
    const service = await serviceRepository.findServiceById(id);
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    // If updating service code, check for duplicates
    if (data.serviceCode && data.serviceCode !== service.serviceCode) {
      const existing = await serviceRepository.findServiceByCode(data.serviceCode);
      if (existing) {
        throw new AppError('Service code already exists', 400);
      }
    }

    return serviceRepository.updateService(id, data);
  }

  async deleteService(id) {
    const service = await serviceRepository.findServiceById(id);
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    return serviceRepository.deleteService(id);
  }

  // Visit Charges
  async chargeService(visitId, serviceId, quantity = 1, notes = null, chargedById = null) {
    const service = await serviceRepository.findServiceById(serviceId);
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    if (!service.isActive) {
      throw new AppError('Service is not active', 400);
    }

    const totalPrice = service.unitPrice * quantity;

    return serviceRepository.createVisitCharge({
      visitId,
      serviceId,
      serviceName: service.serviceName,
      quantity,
      unitPrice: service.unitPrice,
      totalPrice,
      notes,
      chargedById,
    });
  }

  async chargeServiceByCode(visitId, serviceCode, quantity = 1, notes = null, chargedById = null) {
    const service = await serviceRepository.findServiceByCode(serviceCode);
    if (!service) {
      throw new AppError(`Service with code ${serviceCode} not found`, 404);
    }

    return this.chargeService(visitId, service.id, quantity, notes, chargedById);
  }

  async chargeServiceByCategory(visitId, category, serviceName = null, quantity = 1, notes = null, chargedById = null) {
    const service = await serviceRepository.findServiceForCharge(category, serviceName);
    if (!service) {
      // If no service found, skip charging (service might not be set up yet)
      console.warn(`No active service found for category: ${category}`);
      return null;
    }

    return this.chargeService(visitId, service.id, quantity, notes, chargedById);
  }

  async getVisitCharges(visitId) {
    return serviceRepository.findVisitCharges(visitId);
  }

  async getVisitTotal(visitId) {
    return serviceRepository.getVisitTotal(visitId);
  }

  async removeCharge(chargeId) {
    return serviceRepository.deleteVisitCharge(chargeId);
  }

  async getUnbilledCharges(visitId) {
    return serviceRepository.getUnbilledCharges(visitId);
  }
}

// Export singleton for use in other modules
export const serviceService = new ServiceService();
