import prisma from '../../core/database/prisma.js';

/**
 * Repository for clinical documentation templates
 */

// =====================
// DRUG REGIMENS
// =====================

export const findAllDrugRegimens = async (filters = {}) => {
  const where = { isActive: true };
  
  if (filters.category) {
    where.category = filters.category;
  }
  
  if (filters.search) {
    where.OR = [
      { drugName: { contains: filters.search, mode: 'insensitive' } },
      { genericName: { contains: filters.search, mode: 'insensitive' } },
      { searchTerms: { contains: filters.search, mode: 'insensitive' } },
      { indication: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.drugRegimen.findMany({
    where,
    orderBy: [
      { usageCount: 'desc' },
      { drugName: 'asc' },
    ],
    take: filters.limit || 20,
  });
};

export const findDrugRegimenById = async (id) => {
  return prisma.drugRegimen.findUnique({
    where: { id },
    include: {
      drug: true,
    },
  });
};

export const searchDrugRegimens = async (query, limit = 10) => {
  const terms = query.toLowerCase().split(' ');
  
  return prisma.drugRegimen.findMany({
    where: {
      isActive: true,
      OR: [
        { drugName: { contains: query, mode: 'insensitive' } },
        { genericName: { contains: query, mode: 'insensitive' } },
        { searchTerms: { contains: query, mode: 'insensitive' } },
        { indication: { contains: query, mode: 'insensitive' } },
        { displayText: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: [
      { usageCount: 'desc' },
      { drugName: 'asc' },
    ],
    take: limit,
  });
};

export const incrementDrugRegimenUsage = async (id) => {
  return prisma.drugRegimen.update({
    where: { id },
    data: {
      usageCount: { increment: 1 },
    },
  });
};

// =====================
// EXAM SECTIONS
// =====================

export const findAllExamSections = async () => {
  return prisma.examSection.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      triggers: true,
    },
  });
};

export const findExamSectionByCode = async (code) => {
  return prisma.examSection.findUnique({
    where: { sectionCode: code },
    include: {
      triggers: true,
    },
  });
};

export const findExamSectionsForComplaint = async (chiefComplaint) => {
  // Find all triggers that match the chief complaint
  const triggers = await prisma.examTrigger.findMany({
    where: {
      chiefComplaint: {
        contains: chiefComplaint,
        mode: 'insensitive',
      },
    },
    include: {
      examSection: true,
    },
    orderBy: [
      { priority: 'asc' },
      { isRequired: 'desc' },
    ],
  });

  // If no exact matches, try to match by common complaints
  if (triggers.length === 0) {
    const commonComplaints = [
      { keywords: ['fever', 'chills', 'malaria'], complaint: 'Fever' },
      { keywords: ['cough', 'cold', 'flu'], complaint: 'Cough' },
      { keywords: ['breathing', 'breath', 'dyspnea'], complaint: 'Shortness of Breath' },
      { keywords: ['stomach', 'abdominal', 'belly'], complaint: 'Abdominal Pain' },
      { keywords: ['chest'], complaint: 'Chest Pain' },
      { keywords: ['head', 'migraine'], complaint: 'Headache' },
      { keywords: ['joint', 'knee', 'hip', 'back', 'shoulder'], complaint: 'Joint Pain' },
      { keywords: ['rash', 'itching', 'skin'], complaint: 'Rash' },
      { keywords: ['weak', 'tired', 'fatigue'], complaint: 'Weakness' },
    ];

    const lowerComplaint = chiefComplaint.toLowerCase();
    const matchedComplaint = commonComplaints.find(c => 
      c.keywords.some(k => lowerComplaint.includes(k))
    );

    if (matchedComplaint) {
      return prisma.examTrigger.findMany({
        where: {
          chiefComplaint: matchedComplaint.complaint,
        },
        include: {
          examSection: true,
        },
        orderBy: [
          { priority: 'asc' },
          { isRequired: 'desc' },
        ],
      });
    }
  }

  return triggers;
};

// =====================
// CLINICAL TEMPLATES
// =====================

export const findAllClinicalTemplates = async (filters = {}) => {
  const where = { isActive: true };

  if (filters.templateType) {
    where.templateType = filters.templateType;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  return prisma.clinicalTemplate.findMany({
    where,
    orderBy: [
      { usageCount: 'desc' },
      { sortOrder: 'asc' },
    ],
  });
};

export const findClinicalTemplateById = async (id) => {
  return prisma.clinicalTemplate.findUnique({
    where: { id },
  });
};

export const findTemplatesForCategory = async (category) => {
  return prisma.clinicalTemplate.findMany({
    where: {
      isActive: true,
      category: {
        contains: category,
        mode: 'insensitive',
      },
    },
    orderBy: [
      { usageCount: 'desc' },
      { sortOrder: 'asc' },
    ],
  });
};

export const incrementTemplateUsage = async (id) => {
  return prisma.clinicalTemplate.update({
    where: { id },
    data: {
      usageCount: { increment: 1 },
    },
  });
};

// =====================
// EXAM TRIGGERS
// =====================

export const findAllExamTriggers = async () => {
  return prisma.examTrigger.findMany({
    include: {
      examSection: true,
    },
    orderBy: [
      { chiefComplaint: 'asc' },
      { priority: 'asc' },
    ],
  });
};

export const findTriggersForComplaint = async (complaint) => {
  return prisma.examTrigger.findMany({
    where: {
      chiefComplaint: {
        equals: complaint,
        mode: 'insensitive',
      },
    },
    include: {
      examSection: true,
    },
    orderBy: { priority: 'asc' },
  });
};

export default {
  // Drug Regimens
  findAllDrugRegimens,
  findDrugRegimenById,
  searchDrugRegimens,
  incrementDrugRegimenUsage,
  
  // Exam Sections
  findAllExamSections,
  findExamSectionByCode,
  findExamSectionsForComplaint,
  
  // Clinical Templates
  findAllClinicalTemplates,
  findClinicalTemplateById,
  findTemplatesForCategory,
  incrementTemplateUsage,
  
  // Exam Triggers
  findAllExamTriggers,
  findTriggersForComplaint,
};
