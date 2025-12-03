import { BillingRepository } from './repository.js';
import { AppError } from '../../core/middleware/errorHandler.js';

const billingRepository = new BillingRepository();

export class BillingService {
  async createBill(data, issuedById) {
    return billingRepository.createBill(data, issuedById);
  }

  async getBillById(id) {
    const bill = await billingRepository.findBillById(id);
    if (!bill) {
      throw new AppError('Bill not found', 404);
    }
    return bill;
  }

  async getBillByNumber(billNumber) {
    const bill = await billingRepository.findBillByNumber(billNumber);
    if (!bill) {
      throw new AppError('Bill not found', 404);
    }
    return bill;
  }

  async listBills(filters) {
    return billingRepository.findManyBills(filters);
  }

  async getPendingBills() {
    return billingRepository.getPendingBills();
  }

  async getPatientBills(patientId) {
    return billingRepository.getPatientBills(patientId);
  }

  async updateBill(id, data) {
    const bill = await billingRepository.findBillById(id);
    if (!bill) {
      throw new AppError('Bill not found', 404);
    }
    return billingRepository.updateBill(id, data);
  }

  async cancelBill(id) {
    const bill = await billingRepository.findBillById(id);
    if (!bill) {
      throw new AppError('Bill not found', 404);
    }
    if (bill.status === 'PAID') {
      throw new AppError('Cannot cancel a paid bill', 400);
    }
    return billingRepository.updateBill(id, { status: 'CANCELLED' });
  }

  async recordPayment(paymentData, receivedBy) {
    const bill = await billingRepository.findBillById(paymentData.billId);
    if (!bill) {
      throw new AppError('Bill not found', 404);
    }
    if (bill.status === 'PAID') {
      throw new AppError('Bill is already fully paid', 400);
    }
    if (bill.status === 'CANCELLED') {
      throw new AppError('Cannot pay a cancelled bill', 400);
    }
    if (paymentData.amount > bill.balance) {
      throw new AppError('Payment amount exceeds bill balance', 400);
    }

    return billingRepository.createPayment(paymentData, receivedBy);
  }

  async getPayments(billId) {
    const bill = await billingRepository.findBillById(billId);
    if (!bill) {
      throw new AppError('Bill not found', 404);
    }
    return billingRepository.getPaymentsByBillId(billId);
  }

  async getAllPayments(filters) {
    return billingRepository.getAllPayments(filters);
  }

  async getBillingStats() {
    return billingRepository.getBillingStats();
  }

  async generateReceipt(billId) {
    const bill = await billingRepository.findBillById(billId);
    if (!bill) {
      throw new AppError('Bill not found', 404);
    }

    // Generate receipt data
    return {
      receiptNumber: `RCP-${bill.billNumber.replace('INV-', '')}`,
      bill,
      generatedAt: new Date().toISOString(),
    };
  }

  async getVisitCharges(visitId) {
    return billingRepository.getVisitCharges(visitId);
  }

  async generateBillFromVisit(visitId, issuedById) {
    // Check if there are any unbilled charges
    const result = await billingRepository.getVisitCharges(visitId);
    const unbilledCharges = result.charges.filter(c => c.status === 'PENDING');
    
    if (unbilledCharges.length === 0) {
      throw new AppError('No unbilled charges found for this visit', 400);
    }

    return billingRepository.createBillFromVisit(visitId, issuedById);
  }
}
