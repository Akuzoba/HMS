import prisma from '../../core/database/prisma.js';

/**
 * Service to automatically charge for services provided during a visit
 */
export class AutoChargeService {
  
  /**
   * Charge for a consultation
   */
  async chargeConsultation(visitId, consultationType = 'General', userId = null) {
    // Find or create consultation service
    let service = await prisma.hospitalService.findFirst({
      where: {
        category: 'CONSULTATION',
        serviceName: { contains: consultationType, mode: 'insensitive' }
      }
    });

    if (!service) {
      // Use default consultation service
      service = await prisma.hospitalService.findFirst({
        where: { category: 'CONSULTATION' }
      });
    }

    if (!service) {
      console.warn('No consultation service found in database');
      return null;
    }

    // Check if already charged for this visit
    const existingCharge = await prisma.visitCharge.findFirst({
      where: {
        visitId,
        serviceId: service.id
      }
    });

    if (existingCharge) {
      return existingCharge; // Already charged
    }

    return prisma.visitCharge.create({
      data: {
        visitId,
        serviceId: service.id,
        serviceName: service.serviceName,
        quantity: 1,
        unitPrice: service.unitPrice,
        totalPrice: service.unitPrice,
        status: 'PENDING',
        notes: 'Auto-charged for consultation',
        chargedById: userId
      }
    });
  }

  /**
   * Charge for lab tests
   */
  async chargeLabTests(visitId, labOrderItems, userId = null) {
    const charges = [];

    for (const item of labOrderItems) {
      const labTest = item.labTest || await prisma.labTest.findUnique({
        where: { id: item.labTestId }
      });

      if (!labTest) continue;

      // Find corresponding hospital service for this lab test
      let service = await prisma.hospitalService.findFirst({
        where: {
          OR: [
            { serviceCode: `LAB-${labTest.testCode}` },
            { serviceName: labTest.testName, category: 'LABORATORY' }
          ]
        }
      });

      // If no service exists, create one from the lab test
      if (!service) {
        service = await prisma.hospitalService.create({
          data: {
            serviceCode: `LAB-${labTest.testCode}`,
            serviceName: labTest.testName,
            category: 'LABORATORY',
            description: labTest.description,
            unitPrice: labTest.price || 0,
            isActive: true
          }
        });
      }

      // Check if already charged
      const existingCharge = await prisma.visitCharge.findFirst({
        where: {
          visitId,
          serviceId: service.id,
          notes: { contains: item.id || labTest.id }
        }
      });

      if (existingCharge) continue;

      const charge = await prisma.visitCharge.create({
        data: {
          visitId,
          serviceId: service.id,
          serviceName: service.serviceName,
          quantity: 1,
          unitPrice: service.unitPrice,
          totalPrice: service.unitPrice,
          status: 'PENDING',
          notes: `Lab test: ${labTest.testName}`,
          chargedById: userId
        }
      });

      charges.push(charge);
    }

    return charges;
  }

  /**
   * Charge for prescription/dispensing
   */
  async chargePrescription(visitId, prescriptionItems, userId = null) {
    const charges = [];

    for (const item of prescriptionItems) {
      const drug = item.drug || await prisma.drug.findUnique({
        where: { id: item.drugId }
      });

      if (!drug) continue;

      // Find pharmacy service for this drug or use generic dispensing fee
      let service = await prisma.hospitalService.findFirst({
        where: {
          OR: [
            { serviceCode: `PHARM-${drug.id.substring(0, 8)}` },
            { serviceName: drug.drugName, category: 'PHARMACY' }
          ]
        }
      });

      // If no specific service, use the drug's price directly
      if (!service) {
        service = await prisma.hospitalService.findFirst({
          where: { category: 'PHARMACY', serviceName: { contains: 'Dispensing', mode: 'insensitive' } }
        });
      }

      // Create a charge for the medication
      const quantity = item.quantity || 1;
      const unitPrice = drug.unitPrice || 0;
      const totalPrice = quantity * unitPrice;

      // Check if already charged for this specific prescription item
      const existingCharge = await prisma.visitCharge.findFirst({
        where: {
          visitId,
          notes: { contains: `Drug: ${drug.drugName}` }
        }
      });

      if (existingCharge) continue;

      // Create or find a service for this drug
      let drugService = await prisma.hospitalService.findFirst({
        where: { serviceName: drug.drugName, category: 'PHARMACY' }
      });

      if (!drugService) {
        drugService = await prisma.hospitalService.create({
          data: {
            serviceCode: `PHARM-${drug.id.substring(0, 8)}`,
            serviceName: drug.drugName,
            category: 'PHARMACY',
            description: `Medication: ${drug.drugName}`,
            unitPrice: drug.unitPrice || 0,
            isActive: true
          }
        });
      }

      const charge = await prisma.visitCharge.create({
        data: {
          visitId,
          serviceId: drugService.id,
          serviceName: drug.drugName,
          quantity,
          unitPrice,
          totalPrice,
          status: 'PENDING',
          notes: `Drug: ${drug.drugName} - Qty: ${quantity}`,
          chargedById: userId
        }
      });

      charges.push(charge);
    }

    return charges;
  }

  /**
   * Sync all lab tests to hospital services
   */
  async syncLabTestsToServices() {
    const labTests = await prisma.labTest.findMany({
      where: { deletedAt: null, isActive: true }
    });

    let created = 0;
    let updated = 0;

    for (const test of labTests) {
      const serviceCode = `LAB-${test.testCode}`;
      
      const existingService = await prisma.hospitalService.findFirst({
        where: { serviceCode }
      });

      if (existingService) {
        // Update if price changed
        if (existingService.unitPrice !== test.price) {
          await prisma.hospitalService.update({
            where: { id: existingService.id },
            data: { unitPrice: test.price }
          });
          updated++;
        }
      } else {
        // Create new service
        await prisma.hospitalService.create({
          data: {
            serviceCode,
            serviceName: test.testName,
            category: 'LABORATORY',
            description: test.description || `Lab test: ${test.testName}`,
            unitPrice: test.price || 0,
            isActive: true
          }
        });
        created++;
      }
    }

    return { created, updated, total: labTests.length };
  }
}

export const autoChargeService = new AutoChargeService();
