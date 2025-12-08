import * as repository from './repository.js';

/**
 * Service layer for clinical documentation templates
 */

// =====================
// DRUG REGIMENS
// =====================

export const getDrugRegimens = async (filters = {}) => {
  return repository.findAllDrugRegimens(filters);
};

export const getDrugRegimenById = async (id) => {
  const regimen = await repository.findDrugRegimenById(id);
  if (!regimen) {
    throw new Error('Drug regimen not found');
  }
  return regimen;
};

export const searchDrugRegimens = async (query, limit = 10) => {
  if (!query || query.length < 2) {
    return [];
  }
  return repository.searchDrugRegimens(query, limit);
};

export const recordDrugRegimenUsage = async (id) => {
  return repository.incrementDrugRegimenUsage(id);
};

// =====================
// EXAM SECTIONS
// =====================

export const getExamSections = async () => {
  return repository.findAllExamSections();
};

export const getExamSectionByCode = async (code) => {
  const section = await repository.findExamSectionByCode(code);
  if (!section) {
    throw new Error('Exam section not found');
  }
  return section;
};

export const getRelevantExamSections = async (chiefComplaint) => {
  if (!chiefComplaint) {
    // Return all sections if no complaint specified
    return repository.findAllExamSections();
  }

  const triggers = await repository.findExamSectionsForComplaint(chiefComplaint);
  
  if (triggers.length === 0) {
    // Default to General examination if no matches
    const generalSection = await repository.findExamSectionByCode('GENERAL');
    return generalSection ? [{ examSection: generalSection, priority: 1, isRequired: true }] : [];
  }

  // Group by section and mark required/priority
  const sectionsMap = new Map();
  triggers.forEach(trigger => {
    const existing = sectionsMap.get(trigger.examSection.id);
    if (!existing || trigger.priority < existing.priority) {
      sectionsMap.set(trigger.examSection.id, {
        ...trigger.examSection,
        priority: trigger.priority,
        isRequired: trigger.isRequired,
      });
    }
  });

  return Array.from(sectionsMap.values()).sort((a, b) => a.priority - b.priority);
};

// =====================
// CLINICAL TEMPLATES
// =====================

export const getClinicalTemplates = async (filters = {}) => {
  return repository.findAllClinicalTemplates(filters);
};

export const getClinicalTemplateById = async (id) => {
  const template = await repository.findClinicalTemplateById(id);
  if (!template) {
    throw new Error('Clinical template not found');
  }
  return template;
};

export const getTemplatesForCategory = async (category) => {
  return repository.findTemplatesForCategory(category);
};

export const recordTemplateUsage = async (id) => {
  return repository.incrementTemplateUsage(id);
};

/**
 * Generate clinical text from template with filled values
 */
export const generateClinicalText = async (templateId, values) => {
  const template = await repository.findClinicalTemplateById(templateId);
  if (!template) {
    throw new Error('Clinical template not found');
  }

  let text = template.template;
  const placeholders = JSON.parse(template.placeholders);

  // Replace each placeholder with its value
  placeholders.forEach(placeholder => {
    const value = values[placeholder.name];
    if (value !== undefined && value !== null) {
      // Handle array values (multiselect)
      const displayValue = Array.isArray(value) ? value.join(', ') : value;
      text = text.replace(new RegExp(`\\{${placeholder.name}\\}`, 'g'), displayValue);
    } else if (placeholder.required) {
      // Keep placeholder for required fields without values
      text = text.replace(new RegExp(`\\{${placeholder.name}\\}`, 'g'), `[${placeholder.label}]`);
    } else {
      // Remove optional placeholders without values
      text = text.replace(new RegExp(`\\{${placeholder.name}\\}`, 'g'), '');
    }
  });

  // Clean up any double spaces or trailing commas
  text = text.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').replace(/\s+\./g, '.').trim();

  // Record usage
  await repository.incrementTemplateUsage(templateId);

  return { text, template };
};

// =====================
// SMART SUGGESTIONS
// =====================

/**
 * Get smart suggestions based on chief complaint
 */
export const getSmartSuggestions = async (chiefComplaint) => {
  const suggestions = {
    drugRegimens: [],
    clinicalTemplates: [],
    examSections: [],
  };

  // Map chief complaints to template categories and drug indications
  const complaintMappings = {
    fever: { category: 'FEVER', indications: ['malaria', 'fever', 'infection'] },
    malaria: { category: 'FEVER', indications: ['malaria'] },
    cough: { category: 'COUGH', indications: ['respiratory', 'cough', 'cold'] },
    headache: { category: 'PAIN', indications: ['headache', 'pain'] },
    'abdominal pain': { category: 'ABDOMINAL', indications: ['gastritis', 'abdominal'] },
    'stomach pain': { category: 'ABDOMINAL', indications: ['gastritis', 'abdominal'] },
    diarrhea: { category: 'ABDOMINAL', indications: ['diarrhea', 'gastroenteritis'] },
    'urinary symptoms': { category: 'URINARY', indications: ['uti', 'urinary'] },
    dysuria: { category: 'URINARY', indications: ['uti', 'urinary'] },
    hypertension: { category: 'CHRONIC', indications: ['hypertension', 'blood pressure'] },
    diabetes: { category: 'CHRONIC', indications: ['diabetes'] },
  };

  const lowerComplaint = chiefComplaint.toLowerCase();
  let mapping = null;

  // Find matching mapping
  for (const [key, value] of Object.entries(complaintMappings)) {
    if (lowerComplaint.includes(key)) {
      mapping = value;
      break;
    }
  }

  if (mapping) {
    // Get templates for this category
    suggestions.clinicalTemplates = await repository.findTemplatesForCategory(mapping.category);

    // Get drug regimens for related indications
    for (const indication of mapping.indications) {
      const regimens = await repository.searchDrugRegimens(indication, 5);
      suggestions.drugRegimens.push(...regimens);
    }
    // Remove duplicates
    suggestions.drugRegimens = [...new Map(suggestions.drugRegimens.map(r => [r.id, r])).values()];
  }

  // Get relevant exam sections
  suggestions.examSections = await getRelevantExamSections(chiefComplaint);

  return suggestions;
};

export default {
  // Drug Regimens
  getDrugRegimens,
  getDrugRegimenById,
  searchDrugRegimens,
  recordDrugRegimenUsage,
  
  // Exam Sections
  getExamSections,
  getExamSectionByCode,
  getRelevantExamSections,
  
  // Clinical Templates
  getClinicalTemplates,
  getClinicalTemplateById,
  getTemplatesForCategory,
  recordTemplateUsage,
  generateClinicalText,
  
  // Smart Suggestions
  getSmartSuggestions,
};
