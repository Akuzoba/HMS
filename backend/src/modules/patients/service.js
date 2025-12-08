import { AppError } from '../../core/middleware/errorHandler.js';
import { PatientRepository } from './repository.js';
import { 
  calculateMatchScore, 
  findPotentialDuplicates,
  CONFIDENCE_LEVELS 
} from '../../core/utils/mpi.js';

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

  /**
   * Check for potential duplicate patients before registration
   * Uses MPI fuzzy matching algorithms
   * @param {object} patientData - New patient data to check
   * @returns {object} - { hasDuplicates, matches, canProceed }
   */
  async checkForDuplicates(patientData) {
    // Get potential matches from database
    const potentialMatches = await this.repository.findPotentialDuplicates(patientData);

    if (potentialMatches.length === 0) {
      return {
        hasDuplicates: false,
        matches: [],
        canProceed: true,
        message: 'No potential duplicates found'
      };
    }

    // Calculate match scores using MPI algorithm
    const scoredMatches = findPotentialDuplicates(
      patientData, 
      potentialMatches, 
      CONFIDENCE_LEVELS.UNLIKELY_MATCH // Return all matches above 40%
    );

    // Categorize matches
    const definiteMatches = scoredMatches.filter(m => m.confidence === 'DEFINITE_MATCH');
    const probableMatches = scoredMatches.filter(m => m.confidence === 'PROBABLE_MATCH');
    const possibleMatches = scoredMatches.filter(m => m.confidence === 'POSSIBLE_MATCH');

    // Determine if registration can proceed
    const canProceed = definiteMatches.length === 0;
    const requiresReview = probableMatches.length > 0 || possibleMatches.length > 0;

    // Generate appropriate message
    let message;
    if (definiteMatches.length > 0) {
      message = `Found ${definiteMatches.length} patient(s) that appear to be the same person. Please review existing records.`;
    } else if (probableMatches.length > 0) {
      message = `Found ${probableMatches.length} patient(s) that may be the same person. Please verify before proceeding.`;
    } else if (possibleMatches.length > 0) {
      message = `Found ${possibleMatches.length} patient(s) with similar information. Please review if needed.`;
    } else {
      message = 'Low-confidence matches found. You may proceed with registration.';
    }

    return {
      hasDuplicates: scoredMatches.length > 0,
      matches: scoredMatches.map(m => ({
        patient: {
          id: m.patient.id,
          patientNumber: m.patient.patientNumber,
          firstName: m.patient.firstName,
          middleName: m.patient.middleName,
          lastName: m.patient.lastName,
          dateOfBirth: m.patient.dateOfBirth,
          gender: m.patient.gender,
          phoneNumber: m.patient.phoneNumber,
          lastVisit: m.patient.visits?.[0] || null
        },
        score: m.score,
        confidence: m.confidence,
        breakdown: m.breakdown
      })),
      definiteMatchCount: definiteMatches.length,
      probableMatchCount: probableMatches.length,
      possibleMatchCount: possibleMatches.length,
      canProceed,
      requiresReview,
      message
    };
  }

  /**
   * Create patient with optional duplicate override
   * @param {object} data - Patient data
   * @param {object} options - { skipDuplicateCheck, confirmedNotDuplicate }
   * @returns {object} - Created patient or duplicate warning
   */
  async createPatientWithMPI(data, options = {}) {
    const { skipDuplicateCheck = false, confirmedNotDuplicate = false } = options;

    // Check for duplicates unless explicitly skipped
    if (!skipDuplicateCheck && !confirmedNotDuplicate) {
      const duplicateCheck = await this.checkForDuplicates(data);
      
      if (duplicateCheck.definiteMatchCount > 0) {
        // Block registration for definite matches
        throw new AppError(
          duplicateCheck.message,
          409,
          'DUPLICATE_PATIENT_DETECTED',
          { duplicateCheck }
        );
      }

      if (duplicateCheck.requiresReview) {
        // Return warning for probable/possible matches
        return {
          status: 'DUPLICATE_WARNING',
          message: duplicateCheck.message,
          duplicateCheck,
          requiresConfirmation: true
        };
      }
    }

    // Proceed with patient creation
    const patientData = {
      ...data,
      dateOfBirth: new Date(data.dateOfBirth)
    };

    const patient = await this.repository.create(patientData);
    
    return {
      status: 'CREATED',
      patient
    };
  }

  /**
   * Advanced fuzzy search for patients
   * @param {string} searchTerm - Search term
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {object} - { patients, pagination }
   */
  async fuzzySearchPatients(searchTerm, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const { patients, total } = await this.repository.fuzzySearch(searchTerm, skip, limit);

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
}
