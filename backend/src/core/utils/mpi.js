/**
 * Master Patient Index (MPI) Utilities
 * 
 * Professional-grade patient matching algorithms including:
 * - Levenshtein Distance (fuzzy string matching)
 * - Soundex (phonetic matching)
 * - Weighted similarity scoring
 * - Duplicate detection with confidence levels
 */

/**
 * Calculate Levenshtein distance between two strings
 * Measures the minimum number of single-character edits needed
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance
 */
export function levenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

/**
 * Calculate string similarity as a percentage (0-100)
 * Based on Levenshtein distance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity percentage (0-100)
 */
export function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  
  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 100;
  
  const distance = levenshteinDistance(s1, s2);
  return Math.round((1 - distance / maxLength) * 100);
}

/**
 * Soundex algorithm for phonetic matching
 * Encodes names by sound to catch spelling variations
 * @param {string} str - Input string
 * @returns {string} - 4-character Soundex code
 */
export function soundex(str) {
  if (!str || typeof str !== 'string') return '0000';
  
  const s = str.toUpperCase().replace(/[^A-Z]/g, '');
  if (s.length === 0) return '0000';

  const codes = {
    'B': '1', 'F': '1', 'P': '1', 'V': '1',
    'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
    'D': '3', 'T': '3',
    'L': '4',
    'M': '5', 'N': '5',
    'R': '6'
  };

  let result = s[0];
  let prevCode = codes[s[0]] || '';

  for (let i = 1; i < s.length && result.length < 4; i++) {
    const code = codes[s[i]] || '';
    if (code && code !== prevCode) {
      result += code;
    }
    prevCode = code || prevCode;
  }

  return (result + '0000').slice(0, 4);
}

/**
 * Check if two names sound similar using Soundex
 * @param {string} name1 - First name
 * @param {string} name2 - Second name
 * @returns {boolean} - True if phonetically similar
 */
export function soundsLike(name1, name2) {
  return soundex(name1) === soundex(name2);
}

/**
 * Normalize a name for comparison
 * Removes titles, extra spaces, standardizes format
 * @param {string} name - Input name
 * @returns {string} - Normalized name
 */
export function normalizeName(name) {
  if (!name) return '';
  
  // Common titles to remove
  const titles = ['mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'sir', 'madam', 'chief', 'alhaji', 'hajia'];
  
  let normalized = name.toLowerCase().trim();
  
  // Remove titles
  titles.forEach(title => {
    normalized = normalized.replace(new RegExp(`^${title}\\.?\\s+`, 'i'), '');
  });
  
  // Remove extra spaces and special characters
  normalized = normalized
    .replace(/[^a-z\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return normalized;
}

/**
 * Parse a full name into components
 * @param {string} fullName - Full name string
 * @returns {object} - { firstName, middleName, lastName }
 */
export function parseFullName(fullName) {
  const parts = normalizeName(fullName).split(' ').filter(p => p.length > 0);
  
  if (parts.length === 0) {
    return { firstName: '', middleName: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: '', lastName: '' };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], middleName: '', lastName: parts[1] };
  }
  
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1]
  };
}

/**
 * Calculate date similarity (for DOB matching)
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} - Similarity (100 = exact, 0 = very different)
 */
export function dateSimilarity(date1, date2) {
  if (!date1 || !date2) return 0;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  
  // Exact match
  if (d1.toDateString() === d2.toDateString()) return 100;
  
  // Check if same year and month (might be typo in day)
  if (d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()) {
    return 80;
  }
  
  // Check if same year (might be typo in month/day)
  if (d1.getFullYear() === d2.getFullYear()) {
    return 50;
  }
  
  // Different years - check if within 1 year (possible typo)
  const yearDiff = Math.abs(d1.getFullYear() - d2.getFullYear());
  if (yearDiff === 1) {
    return 30;
  }
  
  return 0;
}

