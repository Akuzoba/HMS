import { IPDRepository } from './repository.js';
import { AppError } from '../../core/middleware/errorHandler.js';

const ipdRepository = new IPDRepository();

export class IPDService {
  // =====================
  // WARD MANAGEMENT
  // =====================

  async createWard(data) {
    return ipdRepository.createWard(data);
  }

  async getWardById(id) {
    const ward = await ipdRepository.findWardById(id);
    if (!ward) {
      throw new AppError('Ward not found', 404);
    }
    return ward;
  }

  async listWards(filters) {
    return ipdRepository.findAllWards(filters);
  }

  async updateWard(id, data) {
    const ward = await ipdRepository.findWardById(id);
    if (!ward) {
      throw new AppError('Ward not found', 404);
    }
    return ipdRepository.updateWard(id, data);
  }

  async getWardOccupancy() {
    return ipdRepository.getWardOccupancy();
  }

  // =====================
  // BED MANAGEMENT
  // =====================

  async createBed(data) {
    return ipdRepository.createBed(data);
  }

  async createMultipleBeds(wardId, bedData, count) {
    if (count < 1 || count > 50) {
      throw new AppError('Count must be between 1 and 50', 400);
    }
    return ipdRepository.createMultipleBeds(wardId, bedData, count);
  }

  async getBedById(id) {
    const bed = await ipdRepository.findBedById(id);
    if (!bed) {
      throw new AppError('Bed not found', 404);
    }
    return bed;
  }

  async getBedsByWard(wardId, status) {
    return ipdRepository.findBedsByWard(wardId, status);
  }

  async getAvailableBeds(wardId) {
    return ipdRepository.getAvailableBeds(wardId);
  }

  async updateBed(id, data) {
    const bed = await ipdRepository.findBedById(id);
    if (!bed) {
      throw new AppError('Bed not found', 404);
    }
    return ipdRepository.updateBed(id, data);
  }

  async updateBedStatus(id, status) {
    const validStatuses = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED', 'CLEANING'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid bed status', 400);
    }
    return ipdRepository.updateBedStatus(id, status);
  }

  // =====================
  // ADMISSION MANAGEMENT
  // =====================

  async createAdmission(data) {
    // Verify bed is available
    const bed = await ipdRepository.findBedById(data.bedId);
    if (!bed) {
      throw new AppError('Bed not found', 404);
    }
    if (bed.status !== 'AVAILABLE') {
      throw new AppError('Bed is not available', 400);
    }

    return ipdRepository.createAdmission(data);
  }

  async getAdmissionById(id) {
    const admission = await ipdRepository.findAdmissionById(id);
    if (!admission) {
      throw new AppError('Admission not found', 404);
    }
    return admission;
  }

  async getAdmissionByNumber(admissionNumber) {
    const admission = await ipdRepository.findAdmissionByNumber(admissionNumber);
    if (!admission) {
      throw new AppError('Admission not found', 404);
    }
    return admission;
  }

  async listAdmissions(filters, pagination) {
    return ipdRepository.findAllAdmissions(filters, pagination);
  }

  async getCurrentAdmissions() {
    return ipdRepository.getCurrentAdmissions();
  }

  async updateAdmission(id, data) {
    const admission = await ipdRepository.findAdmissionById(id);
    if (!admission) {
      throw new AppError('Admission not found', 404);
    }
    return ipdRepository.updateAdmission(id, data);
  }

  async dischargePatient(id, dischargeData) {
    const admission = await ipdRepository.findAdmissionById(id);
    if (!admission) {
      throw new AppError('Admission not found', 404);
    }
    if (admission.status !== 'ADMITTED') {
      throw new AppError('Patient is not currently admitted', 400);
    }

    const validDischargeTypes = ['NORMAL', 'LAMA', 'TRANSFER', 'DECEASED'];
    if (!validDischargeTypes.includes(dischargeData.dischargeType)) {
      throw new AppError('Invalid discharge type', 400);
    }

    return ipdRepository.dischargePatient(id, dischargeData);
  }

  async transferBed(admissionId, newBedId, transferData) {
    const admission = await ipdRepository.findAdmissionById(admissionId);
    if (!admission) {
      throw new AppError('Admission not found', 404);
    }
    if (admission.status !== 'ADMITTED') {
      throw new AppError('Patient is not currently admitted', 400);
    }

    try {
      return await ipdRepository.transferBed(admissionId, newBedId, transferData);
    } catch (error) {
      if (error.message === 'New bed not found') {
        throw new AppError('New bed not found', 404);
      }
      if (error.message === 'New bed is not available') {
        throw new AppError('New bed is not available', 400);
      }
      throw error;
    }
  }

  // =====================
  // DAILY ROUNDS
  // =====================

  async createDailyRound(data) {
    const admission = await ipdRepository.findAdmissionById(data.admissionId);
    if (!admission) {
      throw new AppError('Admission not found', 404);
    }
    if (admission.status !== 'ADMITTED') {
      throw new AppError('Patient is not currently admitted', 400);
    }

    return ipdRepository.createDailyRound(data);
  }

  async getDailyRoundsByAdmission(admissionId, pagination) {
    return ipdRepository.findDailyRoundsByAdmission(admissionId, pagination);
  }

  async getTodayRounds(doctorId) {
    return ipdRepository.getTodayRounds(doctorId);
  }

  // =====================
  // NURSING NOTES
  // =====================

  async createNursingNote(data) {
    const admission = await ipdRepository.findAdmissionById(data.admissionId);
    if (!admission) {
      throw new AppError('Admission not found', 404);
    }
    if (admission.status !== 'ADMITTED') {
      throw new AppError('Patient is not currently admitted', 400);
    }

    return ipdRepository.createNursingNote(data);
  }

  async getNursingNotesByAdmission(admissionId, pagination) {
    return ipdRepository.findNursingNotesByAdmission(admissionId, pagination);
  }

  // =====================
  // IPD VITALS
  // =====================

  async createIPDVital(data) {
    const admission = await ipdRepository.findAdmissionById(data.admissionId);
    if (!admission) {
      throw new AppError('Admission not found', 404);
    }
    if (admission.status !== 'ADMITTED') {
      throw new AppError('Patient is not currently admitted', 400);
    }

    return ipdRepository.createIPDVital(data);
  }

  async getVitalsByAdmission(admissionId, pagination) {
    return ipdRepository.findVitalsByAdmission(admissionId, pagination);
  }

  // =====================
  // IPD MEDICATIONS
  // =====================

  async createIPDMedication(data) {
    const admission = await ipdRepository.findAdmissionById(data.admissionId);
    if (!admission) {
      throw new AppError('Admission not found', 404);
    }

    return ipdRepository.createIPDMedication({
      ...data,
      scheduledTime: new Date(data.scheduledTime),
    });
  }

  async getMedicationSchedule(admissionId, date) {
    return ipdRepository.getMedicationSchedule(admissionId, new Date(date));
  }

  async administerMedication(id, administeredById) {
    return ipdRepository.administerMedication(id, administeredById);
  }

  async holdMedication(id, holdReason) {
    if (!holdReason) {
      throw new AppError('Hold reason is required', 400);
    }
    return ipdRepository.holdMedication(id, holdReason);
  }

  // =====================
  // DASHBOARD
  // =====================

  async getIPDStats() {
    return ipdRepository.getIPDStats();
  }
}
