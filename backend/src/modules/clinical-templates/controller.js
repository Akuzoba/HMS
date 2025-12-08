import * as service from './service.js';

/**
 * Controller for clinical documentation templates API
 */

// =====================
// DRUG REGIMENS
// =====================

export const getDrugRegimens = async (req, res) => {
  try {
    const { category, search, limit } = req.query;
    const regimens = await service.getDrugRegimens({ category, search, limit: parseInt(limit) || 20 });
    res.json(regimens);
  } catch (error) {
    console.error('Error getting drug regimens:', error);
    res.status(500).json({ error: 'Failed to fetch drug regimens' });
  }
};

export const getDrugRegimenById = async (req, res) => {
  try {
    const { id } = req.params;
    const regimen = await service.getDrugRegimenById(id);
    res.json(regimen);
  } catch (error) {
    if (error.message === 'Drug regimen not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error getting drug regimen:', error);
    res.status(500).json({ error: 'Failed to fetch drug regimen' });
  }
};

export const searchDrugRegimens = async (req, res) => {
  try {
    const { q, limit } = req.query;
    const regimens = await service.searchDrugRegimens(q, parseInt(limit) || 10);
    res.json(regimens);
  } catch (error) {
    console.error('Error searching drug regimens:', error);
    res.status(500).json({ error: 'Failed to search drug regimens' });
  }
};

export const recordDrugRegimenUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const regimen = await service.recordDrugRegimenUsage(id);
    res.json(regimen);
  } catch (error) {
    console.error('Error recording drug regimen usage:', error);
    res.status(500).json({ error: 'Failed to record usage' });
  }
};

// =====================
// EXAM SECTIONS
// =====================

export const getExamSections = async (req, res) => {
  try {
    const sections = await service.getExamSections();
    res.json(sections);
  } catch (error) {
    console.error('Error getting exam sections:', error);
    res.status(500).json({ error: 'Failed to fetch exam sections' });
  }
};

export const getExamSectionByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const section = await service.getExamSectionByCode(code);
    res.json(section);
  } catch (error) {
    if (error.message === 'Exam section not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error getting exam section:', error);
    res.status(500).json({ error: 'Failed to fetch exam section' });
  }
};

export const getRelevantExamSections = async (req, res) => {
  try {
    const { complaint } = req.query;
    const sections = await service.getRelevantExamSections(complaint);
    res.json(sections);
  } catch (error) {
    console.error('Error getting relevant exam sections:', error);
    res.status(500).json({ error: 'Failed to fetch exam sections' });
  }
};

// =====================
// CLINICAL TEMPLATES
// =====================

export const getClinicalTemplates = async (req, res) => {
  try {
    const { templateType, category } = req.query;
    const templates = await service.getClinicalTemplates({ templateType, category });
    res.json(templates);
  } catch (error) {
    console.error('Error getting clinical templates:', error);
    res.status(500).json({ error: 'Failed to fetch clinical templates' });
  }
};

export const getClinicalTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await service.getClinicalTemplateById(id);
    res.json(template);
  } catch (error) {
    if (error.message === 'Clinical template not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error getting clinical template:', error);
    res.status(500).json({ error: 'Failed to fetch clinical template' });
  }
};

export const getTemplatesForCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const templates = await service.getTemplatesForCategory(category);
    res.json(templates);
  } catch (error) {
    console.error('Error getting templates for category:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

export const generateClinicalText = async (req, res) => {
  try {
    const { id } = req.params;
    const { values } = req.body;
    const result = await service.generateClinicalText(id, values);
    res.json(result);
  } catch (error) {
    if (error.message === 'Clinical template not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error generating clinical text:', error);
    res.status(500).json({ error: 'Failed to generate clinical text' });
  }
};

// =====================
// SMART SUGGESTIONS
// =====================

export const getSmartSuggestions = async (req, res) => {
  try {
    const { complaint } = req.query;
    if (!complaint) {
      return res.status(400).json({ error: 'Chief complaint is required' });
    }
    const suggestions = await service.getSmartSuggestions(complaint);
    res.json(suggestions);
  } catch (error) {
    console.error('Error getting smart suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
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
  generateClinicalText,
  
  // Smart Suggestions
  getSmartSuggestions,
};
