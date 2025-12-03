import prisma from '../../core/database/prisma.js';

export class PharmacyRepository {
  // =====================
  // DRUG MANAGEMENT
  // =====================
  
  async createDrug(data) {
    // Generate drug code
    const count = await prisma.drug.count();
    const drugCode = `DRG-${String(count + 1).padStart(4, '0')}`;
    
    return prisma.drug.create({
      data: {
        ...data,
        drugCode,
      },
    });
  }

  async findDrugById(id) {
    return prisma.drug.findUnique({
      where: { id },
      include: {
        batches: {
          where: { status: 'ACTIVE' },
          orderBy: { expiryDate: 'asc' },
        },
      },
    });
  }

  async findDrugByCode(drugCode) {
    return prisma.drug.findUnique({
      where: { drugCode },
      include: {
        batches: {
          where: { status: 'ACTIVE' },
          orderBy: { expiryDate: 'asc' },
        },
      },
    });
  }

  async findAllDrugs(filters = {}, pagination = {}) {
    const { page = 1, limit = 50, category, search, lowStock } = { ...filters, ...pagination };
    const skip = (page - 1) * limit;

    const where = { deletedAt: null };
    
    if (category) where.category = category;
    
    if (search) {
      where.OR = [
        { drugName: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { drugCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [drugs, total] = await Promise.all([
      prisma.drug.findMany({
        where,
        skip,
        take: limit,
        orderBy: { drugName: 'asc' },
        include: {
          batches: {
            where: { status: 'ACTIVE', currentStock: { gt: 0 } },
            orderBy: { expiryDate: 'asc' },
            take: 1,
          },
          _count: {
            select: { batches: true },
          },
        },
      }),
      prisma.drug.count({ where }),
    ]);

    return {
      data: drugs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateDrug(id, data) {
    return prisma.drug.update({
      where: { id },
      data,
    });
  }

  async softDeleteDrug(id) {
    return prisma.drug.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async updateDrugStock(drugId) {
    // Calculate total stock from active batches
    const result = await prisma.drugBatch.aggregate({
      where: { drugId, status: 'ACTIVE' },
      _sum: { currentStock: true },
    });

    const totalStock = result._sum.currentStock || 0;

    return prisma.drug.update({
      where: { id: drugId },
      data: { stockQuantity: totalStock },
    });
  }

  // =====================
  // BATCH MANAGEMENT
  // =====================

  async createBatch(data) {
    const drug = await prisma.drug.findUnique({ where: { id: data.drugId } });
    if (!drug) throw new Error('Drug not found');

    const batch = await prisma.drugBatch.create({
      data: {
        ...data,
        currentStock: data.quantity,
      },
      include: { drug: true },
    });

    // Update drug total stock
    await this.updateDrugStock(data.drugId);

    // Log inventory movement
    await this.createInventoryLog({
      drugId: data.drugId,
      batchNumber: data.batchNumber,
      movementType: 'STOCK_IN',
      quantity: data.quantity,
      previousStock: drug.stockQuantity,
      newStock: drug.stockQuantity + data.quantity,
      reason: 'New batch received',
      referenceType: 'PURCHASE_ORDER',
      referenceId: data.purchaseOrderId || null,
      performedById: data.receivedById,
    });

    return batch;
  }

  async findBatchById(id) {
    return prisma.drugBatch.findUnique({
      where: { id },
      include: { drug: true, supplier: true },
    });
  }

  async findBatchesByDrug(drugId, includeExpired = false) {
    const where = { drugId };
    if (!includeExpired) {
      where.status = 'ACTIVE';
      where.expiryDate = { gt: new Date() };
    }

    return prisma.drugBatch.findMany({
      where,
      orderBy: { expiryDate: 'asc' },
      include: { supplier: true },
    });
  }

  async updateBatch(id, data) {
    return prisma.drugBatch.update({
      where: { id },
      data,
    });
  }

  async getExpiringBatches(daysThreshold = 90) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return prisma.drugBatch.findMany({
      where: {
        status: 'ACTIVE',
        currentStock: { gt: 0 },
        expiryDate: {
          lte: thresholdDate,
          gte: new Date(),
        },
      },
      include: { drug: true },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async getExpiredBatches() {
    return prisma.drugBatch.findMany({
      where: {
        status: 'ACTIVE',
        currentStock: { gt: 0 },
        expiryDate: { lt: new Date() },
      },
      include: { drug: true },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async markBatchExpired(batchId, performedById) {
    const batch = await prisma.drugBatch.findUnique({
      where: { id: batchId },
      include: { drug: true },
    });

    if (!batch) throw new Error('Batch not found');

    // Update batch status
    await prisma.drugBatch.update({
      where: { id: batchId },
      data: { status: 'EXPIRED' },
    });

    // Log the expiry
    await this.createInventoryLog({
      drugId: batch.drugId,
      batchNumber: batch.batchNumber,
      movementType: 'EXPIRED',
      quantity: -batch.currentStock,
      previousStock: batch.drug.stockQuantity,
      newStock: batch.drug.stockQuantity - batch.currentStock,
      reason: 'Batch expired',
      performedById,
    });

    // Update drug stock
    await this.updateDrugStock(batch.drugId);

    return batch;
  }

  // =====================
  // INVENTORY LOGS
  // =====================

  async createInventoryLog(data) {
    return prisma.drugInventoryLog.create({ data });
  }

  async getInventoryLogs(drugId, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const where = drugId ? { drugId } : {};

    const [logs, total] = await Promise.all([
      prisma.drugInventoryLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { performedAt: 'desc' },
        include: { drug: true },
      }),
      prisma.drugInventoryLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =====================
  // LOW STOCK ALERTS
  // =====================

  async getLowStockDrugs() {
    return prisma.$queryRaw`
      SELECT * FROM drugs 
      WHERE stock_quantity <= reorder_level 
      AND deleted_at IS NULL 
      AND is_active = true
      ORDER BY stock_quantity ASC
    `;
  }

  async getOutOfStockDrugs() {
    return prisma.drug.findMany({
      where: {
        stockQuantity: 0,
        deletedAt: null,
        isActive: true,
      },
      orderBy: { drugName: 'asc' },
    });
  }

  // =====================
  // DISPENSING
  // =====================

  async createDispensing(data) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.dispensing.count({
      where: {
        createdAt: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
        },
      },
    });
    const dispensingNumber = `DSP-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    return prisma.$transaction(async (tx) => {
      // Create dispensing record
      const dispensing = await tx.dispensing.create({
        data: {
          dispensingNumber,
          prescriptionId: data.prescriptionId,
          patientId: data.patientId,
          visitId: data.visitId,
          dispensedById: data.dispensedById,
          totalAmount: data.totalAmount || 0,
          notes: data.notes,
          items: {
            create: data.items.map(item => ({
              drugId: item.drugId,
              batchNumber: item.batchNumber,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions,
            })),
          },
        },
        include: {
          items: {
            include: { drug: true },
          },
        },
      });

      // Deduct stock from batches using FEFO (First Expiry First Out)
      for (const item of data.items) {
        let remainingQty = item.quantity;
        
        const batches = await tx.drugBatch.findMany({
          where: {
            drugId: item.drugId,
            status: 'ACTIVE',
            currentStock: { gt: 0 },
            expiryDate: { gt: new Date() },
          },
          orderBy: { expiryDate: 'asc' },
        });

        for (const batch of batches) {
          if (remainingQty <= 0) break;

          const deductQty = Math.min(batch.currentStock, remainingQty);
          
          await tx.drugBatch.update({
            where: { id: batch.id },
            data: { 
              currentStock: batch.currentStock - deductQty,
              status: batch.currentStock - deductQty === 0 ? 'DEPLETED' : 'ACTIVE',
            },
          });

          remainingQty -= deductQty;
        }

        if (remainingQty > 0) {
          throw new Error(`Insufficient stock for drug: ${item.drugId}`);
        }

        // Update drug total stock
        const drug = await tx.drug.findUnique({ where: { id: item.drugId } });
        await tx.drug.update({
          where: { id: item.drugId },
          data: { stockQuantity: drug.stockQuantity - item.quantity },
        });

        // Log inventory movement
        await tx.drugInventoryLog.create({
          data: {
            drugId: item.drugId,
            movementType: 'DISPENSED',
            quantity: -item.quantity,
            previousStock: drug.stockQuantity,
            newStock: drug.stockQuantity - item.quantity,
            reason: 'Dispensed to patient',
            referenceType: 'DISPENSING',
            referenceId: dispensing.id,
            performedById: data.dispensedById,
          },
        });
      }

      // Update prescription status if linked
      if (data.prescriptionId) {
        await tx.prescription.update({
          where: { id: data.prescriptionId },
          data: {
            status: 'DISPENSED',
            dispensedAt: new Date(),
            dispensedBy: data.dispensedById,
          },
        });
      }

      return dispensing;
    });
  }

  async findDispensingById(id) {
    return prisma.dispensing.findUnique({
      where: { id },
      include: {
        items: {
          include: { drug: true },
        },
      },
    });
  }

  async findAllDispensings(filters = {}, pagination = {}) {
    const { page = 1, limit = 50, patientId, startDate, endDate } = { ...filters, ...pagination };
    const skip = (page - 1) * limit;

    const where = {};
    if (patientId) where.patientId = patientId;
    if (startDate || endDate) {
      where.dispensedAt = {};
      if (startDate) where.dispensedAt.gte = new Date(startDate);
      if (endDate) where.dispensedAt.lte = new Date(endDate);
    }

    const [dispensings, total] = await Promise.all([
      prisma.dispensing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dispensedAt: 'desc' },
        include: {
          items: {
            include: { drug: true },
          },
        },
      }),
      prisma.dispensing.count({ where }),
    ]);

    return {
      data: dispensings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =====================
  // SUPPLIERS
  // =====================

  async createSupplier(data) {
    const count = await prisma.supplier.count();
    const supplierCode = `SUP-${String(count + 1).padStart(4, '0')}`;

    return prisma.supplier.create({
      data: {
        ...data,
        supplierCode,
      },
    });
  }

  async findSupplierById(id) {
    return prisma.supplier.findUnique({
      where: { id },
    });
  }

  async findAllSuppliers(pagination = {}) {
    const { page = 1, limit = 50, search } = pagination;
    const skip = (page - 1) * limit;

    const where = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { supplierCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      data: suppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateSupplier(id, data) {
    return prisma.supplier.update({
      where: { id },
      data,
    });
  }

  // =====================
  // STOCK ALERTS
  // =====================

  async createStockAlert(data) {
    return prisma.stockAlert.create({ data });
  }

  async getActiveAlerts() {
    return prisma.stockAlert.findMany({
      where: { isResolved: false },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async resolveAlert(id, resolvedById) {
    return prisma.stockAlert.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedById,
      },
    });
  }

  // =====================
  // DASHBOARD STATS
  // =====================

  async getPharmacyStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + 90);

    const [
      totalDrugs,
      outOfStockCount,
      expiringCount,
      todayDispensings,
      activeAlerts,
    ] = await Promise.all([
      prisma.drug.count({ where: { deletedAt: null, isActive: true } }),
      prisma.drug.count({ where: { stockQuantity: 0, deletedAt: null, isActive: true } }),
      prisma.drugBatch.count({
        where: {
          status: 'ACTIVE',
          currentStock: { gt: 0 },
          expiryDate: {
            lte: thresholdDate,
            gte: new Date(),
          },
        },
      }),
      prisma.dispensing.count({
        where: {
          dispensedAt: { gte: today },
        },
      }),
      prisma.stockAlert.count({ where: { isResolved: false } }),
    ]);

    // Get low stock count with raw query
    const lowStockResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM drugs 
      WHERE stock_quantity <= reorder_level 
      AND stock_quantity > 0
      AND deleted_at IS NULL 
      AND is_active = true
    `;

    return {
      totalDrugs,
      lowStockCount: lowStockResult[0]?.count || 0,
      outOfStockCount,
      expiringCount,
      todayDispensings,
      activeAlerts,
    };
  }
}
