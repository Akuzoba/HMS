import { AppError } from '../../core/middleware/errorHandler.js';
import { PatientRepository } from './repository.js';

export class PatientService {
  constructor() {
    this.repository = new PatientRepository();
  }

  async createPatient(data) {
    // Convert dateOfBirth to Date object
    const patientData = {
      ...data,
      dateOfBirth: new Date(data.dateOfBirth)
    };

    return await this.repository.create(patientData);
  }

  async getPatientById(id) {
    const patient = await this.repository.findById(id);
    
    if (!patient) {
      throw new AppError('Patient not found', 404, 'PATIENT_NOT_FOUND');
    }

    return patient;
  }

  async getPatientByNumber(patientNumber) {
    const patient = await this.repository.findByPatientNumber(patientNumber);
    
    if (!patient) {
      throw new AppError('Patient not found', 404, 'PATIENT_NOT_FOUND');
    }

    return patient;
  }

  async searchPatients(searchTerm, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const { patients, total } = await this.repository.search(searchTerm, skip, limit);

    return {
      patients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async listPatients(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const { patients, total } = await this.repository.list(skip, limit);

    return {
      patients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updatePatient(id, data) {
    const patient = await this.repository.findById(id);
    
    if (!patient) {
      throw new AppError('Patient not found', 404, 'PATIENT_NOT_FOUND');
    }

    return await this.repository.update(id, data);
  }

  async deletePatient(id) {
    const patient = await this.repository.findById(id);
    
    if (!patient) {
      throw new AppError('Patient not found', 404, 'PATIENT_NOT_FOUND');
    }

    return await this.repository.softDelete(id);
  }

  async getPatientVisitHistory(patientId, page = 1, limit = 10) {
    const patient = await this.repository.findById(patientId);
    
    if (!patient) {
      throw new AppError('Patient not found', 404, 'PATIENT_NOT_FOUND');
    }

    const skip = (page - 1) * limit;
    const { visits, total } = await this.repository.getVisitHistory(patientId, skip, limit);

    return {
      visits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}
