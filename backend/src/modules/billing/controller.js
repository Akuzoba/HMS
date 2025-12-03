import { BillingService } from './service.js';
import {
  createBillSchema,
  updateBillSchema,
  createPaymentSchema,
  billQuerySchema,
} from './schema.js';

const billingService = new BillingService();

export class BillingController {
  async createBill(req, res) {
    const validated = createBillSchema.parse(req.body);
    const bill = await billingService.createBill(validated, req.user.id);
    res.status(201).json({
      success: true,
      data: bill,
      message: 'Bill created successfully',
    });
  }

  async getBill(req, res) {
    const bill = await billingService.getBillById(req.params.id);
    res.json({
      success: true,
      data: bill,
    });
  }

  async listBills(req, res) {
    const filters = billQuerySchema.parse(req.query);
    const result = await billingService.listBills(filters);
    res.json({
      success: true,
      data: result.bills,
      pagination: result.pagination,
    });
  }

  async getPendingBills(req, res) {
    const bills = await billingService.getPendingBills();
    res.json({
      success: true,
      data: bills,
    });
  }

  async getPatientBills(req, res) {
    const bills = await billingService.getPatientBills(req.params.patientId);
    res.json({
      success: true,
      data: bills,
    });
  }

  async updateBill(req, res) {
    const validated = updateBillSchema.parse(req.body);
    const bill = await billingService.updateBill(req.params.id, validated);
    res.json({
      success: true,
      data: bill,
      message: 'Bill updated successfully',
    });
  }

  async cancelBill(req, res) {
    const bill = await billingService.cancelBill(req.params.id);
    res.json({
      success: true,
      data: bill,
      message: 'Bill cancelled',
    });
  }

  async recordPayment(req, res) {
    const validated = createPaymentSchema.parse(req.body);
    const result = await billingService.recordPayment(
      validated,
      `${req.user.firstName} ${req.user.lastName}`
    );
    res.status(201).json({
      success: true,
      data: result,
      message: 'Payment recorded successfully',
    });
  }

  async getPayments(req, res) {
    const payments = await billingService.getPayments(req.params.billId);
    res.json({
      success: true,
      data: payments,
    });
  }

  async getAllPayments(req, res) {
    const { page, limit, startDate, endDate } = req.query;
    const result = await billingService.getAllPayments({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      startDate,
      endDate,
    });
    res.json({
      success: true,
      data: result,
    });
  }

  async getBillingStats(req, res) {
    const stats = await billingService.getBillingStats();
    res.json({
      success: true,
      data: stats,
    });
  }

  async generateReceipt(req, res) {
    const receipt = await billingService.generateReceipt(req.params.id);
    res.json({
      success: true,
      data: receipt,
    });
  }

  async createBillFromVisit(req, res) {
    const { visitId, notes } = req.body;
    const bill = await billingService.createBillFromVisit(visitId, req.user.id, notes);
    res.status(201).json({
      success: true,
      data: bill,
      message: 'Bill created from visit charges',
    });
  }

  async getVisitsReadyForBilling(req, res) {
    const visits = await billingService.getVisitsReadyForBilling();
    res.json({
      success: true,
      data: visits,
    });
  }

  async getVisitCharges(req, res) {
    const charges = await billingService.getVisitCharges(req.params.visitId);
    res.json({
      success: true,
      data: charges,
    });
  }

  async generateBillFromVisit(req, res) {
    const bill = await billingService.generateBillFromVisit(
      req.params.visitId,
      req.user.id
    );
    res.status(201).json({
      success: true,
      message: 'Bill generated successfully',
      data: bill,
    });
  }
}
