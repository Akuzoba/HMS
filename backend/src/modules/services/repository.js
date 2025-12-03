import prisma from '../../core/database/prisma.js';

export class ServiceRepository {
  // Hospital Services
  async createService(data) {
    return prisma.hospitalService.create({
      data,
    });
  }

  async findServiceById(id) {
    return prisma.hospitalService.findUnique({
      where: { id },
    });
  }

  async findServiceByCode(serviceCode) {
    return prisma.hospitalService.findUnique({
      where: { serviceCode },
    });
  }

  async findAllServices(filters = {}) {
    const { category, search, isActive = true } = filters;

    const where = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { serviceName: { contains: search, mode: 'insensitive' } },
        { serviceCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.hospitalService.findMany({
      where,
      orderBy: [{ category: 'asc' }, { serviceName: 'asc' }],
    });
  }

  async updateService(id, data) {
    return prisma.hospitalService.update({
      where: { id },
      data,
    });
  }

  async deleteService(id) {
    // Soft delete by setting isActive to false
    return prisma.hospitalService.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Visit Charges
  async createVisitCharge(data) {
    return prisma.visitCharge.create({
      data,
      include: {
        service: true,
      },
    });
  }

  async findVisitCharges(visitId) {
    return prisma.visitCharge.findMany({
      where: { visitId },
      include: {
        service: true,
      },
      orderBy: { chargedAt: 'asc' },
    });
  }

  async getVisitTotal(visitId) {
    const result = await prisma.visitCharge.aggregate({
      where: { visitId },
      _sum: { totalPrice: true },
    });
    return result._sum.totalPrice || 0;
  }

  async deleteVisitCharge(id) {
    return prisma.visitCharge.delete({
      where: { id },
    });
  }

  // Auto-charge helper - find service by category and name pattern
  async findServiceForCharge(category, namePattern = null) {
    const where = { category, isActive: true };
    if (namePattern) {
      where.serviceName = { contains: namePattern, mode: 'insensitive' };
    }
    return prisma.hospitalService.findFirst({
      where,
      orderBy: { serviceName: 'asc' },
    });
  }

  // Get unbilled charges for a visit
  async getUnbilledCharges(visitId) {
    // Get charges that haven't been added to a bill yet
    const charges = await prisma.visitCharge.findMany({
      where: { visitId },
      include: {
        service: true,
        visit: {
          include: {
            patient: true,
          },
        },
      },
      orderBy: { chargedAt: 'asc' },
    });

    return charges;
  }
}
