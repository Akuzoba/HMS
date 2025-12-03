import prisma from '../../core/database/prisma.js';

export class IPDRepository {
  // =====================
  // WARD MANAGEMENT
  // =====================

  async createWard(data) {
    const count = await prisma.ward.count();
    const wardCode = `WARD-${String(count + 1).padStart(3, '0')}`;

    return prisma.ward.create({
      data: {
        ...data,
        wardCode,
      },
    });
  }

  async findWardById(id) {
    return prisma.ward.findUnique({
      where: { id },
      include: {
        beds: true,
        _count: {
          select: {
            beds: true,
            admissions: { where: { status: 'ADMITTED' } },
          },
        },
      },
    });
  }

  async findAllWards(filters = {}) {
    const { wardType, isActive = true } = filters;
    const where = {};
    
    if (wardType) where.wardType = wardType;
    if (isActive !== undefined) where.isActive = isActive;

    return prisma.ward.findMany({
      where,
      include: {
        _count: {
          select: {
            beds: true,
          },
        },
        beds: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { wardName: 'asc' },
    });
  }

  async updateWard(id, data) {
    return prisma.ward.update({
      where: { id },
      data,
    });
  }

  async getWardOccupancy() {
    const wards = await prisma.ward.findMany({
      where: { isActive: true },
      include: {
        beds: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    return wards.map(ward => {
      const totalBeds = ward.beds.length;
      const occupiedBeds = ward.beds.filter(b => b.status === 'OCCUPIED').length;
      const availableBeds = ward.beds.filter(b => b.status === 'AVAILABLE').length;
      
      return {
        ...ward,
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      };
    });
  }

  // =====================
  // BED MANAGEMENT
  // =====================

  async createBed(data) {
    const bed = await prisma.bed.create({
      data,
      include: { ward: true },
    });

    // Update ward total beds count
    await prisma.ward.update({
      where: { id: data.wardId },
      data: {
        totalBeds: { increment: 1 },
      },
    });

    return bed;
  }

  async createMultipleBeds(wardId, bedData, count) {
    const ward = await prisma.ward.findUnique({ where: { id: wardId } });
    if (!ward) throw new Error('Ward not found');

    const existingBeds = await prisma.bed.count({ where: { wardId } });
    const beds = [];

    for (let i = 1; i <= count; i++) {
      const bedNumber = `${ward.wardCode}-B${String(existingBeds + i).padStart(2, '0')}`;
      beds.push({
        wardId,
        bedNumber,
        ...bedData,
      });
    }

    await prisma.bed.createMany({ data: beds });

    // Update ward total beds count
    await prisma.ward.update({
      where: { id: wardId },
      data: {
        totalBeds: { increment: count },
      },
    });

    return prisma.bed.findMany({ where: { wardId }, orderBy: { bedNumber: 'asc' } });
  }

  async findBedById(id) {
    return prisma.bed.findUnique({
      where: { id },
      include: { 
        ward: true,
        admissions: {
          where: { status: 'ADMITTED' },
          include: {
            patient: true,
          },
          take: 1,
        },
      },
    });
  }

  async findBedsByWard(wardId, status) {
    const where = { wardId };
    if (status) where.status = status;

    return prisma.bed.findMany({
      where,
      include: {
        admissions: {
          where: { status: 'ADMITTED' },
          include: {
            patient: true,
          },
          take: 1,
        },
      },
      orderBy: { bedNumber: 'asc' },
    });
  }

  async getAvailableBeds(wardId) {
    const where = { status: 'AVAILABLE', isActive: true };
    if (wardId) where.wardId = wardId;

    return prisma.bed.findMany({
      where,
      include: { ward: true },
      orderBy: [
        { ward: { wardName: 'asc' } },
        { bedNumber: 'asc' },
      ],
    });
  }

  async updateBed(id, data) {
    return prisma.bed.update({
      where: { id },
      data,
      include: { ward: true },
    });
  }

  async updateBedStatus(id, status) {
    return prisma.bed.update({
      where: { id },
      data: { status },
    });
  }

  // =====================
  // ADMISSION MANAGEMENT
  // =====================

  async createAdmission(data) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.admission.count({
      where: {
        createdAt: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
        },
      },
    });
    const admissionNumber = `ADM-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    return prisma.$transaction(async (tx) => {
      // Create admission
      const admission = await tx.admission.create({
        data: {
          admissionNumber,
          ...data,
        },
        include: {
          patient: true,
          ward: true,
          bed: true,
        },
      });

      // Update bed status to OCCUPIED
      await tx.bed.update({
        where: { id: data.bedId },
        data: { status: 'OCCUPIED' },
      });

      // Update visit status if linked
      if (data.visitId) {
        await tx.visit.update({
          where: { id: data.visitId },
          data: { status: 'ADMITTED' },
        });
      }

      return admission;
    });
  }

  async findAdmissionById(id) {
    return prisma.admission.findUnique({
      where: { id },
      include: {
        patient: true,
        ward: true,
        bed: true,
        dailyRounds: {
          orderBy: { roundDate: 'desc' },
          take: 10,
        },
        nursingNotes: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
        ipdVitals: {
          orderBy: { recordedAt: 'desc' },
          take: 20,
        },
        ipdMedications: {
          orderBy: { scheduledTime: 'asc' },
        },
      },
    });
  }

  async findAdmissionByNumber(admissionNumber) {
    return prisma.admission.findUnique({
      where: { admissionNumber },
      include: {
        patient: true,
        ward: true,
        bed: true,
      },
    });
  }

  async findAllAdmissions(filters = {}, pagination = {}) {
    const { page = 1, limit = 50, status, wardId, patientId, search } = { ...filters, ...pagination };
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (wardId) where.wardId = wardId;
    if (patientId) where.patientId = patientId;
    if (search) {
      where.OR = [
        { admissionNumber: { contains: search, mode: 'insensitive' } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [admissions, total] = await Promise.all([
      prisma.admission.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: true,
          ward: true,
          bed: true,
        },
        orderBy: { admissionDate: 'desc' },
      }),
      prisma.admission.count({ where }),
    ]);

    return {
      data: admissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCurrentAdmissions() {
    return prisma.admission.findMany({
      where: { status: 'ADMITTED' },
      include: {
        patient: true,
        ward: true,
        bed: true,
      },
      orderBy: { admissionDate: 'desc' },
    });
  }

  async updateAdmission(id, data) {
    return prisma.admission.update({
      where: { id },
      data,
      include: {
        patient: true,
        ward: true,
        bed: true,
      },
    });
  }

  async dischargePatient(id, dischargeData) {
    return prisma.$transaction(async (tx) => {
      const admission = await tx.admission.findUnique({
        where: { id },
        include: { bed: true },
      });

      if (!admission) throw new Error('Admission not found');

      // Update admission with discharge info
      const updatedAdmission = await tx.admission.update({
        where: { id },
        data: {
          status: 'DISCHARGED',
          actualDischargeDate: new Date(),
          dischargeType: dischargeData.dischargeType,
          dischargeSummary: dischargeData.dischargeSummary,
          dischargeInstructions: dischargeData.dischargeInstructions,
          dischargedById: dischargeData.dischargedById,
        },
        include: {
          patient: true,
          ward: true,
          bed: true,
        },
      });

      // Free up the bed - set to CLEANING first
      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'CLEANING' },
      });

      // Update visit status if linked
      if (admission.visitId) {
        await tx.visit.update({
          where: { id: admission.visitId },
          data: { status: 'BILLING', closedAt: new Date() },
        });
      }

      return updatedAdmission;
    });
  }

  async transferBed(admissionId, newBedId, transferData) {
    return prisma.$transaction(async (tx) => {
      const admission = await tx.admission.findUnique({
        where: { id: admissionId },
        include: { bed: true },
      });

      if (!admission) throw new Error('Admission not found');

      const newBed = await tx.bed.findUnique({
        where: { id: newBedId },
        include: { ward: true },
      });

      if (!newBed) throw new Error('New bed not found');
      if (newBed.status !== 'AVAILABLE') throw new Error('New bed is not available');

      // Create transfer record
      await tx.bedTransfer.create({
        data: {
          admissionId,
          fromBedId: admission.bedId,
          toBedId: newBedId,
          transferReason: transferData.reason,
          transferredById: transferData.transferredById,
          notes: transferData.notes,
        },
      });

      // Free old bed
      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'CLEANING' },
      });

      // Occupy new bed
      await tx.bed.update({
        where: { id: newBedId },
        data: { status: 'OCCUPIED' },
      });

      // Update admission with new bed and ward
      return tx.admission.update({
        where: { id: admissionId },
        data: {
          bedId: newBedId,
          wardId: newBed.wardId,
        },
        include: {
          patient: true,
          ward: true,
          bed: true,
        },
      });
    });
  }

  // =====================
  // DAILY ROUNDS
  // =====================

  async createDailyRound(data) {
    return prisma.dailyRound.create({
      data,
      include: {
        admission: {
          include: {
            patient: true,
          },
        },
      },
    });
  }

  async findDailyRoundsByAdmission(admissionId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [rounds, total] = await Promise.all([
      prisma.dailyRound.findMany({
        where: { admissionId },
        skip,
        take: limit,
        orderBy: { roundDate: 'desc' },
      }),
      prisma.dailyRound.count({ where: { admissionId } }),
    ]);

    return {
      data: rounds,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getTodayRounds(doctorId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = {
      roundDate: { gte: today },
    };
    if (doctorId) where.doctorId = doctorId;

    return prisma.dailyRound.findMany({
      where,
      include: {
        admission: {
          include: {
            patient: true,
            ward: true,
            bed: true,
          },
        },
      },
      orderBy: { roundDate: 'desc' },
    });
  }

  // =====================
  // NURSING NOTES
  // =====================

  async createNursingNote(data) {
    return prisma.nursingNote.create({
      data,
    });
  }

  async findNursingNotesByAdmission(admissionId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      prisma.nursingNote.findMany({
        where: { admissionId },
        skip,
        take: limit,
        orderBy: { recordedAt: 'desc' },
      }),
      prisma.nursingNote.count({ where: { admissionId } }),
    ]);

    return {
      data: notes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =====================
  // IPD VITALS
  // =====================

  async createIPDVital(data) {
    return prisma.iPDVital.create({
      data,
    });
  }

  async findVitalsByAdmission(admissionId, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const [vitals, total] = await Promise.all([
      prisma.iPDVital.findMany({
        where: { admissionId },
        skip,
        take: limit,
        orderBy: { recordedAt: 'desc' },
      }),
      prisma.iPDVital.count({ where: { admissionId } }),
    ]);

    return {
      data: vitals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =====================
  // IPD MEDICATIONS
  // =====================

  async createIPDMedication(data) {
    return prisma.iPDMedication.create({
      data,
    });
  }

  async getMedicationSchedule(admissionId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.iPDMedication.findMany({
      where: {
        admissionId,
        scheduledTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { scheduledTime: 'asc' },
    });
  }

  async administerMedication(id, administeredById) {
    return prisma.iPDMedication.update({
      where: { id },
      data: {
        status: 'ADMINISTERED',
        administeredAt: new Date(),
        administeredById,
      },
    });
  }

  async holdMedication(id, holdReason) {
    return prisma.iPDMedication.update({
      where: { id },
      data: {
        status: 'HELD',
        holdReason,
      },
    });
  }

  // =====================
  // DASHBOARD STATS
  // =====================

  async getIPDStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalBeds,
      occupiedBeds,
      availableBeds,
      currentAdmissions,
      todayAdmissions,
      todayDischarges,
      criticalPatients,
    ] = await Promise.all([
      prisma.bed.count({ where: { isActive: true } }),
      prisma.bed.count({ where: { status: 'OCCUPIED', isActive: true } }),
      prisma.bed.count({ where: { status: 'AVAILABLE', isActive: true } }),
      prisma.admission.count({ where: { status: 'ADMITTED' } }),
      prisma.admission.count({
        where: {
          admissionDate: { gte: today },
        },
      }),
      prisma.admission.count({
        where: {
          status: 'DISCHARGED',
          actualDischargeDate: { gte: today },
        },
      }),
      prisma.dailyRound.count({
        where: {
          patientCondition: 'CRITICAL',
          roundDate: { gte: today },
        },
      }),
    ]);

    return {
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      currentAdmissions,
      todayAdmissions,
      todayDischarges,
      criticalPatients,
    };
  }
}
