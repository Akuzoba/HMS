import { ServiceService } from './service.js';

const serviceService = new ServiceService();

export class ServiceController {
  // Hospital Services
  async createService(req, res) {
    const service = await serviceService.createService(req.body);
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service,
    });
  }

  async getService(req, res) {
    const service = await serviceService.getServiceById(req.params.id);
    res.json({
      success: true,
      data: service,
    });
  }

  async listServices(req, res) {
    const { category, search, isActive } = req.query;
    const services = await serviceService.listServices({
      category,
      search,
      isActive: isActive === 'false' ? false : isActive === 'true' ? true : undefined,
    });
    res.json({
      success: true,
      data: services,
    });
  }

  async updateService(req, res) {
    const service = await serviceService.updateService(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service,
    });
  }

  async deleteService(req, res) {
    await serviceService.deleteService(req.params.id);
    res.json({
      success: true,
      message: 'Service deactivated successfully',
    });
  }

  // Visit Charges
  async chargeService(req, res) {
    const { visitId, serviceId, quantity, notes } = req.body;
    const charge = await serviceService.chargeService(
      visitId,
      serviceId,
      quantity || 1,
      notes,
      req.user?.id
    );
    res.status(201).json({
      success: true,
      message: 'Service charged successfully',
      data: charge,
    });
  }

  async getVisitCharges(req, res) {
    const charges = await serviceService.getVisitCharges(req.params.visitId);
    const total = await serviceService.getVisitTotal(req.params.visitId);
    res.json({
      success: true,
      data: {
        charges,
        total,
      },
    });
  }

  async removeCharge(req, res) {
    await serviceService.removeCharge(req.params.chargeId);
    res.json({
      success: true,
      message: 'Charge removed successfully',
    });
  }

  async getUnbilledCharges(req, res) {
    const charges = await serviceService.getUnbilledCharges(req.params.visitId);
    const total = charges.reduce((sum, c) => sum + c.totalPrice, 0);
    res.json({
      success: true,
      data: {
        charges,
        total,
        visit: charges[0]?.visit || null,
      },
    });
  }

  async syncLabTestsToServices(req, res) {
    const { autoChargeService } = await import('./chargeService.js');
    const result = await autoChargeService.syncLabTestsToServices();
    res.json({
      success: true,
      data: result,
      message: `Synced lab tests to services: ${result.created} created, ${result.updated} updated`,
    });
  }
}
