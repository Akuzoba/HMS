import prisma from '../../core/database/prisma.js';

export class ConsultationRepository {
  async create(data) {
    const { 
      visitId, 
      consultedBy,
      chiefComplaint,
      historyOfPresentingIllness,
      pastMedicalHistory,
      ...consultationData 
    } = data;

    // Fetch the visit to get the patientId
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      select: { patientId: true }
    });

    if (!visit) {
      throw new Error('Visit not found');
    }

    // Map frontend field names to Prisma field names
    const mappedData = {
      ...consultationData,
      visitId,
      patientId: visit.patientId,
      doctorId: consultedBy,
      presentingComplaint: chiefComplaint || consultationData.presentingComplaint || '',
      historyOfComplaint: historyOfPresentingIllness || pastMedicalHistory || consultationData.historyOfComplaint,
    };

    return prisma.consultation.create({
      data: mappedData,
      include: {
        visit: {
          include: {
            patient: true,
            vitals: {
              orderBy: { recordedAt: 'desc' },
              take: 1,
            },
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        diagnoses: true,
      },
    });
  }

  async findById(id) {
    return prisma.consultation.findUnique({
      where: { id },
      include: {
        visit: {
          include: {
            patient: true,
            vitals: {
              orderBy: { recordedAt: 'desc' },
            },
          },
        },
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
    });
  }

  async findByVisitId(visitId) {
    return prisma.consultation.findMany({
      where: { visitId },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        diagnoses: true,
      },
      orderBy: { consultedAt: 'desc' },
    });
  }

  async findMany(filters = {}, pagination = {}) {
    const { page = 1, limit = 20, doctorId, status } = { ...filters, ...pagination };
    const skip = (page - 1) * limit;

    const where = {};
    if (doctorId) where.consultedBy = doctorId;
    if (status) where.visit = { status };

    const [consultations, total] = await Promise.all([
      prisma.consultation.findMany({
        where,
        include: {
          visit: {
            include: {
              patient: true,
            },
          },
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { consultedAt: 'desc' },
      }),
      prisma.consultation.count({ where }),
    ]);

    return {
      data: consultations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async update(id, data) {
    return prisma.consultation.update({
      where: { id },
      data,
      include: {
        visit: {
          include: {
            patient: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        diagnoses: true,
      },
    });
  }

  async addDiagnosis(consultationId, diagnosisData) {
    return prisma.diagnosis.create({
      data: {
        ...diagnosisData,
        consultationId,
      },
    });
  }

  async getDiagnoses(consultationId) {
    return prisma.diagnosis.findMany({
      where: { consultationId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
