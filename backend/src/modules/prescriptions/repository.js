import prisma from '../../core/database/prisma.js';

export class PrescriptionRepository {
  async create(data) {
    const { consultationId, patientId, prescribedBy, items, instructions } = data;

    // Generate prescription number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.prescription.count({
      where: {
        prescribedAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });
    const prescriptionNumber = `RX-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    // Resolve drug IDs for items that have drugName instead of drugId
    const resolvedItems = await Promise.all(
      items.map(async (item) => {
        let drugId = item.drugId;
        
        if (!drugId && item.drugName) {
          // Look up or create the drug
          let drug = await prisma.drug.findFirst({
            where: { 
              drugName: { equals: item.drugName, mode: 'insensitive' },
              deletedAt: null,
            },
          });
          
          if (!drug) {
            // Create a new drug entry
            drug = await prisma.drug.create({
              data: {
                drugName: item.drugName,
                stockQuantity: 0,
                unitPrice: 0,
              },
            });
          }
          drugId = drug.id;
        }
        
        return {
          drugId,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity: item.quantity,
          instructions: item.instructions,
        };
      })
    );

    const created = await prisma.prescription.create({
      data: {
        prescriptionNumber,
        consultationId,
        patientId,
        doctorId: prescribedBy,
        notes: instructions,
        prescribedAt: new Date(),
        status: 'PENDING',
        items: {
          create: resolvedItems,
        },
      },
      include: {
        items: {
          include: {
            drug: true,
          },
        },
        consultation: {
          include: {
            visit: {
              include: {
                patient: true,
              },
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
      },
    });

    return created;
  }

  async findById(id) {
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            drug: true,
          },
        },
        consultation: {
          include: {
            visit: {
              include: {
                patient: true,
              },
            },
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
    });

    // Attach dispenser user info if dispensedBy exists
    if (prescription && prescription.dispensedBy) {
      const dispenser = await prisma.user.findUnique({
        where: { id: prescription.dispensedBy },
        select: { id: true, firstName: true, lastName: true },
      });
      return { ...prescription, dispenser };
    }

    return prescription;
  }

  async findByConsultationId(consultationId) {
    const prescriptions = await prisma.prescription.findMany({
      where: { consultationId },
      include: {
        items: {
          include: {
            drug: true,
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
      orderBy: { prescribedAt: 'desc' },
    });

    // For any dispensed prescriptions, attach dispenser info
    const enriched = await Promise.all(
      prescriptions.map(async (p) => {
        if (p.dispensedBy) {
          const dispenser = await prisma.user.findUnique({
            where: { id: p.dispensedBy },
            select: { id: true, firstName: true, lastName: true },
          });
          return { ...p, dispenser };
        }
        return p;
      })
    );

    return enriched;
  }

  async findMany(filters = {}, pagination = {}) {
    const { page = 1, limit = 20, status, patientId } = { ...filters, ...pagination };
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (patientId) {
      where.consultation = {
        visit: {
          patientId,
        },
      };
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        include: {
          items: {
            include: {
              drug: true,
            },
          },
          consultation: {
            include: {
              visit: {
                include: {
                  patient: true,
                },
              },
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
        orderBy: { prescribedAt: 'desc' },
      }),
      prisma.prescription.count({ where }),
    ]);

    // Attach dispenser info where applicable
    const enriched = await Promise.all(
      prescriptions.map(async (p) => {
        if (p.dispensedBy) {
          const dispenser = await prisma.user.findUnique({
            where: { id: p.dispensedBy },
            select: { id: true, firstName: true, lastName: true },
          });
          return { ...p, dispenser };
        }
        return p;
      })
    );

    return {
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async update(id, data) {
    return prisma.prescription.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            drug: true,
          },
        },
        consultation: {
          include: {
            visit: {
              include: {
                patient: true,
              },
            },
          },
        },
      },
    });
  }

  async dispense(id, dispensedBy, dispensedData) {
    const { notes } = dispensedData;

    // Start a transaction to update prescription and drug stock
    return prisma.$transaction(async (tx) => {
      // Get prescription with items and drugs
      const prescription = await tx.prescription.findUnique({
        where: { id },
        include: { 
          items: {
            include: {
              drug: true,
            },
          },
        },
      });

      if (!prescription) {
        throw new Error('Prescription not found');
      }

      // Check stock availability and update for each item
      for (const item of prescription.items) {
        // Check if drug exists
        if (!item.drug) {
          throw new Error(`Drug not found for prescription item: ${item.drugName || 'Unknown'}`);
        }
        
        if (item.drug.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.drug.drugName}. Available: ${item.drug.stockQuantity}, Needed: ${item.quantity}`);
        }

        // Update drug stock
        await tx.drug.update({
          where: { id: item.drugId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });

        // Mark item as dispensed
        await tx.prescriptionItem.update({
          where: { id: item.id },
          data: {
            dispensed: item.quantity,
          },
        });
      }

      // Update prescription status
      const updated = await tx.prescription.update({
        where: { id },
        data: {
          status: 'DISPENSED',
          dispensedBy,
          dispensedAt: new Date(),
          notes: notes || prescription.notes,
        },
        include: {
          items: {
            include: {
              drug: true,
            },
          },
          consultation: {
            include: {
              visit: {
                include: {
                  patient: true,
                },
              },
            },
          },
        },
      });

      // Attach dispenser info from users table
      const dispenser = await tx.user.findUnique({
        where: { id: dispensedBy },
        select: { id: true, firstName: true, lastName: true },
      });

      return { ...updated, dispenser };
    });
  }

  async getPendingPrescriptions() {
    return prisma.prescription.findMany({
      where: { status: 'PENDING' },
      include: {
        items: {
          include: {
            drug: true,
          },
        },
        patient: true,
        consultation: {
          include: {
            visit: true,
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
      orderBy: { prescribedAt: 'asc' },
    });
  }
}
