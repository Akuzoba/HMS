import prisma from '../../core/database/prisma.js';

export class BillingRepository {
  async createBill(data, issuedById) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const count = await prisma.bill.count({
      where: {
        createdAt: { gte: todayStart },
      },
    });

    const billNumber = `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const { items, ...billData } = data;
    
    // Calculate total
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    return prisma.bill.create({
      data: {
        ...billData,
        billNumber,
        issuedById,
        totalAmount,
        balance: totalAmount,
        items: {
          create: items.map(item => ({
            ...item,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        patient: true,
        issuedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        items: true,
        payments: true,
      },
    });
  }

  async findBillById(id) {
    return prisma.bill.findUnique({
      where: { id },
      include: {
        patient: true,
        issuedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        items: true,
        payments: true,
      },
    });
  }

  async findBillByNumber(billNumber) {
    return prisma.bill.findUnique({
      where: { billNumber },
      include: {
        patient: true,
        items: true,
        payments: true,
      },
    });
  }

  async findManyBills(filters = {}) {
    const { patientId, status, page = 1, limit = 20 } = filters;

    const where = {};

    if (patientId) where.patientId = patientId;
    if (status) {
      const statusArray = status.split(',').map(s => s.trim());
      where.status = statusArray.length > 1 ? { in: statusArray } : status;
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: {
          patient: true,
          items: true,
          payments: true,
        },
        orderBy: { issuedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bill.count({ where }),
    ]);

    return {
      bills,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getPendingBills() {
    return prisma.bill.findMany({
      where: {
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
      },
      include: {
        patient: true,
        items: true,
        payments: true,
      },
      orderBy: { issuedAt: 'asc' },
    });
  }

  async getPatientBills(patientId) {
    return prisma.bill.findMany({
      where: { patientId },
      include: {
        items: true,
        payments: true,
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async updateBill(id, data) {
    return prisma.bill.update({
      where: { id },
      data,
      include: {
        patient: true,
        items: true,
        payments: true,
      },
    });
  }

  async createPayment(paymentData, receivedBy) {
    const { billId, amount, paymentMethod, reference, notes } = paymentData;

    // Get current bill
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
    });

    if (!bill) throw new Error('Bill not found');

    const newAmountPaid = bill.amountPaid + amount;
    const newBalance = bill.totalAmount - newAmountPaid;
    
    let newStatus = 'PARTIALLY_PAID';
    let paidAt = null;
    
    if (newBalance <= 0) {
      newStatus = 'PAID';
      paidAt = new Date();
    }

    // Create payment and update bill in transaction
    const [payment, updatedBill] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          billId,
          amount,
          paymentMethod,
          reference,
          notes,
          receivedBy,
        },
      }),
      prisma.bill.update({
        where: { id: billId },
        data: {
          amountPaid: newAmountPaid,
          balance: Math.max(0, newBalance),
          status: newStatus,
          paymentMethod: paymentMethod,
          paidAt,
        },
        include: {
          patient: true,
          items: true,
          payments: true,
        },
      }),
    ]);

    return { payment, bill: updatedBill };
  }

  async getPaymentsByBillId(billId) {
    return prisma.payment.findMany({
      where: { billId },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async getVisitCharges(visitId) {
    const charges = await prisma.visitCharge.findMany({
      where: { visitId },
      include: {
        service: true,
      },
      orderBy: { chargedAt: 'asc' },
    });

    const total = charges.reduce((sum, charge) => sum + charge.totalPrice, 0);

    return { charges, total };
  }

  async getBillingStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPending,
      totalPaid,
      todayCollections,
      pendingCount,
    ] = await Promise.all([
      prisma.bill.aggregate({
        where: { status: { in: ['UNPAID', 'PARTIALLY_PAID'] } },
        _sum: { balance: true },
      }),
      prisma.bill.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.payment.aggregate({
        where: { paymentDate: { gte: today } },
        _sum: { amount: true },
      }),
      prisma.bill.count({
        where: { status: { in: ['UNPAID', 'PARTIALLY_PAID'] } },
      }),
    ]);

    return {
      totalPending: totalPending._sum.balance || 0,
      totalPaid: totalPaid._sum.totalAmount || 0,
      todayCollections: todayCollections._sum.amount || 0,
      pendingCount,
    };
  }

  // Create bill from visit charges
  async createBillFromVisit(visitId, issuedById, notes = null) {
    // Get visit with patient and charges
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        patient: true,
        visitCharges: {
          where: { status: 'PENDING' },
          include: { service: true },
        },
      },
    });

    if (!visit) throw new Error('Visit not found');
    if (visit.visitCharges.length === 0) throw new Error('No charges found for this visit');

    // Generate bill number
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const count = await prisma.bill.count({
      where: { createdAt: { gte: todayStart } },
    });
    const billNumber = `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    // Calculate total from charges
    const totalAmount = visit.visitCharges.reduce((sum, charge) => sum + charge.totalPrice, 0);

    // Get charge IDs to update
    const chargeIds = visit.visitCharges.map(c => c.id);

    // Create bill and update charges/visit in transaction
    const [bill] = await prisma.$transaction([
      prisma.bill.create({
        data: {
          billNumber,
          patientId: visit.patientId,
          issuedById,
          totalAmount,
          balance: totalAmount,
          notes: notes || `Bill for visit ${visit.visitNumber}`,
          items: {
            create: visit.visitCharges.map(charge => ({
              itemType: charge.service.category,
              description: charge.serviceName,
              quantity: charge.quantity,
              unitPrice: charge.unitPrice,
              totalPrice: charge.totalPrice,
            })),
          },
        },
        include: {
          patient: true,
          issuedBy: { select: { id: true, firstName: true, lastName: true } },
          items: true,
          payments: true,
        },
      }),
      // Mark charges as billed
      prisma.visitCharge.updateMany({
        where: { id: { in: chargeIds } },
        data: { status: 'BILLED' },
      }),
      // Update visit status to DISCHARGED after billing
      prisma.visit.update({
        where: { id: visitId },
        data: { status: 'DISCHARGED' },
      }),
    ]);

    return bill;
  }

  // Get all payments (payment history)
  async getAllPayments(filters = {}) {
    const { page = 1, limit = 50, startDate, endDate } = filters;

    const where = {};
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          bill: {
            include: {
              patient: true,
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get visits ready for billing (BILLING status with pending charges)
  async getVisitsReadyForBilling() {
    return prisma.visit.findMany({
      where: {
        status: 'BILLING',
        visitCharges: {
          some: { status: 'PENDING' },
        },
      },
      include: {
        patient: true,
        visitCharges: {
          include: { service: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
