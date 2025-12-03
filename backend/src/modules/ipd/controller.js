import { IPDService } from './service.js';

export class IPDController {
  constructor() {
    this.service = new IPDService();
  }

  // =====================
  // WARD MANAGEMENT
  // =====================

  createWard = async (req, res, next) => {
    try {
      const ward = await this.service.createWard(req.body);
      res.status(201).json({
        success: true,
        message: 'Ward created successfully',
        data: ward,
      });
    } catch (error) {
      next(error);
    }
  };

  getWard = async (req, res, next) => {
    try {
      const ward = await this.service.getWardById(req.params.id);
      res.json({
        success: true,
        data: ward,
      });
    } catch (error) {
      next(error);
    }
  };

  listWards = async (req, res, next) => {
    try {
      const { wardType, isActive } = req.query;
      const wards = await this.service.listWards({
        wardType,
        isActive: isActive === 'true',
      });
      res.json({
        success: true,
        data: wards,
      });
    } catch (error) {
      next(error);
    }
  };

  updateWard = async (req, res, next) => {
    try {
      const ward = await this.service.updateWard(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Ward updated successfully',
        data: ward,
      });
    } catch (error) {
      next(error);
    }
  };

  getWardOccupancy = async (req, res, next) => {
    try {
      const occupancy = await this.service.getWardOccupancy();
      res.json({
        success: true,
        data: occupancy,
      });
    } catch (error) {
      next(error);
    }
  };

  // =====================
  // BED MANAGEMENT
  // =====================

  createBed = async (req, res, next) => {
    try {
      const bed = await this.service.createBed(req.body);
      res.status(201).json({
        success: true,
        message: 'Bed created successfully',
        data: bed,
      });
    } catch (error) {
      next(error);
    }
  };

  createMultipleBeds = async (req, res, next) => {
    try {
      const { wardId, count, ...bedData } = req.body;
      const beds = await this.service.createMultipleBeds(wardId, bedData, parseInt(count));
      res.status(201).json({
        success: true,
        message: `${count} beds created successfully`,
        data: beds,
      });
    } catch (error) {
      next(error);
    }
  };

  getBed = async (req, res, next) => {
    try {
      const bed = await this.service.getBedById(req.params.id);
      res.json({
        success: true,
        data: bed,
      });
    } catch (error) {
      next(error);
    }
  };

  getBedsByWard = async (req, res, next) => {
    try {
      const { status } = req.query;
      const beds = await this.service.getBedsByWard(req.params.wardId, status);
      res.json({
        success: true,
        data: beds,
      });
    } catch (error) {
      next(error);
    }
  };

  getAvailableBeds = async (req, res, next) => {
    try {
      const { wardId } = req.query;
      const beds = await this.service.getAvailableBeds(wardId);
      res.json({
        success: true,
        data: beds,
      });
    } catch (error) {
      next(error);
    }
  };

  updateBed = async (req, res, next) => {
    try {
      const bed = await this.service.updateBed(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Bed updated successfully',
        data: bed,
      });
    } catch (error) {
      next(error);
    }
  };

  updateBedStatus = async (req, res, next) => {
    try {
      const bed = await this.service.updateBedStatus(req.params.id, req.body.status);
      res.json({
        success: true,
        message: 'Bed status updated successfully',
        data: bed,
      });
    } catch (error) {
      next(error);
    }
  };

  // =====================
  // ADMISSION MANAGEMENT
  // =====================

  createAdmission = async (req, res, next) => {
    try {
      const admission = await this.service.createAdmission({
        ...req.body,
        admittingDoctorId: req.body.admittingDoctorId || req.user?.id,
      });
      res.status(201).json({
        success: true,
        message: 'Patient admitted successfully',
        data: admission,
      });
    } catch (error) {
      next(error);
    }
  };

  getAdmission = async (req, res, next) => {
    try {
      const admission = await this.service.getAdmissionById(req.params.id);
      res.json({
        success: true,
        data: admission,
      });
    } catch (error) {
      next(error);
    }
  };

  getAdmissionByNumber = async (req, res, next) => {
    try {
      const admission = await this.service.getAdmissionByNumber(req.params.admissionNumber);
      res.json({
        success: true,
        data: admission,
      });
    } catch (error) {
      next(error);
    }
  };

  listAdmissions = async (req, res, next) => {
    try {
      const { page, limit, status, wardId, patientId, search } = req.query;
      const result = await this.service.listAdmissions(
        { status, wardId, patientId, search },
        { page: parseInt(page) || 1, limit: parseInt(limit) || 50 }
      );
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  getCurrentAdmissions = async (req, res, next) => {
    try {
      const admissions = await this.service.getCurrentAdmissions();
      res.json({
        success: true,
        data: admissions,
      });
    } catch (error) {
      next(error);
    }
  };

  updateAdmission = async (req, res, next) => {
    try {
      const admission = await this.service.updateAdmission(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Admission updated successfully',
        data: admission,
      });
    } catch (error) {
      next(error);
    }
  };

  dischargePatient = async (req, res, next) => {
    try {
      const admission = await this.service.dischargePatient(req.params.id, {
        ...req.body,
        dischargedById: req.user?.id,
      });
      res.json({
        success: true,
        message: 'Patient discharged successfully',
        data: admission,
      });
    } catch (error) {
      next(error);
    }
  };

  transferBed = async (req, res, next) => {
    try {
      const { newBedId, reason, notes } = req.body;
      const admission = await this.service.transferBed(req.params.id, newBedId, {
        reason,
        notes,
        transferredById: req.user?.id,
      });
      res.json({
        success: true,
        message: 'Bed transfer completed successfully',
        data: admission,
      });
    } catch (error) {
      next(error);
    }
  };

  // =====================
  // DAILY ROUNDS
  // =====================

  createDailyRound = async (req, res, next) => {
    try {
      const round = await this.service.createDailyRound({
        ...req.body,
        doctorId: req.body.doctorId || req.user?.id,
      });
      res.status(201).json({
        success: true,
        message: 'Daily round recorded successfully',
        data: round,
      });
    } catch (error) {
      next(error);
    }
  };

  getDailyRoundsByAdmission = async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await this.service.getDailyRoundsByAdmission(
        req.params.admissionId,
        { page: parseInt(page) || 1, limit: parseInt(limit) || 20 }
      );
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  getTodayRounds = async (req, res, next) => {
    try {
      const { doctorId } = req.query;
      const rounds = await this.service.getTodayRounds(doctorId);
      res.json({
        success: true,
        data: rounds,
      });
    } catch (error) {
      next(error);
    }
  };

  // =====================
  // NURSING NOTES
  // =====================

  createNursingNote = async (req, res, next) => {
    try {
      const note = await this.service.createNursingNote({
        ...req.body,
        nurseId: req.user?.id,
      });
      res.status(201).json({
        success: true,
        message: 'Nursing note created successfully',
        data: note,
      });
    } catch (error) {
      next(error);
    }
  };

  getNursingNotesByAdmission = async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await this.service.getNursingNotesByAdmission(
        req.params.admissionId,
        { page: parseInt(page) || 1, limit: parseInt(limit) || 20 }
      );
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  // =====================
  // IPD VITALS
  // =====================

  createIPDVital = async (req, res, next) => {
    try {
      const vital = await this.service.createIPDVital({
        ...req.body,
        recordedById: req.user?.id,
      });
      res.status(201).json({
        success: true,
        message: 'Vital signs recorded successfully',
        data: vital,
      });
    } catch (error) {
      next(error);
    }
  };

  getVitalsByAdmission = async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await this.service.getVitalsByAdmission(
        req.params.admissionId,
        { page: parseInt(page) || 1, limit: parseInt(limit) || 50 }
      );
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  // =====================
  // IPD MEDICATIONS
  // =====================

  createIPDMedication = async (req, res, next) => {
    try {
      const medication = await this.service.createIPDMedication(req.body);
      res.status(201).json({
        success: true,
        message: 'Medication scheduled successfully',
        data: medication,
      });
    } catch (error) {
      next(error);
    }
  };

  getMedicationSchedule = async (req, res, next) => {
    try {
      const { date } = req.query;
      const schedule = await this.service.getMedicationSchedule(
        req.params.admissionId,
        date || new Date().toISOString()
      );
      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  };

  administerMedication = async (req, res, next) => {
    try {
      const medication = await this.service.administerMedication(req.params.id, req.user?.id);
      res.json({
        success: true,
        message: 'Medication administered successfully',
        data: medication,
      });
    } catch (error) {
      next(error);
    }
  };

  holdMedication = async (req, res, next) => {
    try {
      const medication = await this.service.holdMedication(req.params.id, req.body.holdReason);
      res.json({
        success: true,
        message: 'Medication held successfully',
        data: medication,
      });
    } catch (error) {
      next(error);
    }
  };

  // =====================
  // DASHBOARD
  // =====================

  getStats = async (req, res, next) => {
    try {
      const stats = await this.service.getIPDStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
