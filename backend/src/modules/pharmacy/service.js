import { PharmacyRepository } from './repository.js';
import { AppError } from '../../core/middleware/errorHandler.js';

const pharmacyRepository = new PharmacyRepository();

export class PharmacyService {
  // =====================
  // DRUG MANAGEMENT
  // =====================

  async createDrug(data) {
    return pharmacyRepository.createDrug(data);
  }

  async getDrugById(id) {
    const drug = await pharmacyRepository.findDrugById(id);
    if (!drug) {
      throw new AppError('Drug not found', 404);
    }
    return drug;
  }

  async getDrugByCode(drugCode) {
    const drug = await pharmacyRepository.findDrugByCode(drugCode);
    if (!drug) {
      throw new AppError('Drug not found', 404);
    }
    return drug;
  }

  async listDrugs(filters, pagination) {
    return pharmacyRepository.findAllDrugs(filters, pagination);
  }

  async updateDrug(id, data) {
    const drug = await pharmacyRepository.findDrugById(id);
    if (!drug) {
      throw new AppError('Drug not found', 404);
    }
    return pharmacyRepository.updateDrug(id, data);
  }

  async deleteDrug(id) {
    const drug = await pharmacyRepository.findDrugById(id);
    if (!drug) {
      throw new AppError('Drug not found', 404);
    }
    return pharmacyRepository.softDeleteDrug(id);
  }

  // =====================
  // BATCH MANAGEMENT
  // =====================

  async addBatch(data) {
    // Validate expiry date
    if (new Date(data.expiryDate) <= new Date()) {
      throw new AppError('Expiry date must be in the future', 400);
    }

    return pharmacyRepository.createBatch({
      ...data,
      expiryDate: new Date(data.expiryDate),
      receivedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
    });
  }

  async getBatchById(id) {
    const batch = await pharmacyRepository.findBatchById(id);
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
    return batch;
  }

  async getBatchesByDrug(drugId, includeExpired = false) {
    return pharmacyRepository.findBatchesByDrug(drugId, includeExpired);
  }

  async updateBatch(id, data) {
    const batch = await pharmacyRepository.findBatchById(id);
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }

    if (data.expiryDate) {
      data.expiryDate = new Date(data.expiryDate);
    }

    return pharmacyRepository.updateBatch(id, data);
  }

  async getExpiringBatches(daysThreshold = 90) {
    return pharmacyRepository.getExpiringBatches(daysThreshold);
  }

  async getExpiredBatches() {
    return pharmacyRepository.getExpiredBatches();
  }

  async markBatchExpired(batchId, performedById) {
    try {
      return await pharmacyRepository.markBatchExpired(batchId, performedById);
    } catch (error) {
      if (error.message === 'Batch not found') {
        throw new AppError('Batch not found', 404);
      }
      throw error;
    }
  }

  // =====================
  // INVENTORY
  // =====================

  async getInventoryLogs(drugId, pagination) {
    return pharmacyRepository.getInventoryLogs(drugId, pagination);
  }

  async getLowStockDrugs() {
    return pharmacyRepository.getLowStockDrugs();
  }

  async getOutOfStockDrugs() {
    return pharmacyRepository.getOutOfStockDrugs();
  }

  async adjustStock(drugId, adjustment, reason, performedById) {
    const drug = await pharmacyRepository.findDrugById(drugId);
    if (!drug) {
      throw new AppError('Drug not found', 404);
    }

    const newStock = drug.stockQuantity + adjustment;
    if (newStock < 0) {
      throw new AppError('Stock cannot be negative', 400);
    }

    // Log the adjustment
    await pharmacyRepository.createInventoryLog({
      drugId,
      movementType: 'ADJUSTMENT',
      quantity: adjustment,
      previousStock: drug.stockQuantity,
      newStock,
      reason,
      performedById,
    });

    return pharmacyRepository.updateDrug(drugId, { stockQuantity: newStock });
  }

  // =====================
  // DISPENSING
  // =====================

  async createDispensing(data) {
    // Validate items
    if (!data.items || data.items.length === 0) {
      throw new AppError('At least one item is required', 400);
    }

    // Check stock availability for each item
    for (const item of data.items) {
      const drug = await pharmacyRepository.findDrugById(item.drugId);
      if (!drug) {
        throw new AppError(`Drug not found: ${item.drugId}`, 404);
      }
      if (drug.stockQuantity < item.quantity) {
        throw new AppError(`Insufficient stock for ${drug.drugName}. Available: ${drug.stockQuantity}`, 400);
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const item of data.items) {
      const drug = await pharmacyRepository.findDrugById(item.drugId);
      item.unitPrice = item.unitPrice || drug.unitPrice;
      totalAmount += item.quantity * item.unitPrice;
    }
    data.totalAmount = totalAmount;

    try {
      return await pharmacyRepository.createDispensing(data);
    } catch (error) {
      if (error.message.includes('Insufficient stock')) {
        throw new AppError(error.message, 400);
      }
      throw error;
    }
  }

  async getDispensingById(id) {
    const dispensing = await pharmacyRepository.findDispensingById(id);
    if (!dispensing) {
      throw new AppError('Dispensing record not found', 404);
    }
    return dispensing;
  }

  async listDispensings(filters, pagination) {
    return pharmacyRepository.findAllDispensings(filters, pagination);
  }

  // =====================
  // SUPPLIERS
  // =====================

  async createSupplier(data) {
    return pharmacyRepository.createSupplier(data);
  }

  async getSupplierById(id) {
    const supplier = await pharmacyRepository.findSupplierById(id);
    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }
    return supplier;
  }

  async listSuppliers(pagination) {
    return pharmacyRepository.findAllSuppliers(pagination);
  }

  async updateSupplier(id, data) {
    const supplier = await pharmacyRepository.findSupplierById(id);
    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }
    return pharmacyRepository.updateSupplier(id, data);
  }

  // =====================
  // ALERTS
  // =====================

  async getActiveAlerts() {
    return pharmacyRepository.getActiveAlerts();
  }

  async resolveAlert(id, resolvedById) {
    return pharmacyRepository.resolveAlert(id, resolvedById);
  }

  async generateAlerts() {
    // Get low stock drugs and create alerts
    const lowStockDrugs = await pharmacyRepository.getLowStockDrugs();
    for (const drug of lowStockDrugs) {
      await pharmacyRepository.createStockAlert({
        alertType: drug.stockQuantity === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
        drugId: drug.id,
        message: drug.stockQuantity === 0 
          ? `${drug.drugName} is out of stock`
          : `${drug.drugName} is low on stock (${drug.stockQuantity} remaining)`,
        severity: drug.stockQuantity === 0 ? 'CRITICAL' : 'WARNING',
        currentStock: drug.stockQuantity,
        reorderLevel: drug.reorderLevel,
      });
    }

    // Get expiring batches and create alerts
    const expiringBatches = await pharmacyRepository.getExpiringBatches(30);
    for (const batch of expiringBatches) {
      const daysUntilExpiry = Math.ceil((batch.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      await pharmacyRepository.createStockAlert({
        alertType: 'EXPIRING_SOON',
        drugId: batch.drugId,
        batchNumber: batch.batchNumber,
        message: `${batch.drug.drugName} batch ${batch.batchNumber} expires in ${daysUntilExpiry} days`,
        severity: daysUntilExpiry <= 7 ? 'CRITICAL' : 'WARNING',
        expiryDate: batch.expiryDate,
      });
    }

    return { message: 'Alerts generated successfully' };
  }

  // =====================
  // DASHBOARD
  // =====================

  async getPharmacyStats() {
    return pharmacyRepository.getPharmacyStats();
  }
}
