import prisma from '../../core/database/prisma.js';

export class LabRepository {
  // ============ Lab Tests ============
  
  async createLabTest(data) {
    return prisma.labTest.create({ data });
  }

  async findLabTestById(id) {
    return prisma.labTest.findUnique({
      where: { id },
    });
  }

  async findLabTestByCode(testCode) {
    return prisma.labTest.findUnique({
      where: { testCode },
    });
  }

  async findManyLabTests(filters = {}) {
    const { category, isActive, page = 1, limit = 50 } = filters;

    const where = {
      deletedAt: null,
    };

    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive;

    const [tests, total] = await Promise.all([
      prisma.labTest.findMany({
        where,
        orderBy: [{ category: 'asc' }, { testName: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.labTest.count({ where }),
    ]);

    return {
      tests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateLabTest(id, data) {
    return prisma.labTest.update({
      where: { id },
      data,
    });
  }

  async softDeleteLabTest(id) {
    return prisma.labTest.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // ============ Visit Status Update ============

  async updateVisitStatusForLab(visitId) {
    return prisma.visit.update({
      where: { id: visitId },
      data: { status: 'WITH_LAB' },
    });
  }

  async getConsultationVisitId(consultationId) {
    return prisma.consultation.findUnique({
      where: { id: consultationId },
      select: { visitId: true },
    });
  }

  // ============ Lab Orders ============

  async createLabOrder(data) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    // Get count of orders today for sequence number
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const count = await prisma.labOrder.count({
      where: {
        createdAt: { gte: todayStart },
      },
    });

    const orderNumber = `LO-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const { tests, ...orderData } = data;

    return prisma.labOrder.create({
      data: {
        ...orderData,
        orderNumber,
        items: {
          create: tests.map(test => ({
            labTestId: test.labTestId,
          })),
        },
      },
      include: {
        patient: true,
        orderedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        items: {
          include: {
            labTest: true,
          },
        },
      },
    });
  }

  async findLabOrderById(id) {
    return prisma.labOrder.findUnique({
      where: { id },
      include: {
        patient: true,
        consultation: true,
        orderedBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        items: {
          include: {
            labTest: true,
          },
        },
        results: true,
      },
    });
  }

  async findManyLabOrders(filters = {}) {
    const { patientId, status, priority, page = 1, limit = 20 } = filters;

    const where = {};

    if (patientId) where.patientId = patientId;
    if (priority) where.priority = priority;
    
    if (status) {
      const statusArray = status.split(',').map(s => s.trim());
      where.status = statusArray.length > 1 ? { in: statusArray } : status;
    }

    const [orders, total] = await Promise.all([
      prisma.labOrder.findMany({
        where,
        include: {
          patient: true,
          orderedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          items: {
            include: {
              labTest: true,
            },
          },
          results: true,
        },
        orderBy: [
          { priority: 'desc' }, // STAT first
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.labOrder.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getPendingLabOrders() {
    return prisma.labOrder.findMany({
      where: {
        status: { in: ['PENDING', 'SAMPLE_COLLECTED', 'IN_PROGRESS'] },
      },
      include: {
        patient: true,
        orderedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        items: {
          include: {
            labTest: true,
          },
        },
        results: true,
      },
      orderBy: [
        { priority: 'desc' },
        { orderedAt: 'asc' },
      ],
    });
  }

  async updateLabOrder(id, data) {
    return prisma.labOrder.update({
      where: { id },
      data: {
        ...data,
        ...(data.status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
      include: {
        patient: true,
        items: {
          include: {
            labTest: true,
          },
        },
        results: true,
      },
    });
  }

  async updateLabOrderItemStatus(itemId, status) {
    return prisma.labOrderItem.update({
      where: { id: itemId },
      data: { status },
    });
  }

  // ============ Lab Results ============

  async createLabResults(labOrderId, results, performedBy) {
    const createdResults = await prisma.$transaction(
      results.map(result =>
        prisma.labResult.create({
          data: {
            labOrderId,
            ...result,
            performedBy,
          },
        })
      )
    );

    // Update order status to IN_PROGRESS
    await prisma.labOrder.update({
      where: { id: labOrderId },
      data: { status: 'IN_PROGRESS' },
    });

    return createdResults;
  }

  async findLabResultsByOrderId(labOrderId) {
    return prisma.labResult.findMany({
      where: { labOrderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async verifyLabResult(resultId, verifiedBy, notes) {
    return prisma.labResult.update({
      where: { id: resultId },
      data: {
        verifiedBy,
        verifiedAt: new Date(),
        notes: notes || undefined,
      },
    });
  }

  async verifyAllResultsForOrder(labOrderId, verifiedBy) {
    await prisma.labResult.updateMany({
      where: { labOrderId, verifiedAt: null },
      data: {
        verifiedBy,
        verifiedAt: new Date(),
      },
    });

    // Get the lab order with consultation to find the visit
    const labOrder = await prisma.labOrder.findUnique({
      where: { id: labOrderId },
      include: {
        consultation: {
          include: {
            visit: true,
          },
        },
      },
    });

    // Route patient back to doctor by updating visit status
    if (labOrder?.consultation?.visitId) {
      await prisma.visit.update({
        where: { id: labOrder.consultation.visitId },
        data: { status: 'WITH_DOCTOR' },
      });
    }

    // Update order status to COMPLETED
    return prisma.labOrder.update({
      where: { id: labOrderId },
      data: { 
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        patient: true,
        results: true,
        consultation: {
          include: {
            doctor: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  async getPatientLabHistory(patientId) {
    return prisma.labOrder.findMany({
      where: { patientId },
      include: {
        items: {
          include: {
            labTest: true,
          },
        },
        results: true,
        orderedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { orderedAt: 'desc' },
    });
  }
}
