import prisma from '../../core/database/prisma.js';

export class PatientRepository {
  async create(data) {
    // Generate patient number
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    // Count today's patients
    const count = await prisma.patient.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0))
        }
      }
    });

    const patientNumber = `PT-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    return await prisma.patient.create({
      data: {
        ...data,
        patientNumber
      }
    });
  }

  async findById(id) {
    return await prisma.patient.findUnique({
      where: { id, deletedAt: null },
      include: {
        visits: {
          orderBy: { visitDate: 'desc' },
          take: 5
        }
      }
    });
  }

  async findByPatientNumber(patientNumber) {
    return await prisma.patient.findUnique({
      where: { patientNumber, deletedAt: null }
    });
  }

  async search(searchTerm, skip, take) {
    const where = {
      deletedAt: null,
      OR: [
        { patientNumber: { contains: searchTerm, mode: 'insensitive' } },
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { phoneNumber: { contains: searchTerm } },
        { email: { contains: searchTerm, mode: 'insensitive' } }
      ]
    };

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.patient.count({ where })
    ]);

    return { patients, total };
  }

  async list(skip, take) {
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where: { deletedAt: null },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.patient.count({ where: { deletedAt: null } })
    ]);

    return { patients, total };
  }

  async update(id, data) {
    return await prisma.patient.update({
      where: { id },
      data
    });
  }

  async softDelete(id) {
    return await prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async getVisitHistory(patientId, skip, take) {
    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where: { patientId },
        skip,
        take,
        orderBy: { visitDate: 'desc' },
        include: {
          vitals: true,
          consultations: {
            include: {
              doctor: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      }),
      prisma.visit.count({ where: { patientId } })
    ]);

    return { visits, total };
  }
}
