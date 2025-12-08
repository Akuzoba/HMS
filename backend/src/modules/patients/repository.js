import prisma from '../../core/database/prisma.js';
import { 
  generateFuzzySearchConditions, 
  normalizePhone, 
  soundex 
} from '../../core/utils/mpi.js';

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

  /**
   * Find potential duplicate patients based on MPI criteria
   * Used during registration to prevent duplicate records
   * @param {object} patientData - Patient data to check
   * @returns {array} - Array of potential matching patients
   */
  async findPotentialDuplicates(patientData) {
    const conditions = [];

    // 1. Exact phone match (strongest indicator)
    if (patientData.phoneNumber) {
      const normalizedPhone = normalizePhone(patientData.phoneNumber);
      conditions.push({
        phoneNumber: { contains: normalizedPhone.slice(-9) }
      });
    }

    // 2. Name-based fuzzy matching
    if (patientData.firstName && patientData.lastName) {
      // Exact name match
      conditions.push({
        AND: [
          { firstName: { equals: patientData.firstName, mode: 'insensitive' } },
          { lastName: { equals: patientData.lastName, mode: 'insensitive' } }
        ]
      });

      // Partial name matches (first 3 chars)
      if (patientData.firstName.length >= 3 && patientData.lastName.length >= 3) {
        conditions.push({
          AND: [
            { firstName: { startsWith: patientData.firstName.slice(0, 3), mode: 'insensitive' } },
            { lastName: { startsWith: patientData.lastName.slice(0, 3), mode: 'insensitive' } }
          ]
        });
      }

      // Swapped first/last name (common data entry error)
      conditions.push({
        AND: [
          { firstName: { equals: patientData.lastName, mode: 'insensitive' } },
          { lastName: { equals: patientData.firstName, mode: 'insensitive' } }
        ]
      });
    }

    // 3. DOB + partial name match
    if (patientData.dateOfBirth && patientData.lastName) {
      const dob = new Date(patientData.dateOfBirth);
      conditions.push({
        AND: [
          { dateOfBirth: dob },
          { lastName: { startsWith: patientData.lastName.slice(0, 3), mode: 'insensitive' } }
        ]
      });
    }

    // Execute search
    const potentialMatches = await prisma.patient.findMany({
      where: {
        deletedAt: null,
        OR: conditions
      },
      select: {
        id: true,
        patientNumber: true,
        firstName: true,
        middleName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        phoneNumber: true,
        email: true,
        address: true,
        createdAt: true,
        visits: {
          orderBy: { visitDate: 'desc' },
          take: 1,
          select: {
            visitDate: true,
            visitType: true
          }
        }
      },
      take: 20 // Limit results
    });

    return potentialMatches;
  }

  /**
   * Advanced fuzzy search with ranking
   * @param {string} searchTerm - Search term
   * @param {number} skip - Pagination offset
   * @param {number} take - Pagination limit
   * @returns {object} - { patients, total }
   */
  async fuzzySearch(searchTerm, skip, take) {
    const conditions = generateFuzzySearchConditions(searchTerm);
    
    if (conditions.length === 0) {
      return { patients: [], total: 0 };
    }

    const where = {
      deletedAt: null,
      OR: conditions
    };

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          visits: {
            orderBy: { visitDate: 'desc' },
            take: 1,
            select: {
              visitDate: true,
              status: true
            }
          }
        }
      }),
      prisma.patient.count({ where })
    ]);

    return { patients, total };
  }

  /**
   * Find patients by exact phone number
   * @param {string} phoneNumber - Phone number to search
   * @returns {array} - Matching patients
   */
  async findByPhone(phoneNumber) {
    const normalized = normalizePhone(phoneNumber);
    if (!normalized || normalized.length < 9) return [];

    return await prisma.patient.findMany({
      where: {
        deletedAt: null,
        phoneNumber: { contains: normalized.slice(-9) }
      }
    });
  }

  /**
   * Find patients by date of birth
   * @param {Date} dateOfBirth - DOB to search
   * @returns {array} - Matching patients
   */
  async findByDOB(dateOfBirth) {
    const dob = new Date(dateOfBirth);
    
    return await prisma.patient.findMany({
      where: {
        deletedAt: null,
        dateOfBirth: dob
      }
    });
  }
}