/**
 * Normalize phone number for comparison
 * @param {string} phone - Phone number
 * @returns {string} - Normalized phone (digits only)
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  
  // Remove all non-digits
  let normalized = phone.replace(/\D/g, '');
  
  // Handle Ghana phone numbers
  // Remove leading 233 country code
  if (normalized.startsWith('233') && normalized.length > 9) {
    normalized = normalized.slice(3);
  }
  // Remove leading 0
  if (normalized.startsWith('0') && normalized.length === 10) {
    normalized = normalized.slice(1);
  }
  
  return normalized;
}

/**
 * Check phone number similarity
 * @param {string} phone1 - First phone
 * @param {string} phone2 - Second phone
 * @returns {number} - Similarity (100 = exact, 0 = different)
 */
export function phoneSimilarity(phone1, phone2) {
  const p1 = normalizePhone(phone1);
  const p2 = normalizePhone(phone2);
  
  if (!p1 || !p2) return 0;
  if (p1 === p2) return 100;
  
  // Check if last 9 digits match (handles country code differences)
  const last9_1 = p1.slice(-9);
  const last9_2 = p2.slice(-9);
  if (last9_1.length >= 9 && last9_1 === last9_2) return 100;
  
  // Check for single digit typo
  if (p1.length === p2.length) {
    let differences = 0;
    for (let i = 0; i < p1.length; i++) {
      if (p1[i] !== p2[i]) differences++;
    }
    if (differences === 1) return 80;
    if (differences === 2) return 50;
  }
  
  return 0;
}

/**
 * MPI Matching Weights Configuration
 * Determines importance of each field in overall match score
 */
export const MPI_WEIGHTS = {
  firstName: 25,
  lastName: 25,
  middleName: 5,
  dateOfBirth: 25,
  phoneNumber: 15,
  gender: 5
};

/**
 * Confidence Level Thresholds
 */
export const CONFIDENCE_LEVELS = {
  DEFINITE_MATCH: 95,    // Almost certainly the same person
  PROBABLE_MATCH: 80,    // Very likely the same person
  POSSIBLE_MATCH: 60,    // Might be the same person
  UNLIKELY_MATCH: 40     // Probably not the same person
};

/**
 * Calculate overall patient match score
 * @param {object} patient1 - First patient data
 * @param {object} patient2 - Second patient data
 * @returns {object} - { score, confidence, breakdown }
 */
export function calculateMatchScore(patient1, patient2) {
  const breakdown = {};
  let totalWeight = 0;
  let weightedScore = 0;

  // First Name matching (with phonetic bonus)
  if (patient1.firstName && patient2.firstName) {
    const firstNameSim = stringSimilarity(
      normalizeName(patient1.firstName),
      normalizeName(patient2.firstName)
    );
    const phoneticBonus = soundsLike(patient1.firstName, patient2.firstName) ? 10 : 0;
    breakdown.firstName = Math.min(100, firstNameSim + phoneticBonus);
    weightedScore += breakdown.firstName * MPI_WEIGHTS.firstName;
    totalWeight += MPI_WEIGHTS.firstName;
  }

  // Last Name matching (with phonetic bonus)
  if (patient1.lastName && patient2.lastName) {
    const lastNameSim = stringSimilarity(
      normalizeName(patient1.lastName),
      normalizeName(patient2.lastName)
    );
    const phoneticBonus = soundsLike(patient1.lastName, patient2.lastName) ? 10 : 0;
    breakdown.lastName = Math.min(100, lastNameSim + phoneticBonus);
    weightedScore += breakdown.lastName * MPI_WEIGHTS.lastName;
    totalWeight += MPI_WEIGHTS.lastName;
  }

  // Middle Name matching (optional)
  if (patient1.middleName || patient2.middleName) {
    if (patient1.middleName && patient2.middleName) {
      breakdown.middleName = stringSimilarity(
        normalizeName(patient1.middleName),
        normalizeName(patient2.middleName)
      );
    } else {
      // One has middle name, other doesn't - neutral score
      breakdown.middleName = 50;
    }
    weightedScore += breakdown.middleName * MPI_WEIGHTS.middleName;
    totalWeight += MPI_WEIGHTS.middleName;
  }

  // Date of Birth matching
  if (patient1.dateOfBirth && patient2.dateOfBirth) {
    breakdown.dateOfBirth = dateSimilarity(patient1.dateOfBirth, patient2.dateOfBirth);
    weightedScore += breakdown.dateOfBirth * MPI_WEIGHTS.dateOfBirth;
    totalWeight += MPI_WEIGHTS.dateOfBirth;
  }

  // Phone Number matching
  if (patient1.phoneNumber && patient2.phoneNumber) {
    breakdown.phoneNumber = phoneSimilarity(patient1.phoneNumber, patient2.phoneNumber);
    weightedScore += breakdown.phoneNumber * MPI_WEIGHTS.phoneNumber;
    totalWeight += MPI_WEIGHTS.phoneNumber;
  }

  // Gender matching
  if (patient1.gender && patient2.gender) {
    breakdown.gender = patient1.gender.toUpperCase() === patient2.gender.toUpperCase() ? 100 : 0;
    weightedScore += breakdown.gender * MPI_WEIGHTS.gender;
    totalWeight += MPI_WEIGHTS.gender;
  }

  // Calculate final score
  const score = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

  // Determine confidence level
  let confidence;
  if (score >= CONFIDENCE_LEVELS.DEFINITE_MATCH) {
    confidence = 'DEFINITE_MATCH';
  } else if (score >= CONFIDENCE_LEVELS.PROBABLE_MATCH) {
    confidence = 'PROBABLE_MATCH';
  } else if (score >= CONFIDENCE_LEVELS.POSSIBLE_MATCH) {
    confidence = 'POSSIBLE_MATCH';
  } else if (score >= CONFIDENCE_LEVELS.UNLIKELY_MATCH) {
    confidence = 'UNLIKELY_MATCH';
  } else {
    confidence = 'NO_MATCH';
  }

  return {
    score,
    confidence,
    breakdown,
    isLikelyDuplicate: score >= CONFIDENCE_LEVELS.POSSIBLE_MATCH
  };
}

