import { LabService } from './service.js';
import {
  createLabTestSchema,
  updateLabTestSchema,
  createLabOrderSchema,
  updateLabOrderSchema,
  submitLabResultSchema,
  verifyLabResultSchema,
  labOrderQuerySchema,
  labTestQuerySchema,
} from './schema.js';

const labService = new LabService();

export class LabController {
  // ============ Lab Tests ============

  async createLabTest(req, res) {
    const validated = createLabTestSchema.parse(req.body);
    const test = await labService.createLabTest(validated);
    res.status(201).json({
      success: true,
      data: test,
      message: 'Lab test created successfully',
    });
  }

  async getLabTest(req, res) {
    const test = await labService.getLabTestById(req.params.id);
    res.json({
      success: true,
      data: test,
    });
  }

  async listLabTests(req, res) {
    const filters = labTestQuerySchema.parse(req.query);
    const result = await labService.listLabTests(filters);
    res.json({
      success: true,
      data: result.tests,
      pagination: result.pagination,
    });
  }

  async updateLabTest(req, res) {
    const validated = updateLabTestSchema.parse(req.body);
    const test = await labService.updateLabTest(req.params.id, validated);
    res.json({
      success: true,
      data: test,
      message: 'Lab test updated successfully',
    });
  }

  async deleteLabTest(req, res) {
    await labService.deleteLabTest(req.params.id);
    res.json({
      success: true,
      message: 'Lab test deleted successfully',
    });
  }

  // ============ Lab Orders ============

  async createLabOrder(req, res) {
    const validated = createLabOrderSchema.parse(req.body);
    const order = await labService.createLabOrder(validated, req.user.id);
    res.status(201).json({
      success: true,
      data: order,
      message: 'Lab order created successfully',
    });
  }

  async getLabOrder(req, res) {
    const order = await labService.getLabOrderById(req.params.id);
    res.json({
      success: true,
      data: order,
    });
  }

  async listLabOrders(req, res) {
    const filters = labOrderQuerySchema.parse(req.query);
    const result = await labService.listLabOrders(filters);
    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  }

  async getPendingOrders(req, res) {
    const orders = await labService.getPendingLabOrders();
    res.json({
      success: true,
      data: orders,
    });
  }

  async updateLabOrder(req, res) {
    const validated = updateLabOrderSchema.parse(req.body);
    const order = await labService.updateLabOrder(req.params.id, validated);
    res.json({
      success: true,
      data: order,
      message: 'Lab order updated successfully',
    });
  }

  async collectSample(req, res) {
    const order = await labService.collectSample(req.params.id);
    res.json({
      success: true,
      data: order,
      message: 'Sample collected successfully',
    });
  }

  async cancelLabOrder(req, res) {
    const { reason } = req.body;
    const order = await labService.cancelLabOrder(req.params.id, reason || 'Cancelled by user');
    res.json({
      success: true,
      data: order,
      message: 'Lab order cancelled',
    });
  }

  // ============ Lab Results ============

  async submitResults(req, res) {
    const validated = submitLabResultSchema.parse(req.body);
    const results = await labService.submitLabResults(
      validated.labOrderId,
      validated.results,
      validated.performedBy || `${req.user.firstName} ${req.user.lastName}`
    );
    res.status(201).json({
      success: true,
      data: results,
      message: 'Lab results submitted successfully',
    });
  }

  async getResults(req, res) {
    const results = await labService.getLabResults(req.params.orderId);
    res.json({
      success: true,
      data: results,
    });
  }

  async verifyResult(req, res) {
    const validated = verifyLabResultSchema.parse(req.body);
    const result = await labService.verifyLabResult(
      req.params.resultId,
      validated.verifiedBy,
      validated.notes
    );
    res.json({
      success: true,
      data: result,
      message: 'Result verified successfully',
    });
  }

  async verifyAllResults(req, res) {
    const { verifiedBy } = req.body;
    const order = await labService.verifyAllResults(
      req.params.orderId,
      verifiedBy || `${req.user.firstName} ${req.user.lastName}`
    );
    res.json({
      success: true,
      data: order,
      message: 'All results verified successfully',
    });
  }

  async getPatientLabHistory(req, res) {
    const history = await labService.getPatientLabHistory(req.params.patientId);
    res.json({
      success: true,
      data: history,
    });
  }
}
