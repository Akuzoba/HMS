import prisma from '../../core/database/prisma.js';

export class VisitRepository {
  async create(data) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    // Get count of visits today for sequence number
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const count = await prisma.visit.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    });

    const visitNumber = `V-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    return prisma.visit.create({
      data: {
        ...data,
        visitNumber,
      },
      include: {
        patient: true,
      },
    });
  }

  async findById(id) {
    return prisma.visit.findUnique({
      where: { id },
      include: {
        patient: true,
        vitals: true,
        consultations: {
          include: {
            doctor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
            diagnoses: true,
            prescriptions: {
              include: {
                items: {
                  include: {
                    drug: true,
                  },
                },
              },
            },
            labOrders: {
              include: {
                items: {
                  include: {
                    labTest: true,
                  },
                },
                results: true,
              },
            },
          },
        },
      },
    });
  }

  async findMany(filters = {}) {
    const { patientId, status, visitType, page = 1, limit = 20 } = filters;
    
    const where = {};

    if (patientId) where.patientId = patientId;
    if (status) {
      // Handle comma-separated status values
      const statusArray = status.split(',').map(s => s.trim());
      where.status = statusArray.length > 1 ? { in: statusArray } : status;
    }
    if (visitType) where.visitType = visitType;

    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        include: {
          patient: true,
          vitals: {
            orderBy: { recordedAt: 'desc' },
            take: 1,
          },
          consultations: {
            include: {
              labOrders: {
                where: { status: 'COMPLETED' },
                include: {
                  results: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.visit.count({ where }),
    ]);

    return {
      visits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async update(id, data) {
    return prisma.visit.update({
      where: { id },
      data,
      include: {
        patient: true,
      },
    });
  }

  async delete(id) {
    return prisma.visit.delete({
      where: { id },
    });
  }

  async getPatientVisits(patientId) {
    return prisma.visit.findMany({
      where: {
        patientId,
      },
      include: {
        vitals: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
