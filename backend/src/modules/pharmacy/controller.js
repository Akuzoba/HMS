import { PharmacyService } from './service.js';

export class PharmacyController {
  constructor() {
    this.service = new PharmacyService();
  }

  createDrug = async (req, res, next) => {
    try {
      const drug = await this.service.createDrug(req.body);
      res.status(201).json({
        success: true,
        data: drug,
        message: 'Drug created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getDrug = async (req, res, next) => {
    try {
      const drug = await this.service.getDrugById(req.params.id);
      res.json({
        success: true,
        data: drug,
      });
    } catch (error) {
      next(error);
    }
  };

  listDrugs = async (req, res, next) => {
    try {
      const result = await this.service.listDrugs(req.query);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateDrug = async (req, res, next) => {
    try {
      const drug = await this.service.updateDrug(req.params.id, req.body);
      res.json({
        success: true,
        data: drug,
        message: 'Drug updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteDrug = async (req, res, next) => {
    try {
      await this.service.deleteDrug(req.params.id);
      res.json({
        success: true,
        message: 'Drug deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  addBatch = async (req, res, next) => {
    try {
      const batch = await this.service.receiveBatch(req.body);
      res.status(201).json({
        success: true,
        data: batch,
        message: 'Batch added successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getBatch = async (req, res, next) => {
    try {
      const batch = await this.service.getBatchById(req.params.id);
      res.json({
        success: true,
        data: batch,
      });
    } catch (error) {
      next(error);
    }
  };

  getBatchesByDrug = async (req, res, next) => {
    try {
      const batches = await this.service.getBatchesByDrug(req.params.drugId);
      res.json({
        success: true,
        data: batches,
      });
    } catch (error) {
      next(error);
    }
  };

  updateBatch = async (req, res, next) => {
    try {
      const batch = await this.service.updateBatch(req.params.id, req.body);
      res.json({
        success: true,
        data: batch,
        message: 'Batch updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getExpiringBatches = async (req, res, next) => {
    try {
      const { days } = req.query;
      const batches = await this.service.getExpiringBatches(
        days ? parseInt(days) : 30
      );
      res.json({
        success: true,
        data: batches,
      });
    } catch (error) {
      next(error);
    }
  };

  getExpiredBatches = async (req, res, next) => {
    try {
      const batches = await this.service.getExpiredBatches();
      res.json({
        success: true,
        data: batches,
      });
    } catch (error) {
      next(error);
    }
  };

  markBatchExpired = async (req, res, next) => {
    try {
      const batch = await this.service.markBatchExpired(req.params.id);
      res.json({
        success: true,
        data: batch,
        message: 'Batch marked as expired',
      });
    } catch (error) {
      next(error);
    }
  };

  getInventoryLogs = async (req, res, next) => {
    try {
      const logs = await this.service.getInventoryLogs(req.query);
      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  };

  getLowStockDrugs = async (req, res, next) => {
    try {
      const drugs = await this.service.getLowStockDrugs();
      res.json({
        success: true,
        data: drugs,
      });
    } catch (error) {
      next(error);
    }
  };

  getOutOfStockDrugs = async (req, res, next) => {
    try {
      const drugs = await this.service.getOutOfStockDrugs();
      res.json({
        success: true,
        data: drugs,
      });
    } catch (error) {
      next(error);
    }
  };

  adjustStock = async (req, res, next) => {
    try {
      const log = await this.service.adjustStock(req.body);
      res.status(201).json({
        success: true,
        data: log,
        message: 'Stock adjusted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  createDispensing = async (req, res, next) => {
    try {
      const dispensing = await this.service.dispenseStock(req.body);
      res.status(201).json({
        success: true,
        data: dispensing,
        message: 'Stock dispensed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getDispensing = async (req, res, next) => {
    try {
      const dispensing = await this.service.getDispensingById(req.params.id);
      res.json({
        success: true,
        data: dispensing,
      });
    } catch (error) {
      next(error);
    }
  };

  listDispensings = async (req, res, next) => {
    try {
      const dispensings = await this.service.listDispensings(req.query);
      res.json({
        success: true,
        data: dispensings,
      });
    } catch (error) {
      next(error);
    }
  };

  getAlerts = async (req, res, next) => {
    try {
      const [lowStock, expiring, expired] = await Promise.all([
        this.service.getLowStockAlerts(),
        this.service.getExpiryAlerts(),
        this.service.getExpiredBatches(),
      ]);
      res.json({
        success: true,
        data: {
          lowStock,
          expiring,
          expired,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req, res, next) => {
    try {
      const stats = await this.service.getPharmacyStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