/**
 * Find potential duplicates for a new patient
 * @param {object} newPatient - New patient data to check
 * @param {array} existingPatients - Array of existing patients to compare against
 * @param {number} threshold - Minimum score to consider a match (default: 60)
 * @returns {array} - Array of potential matches with scores
 */
export function findPotentialDuplicates(newPatient, existingPatients, threshold = CONFIDENCE_LEVELS.POSSIBLE_MATCH) {
  const matches = [];

  for (const existing of existingPatients) {
    const result = calculateMatchScore(newPatient, existing);
    
    if (result.score >= threshold) {
      matches.push({
        patient: existing,
        ...result
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  return matches;
}

/**
 * Generate fuzzy search query for Prisma
 * Creates OR conditions for approximate name matching
 * @param {string} searchTerm - Search term
 * @returns {array} - Array of Prisma OR conditions
 */
export function generateFuzzySearchConditions(searchTerm) {
  const normalized = normalizeName(searchTerm);
  const parts = normalized.split(' ').filter(p => p.length > 1);
  
  const conditions = [];
  
  // Add conditions for each part of the search term
  parts.forEach(part => {
    // Exact contains
    conditions.push({ firstName: { contains: part, mode: 'insensitive' } });
    conditions.push({ lastName: { contains: part, mode: 'insensitive' } });
    conditions.push({ middleName: { contains: part, mode: 'insensitive' } });
    
    // Starts with (for partial name entry)
    conditions.push({ firstName: { startsWith: part, mode: 'insensitive' } });
    conditions.push({ lastName: { startsWith: part, mode: 'insensitive' } });
  });
  
  // Phone number search
  const phoneDigits = searchTerm.replace(/\D/g, '');
  if (phoneDigits.length >= 4) {
    conditions.push({ phoneNumber: { contains: phoneDigits } });
  }
  
  // Patient number search
  if (searchTerm.toUpperCase().startsWith('PT-')) {
    conditions.push({ patientNumber: { contains: searchTerm, mode: 'insensitive' } });
  }
  
  return conditions;
}

export default {
  levenshteinDistance,
  stringSimilarity,
  soundex,
  soundsLike,
  normalizeName,
  parseFullName,
  dateSimilarity,
  normalizePhone,
  phoneSimilarity,
  calculateMatchScore,
  findPotentialDuplicates,
  generateFuzzySearchConditions,
  MPI_WEIGHTS,
  CONFIDENCE_LEVELS
};
