import { create } from 'zustand';
import api from '../lib/api';

/**
 * Store for clinical documentation templates
 * - Drug Regimens (smart autocomplete)
 * - Exam Sections (dynamic physical exam forms)
 * - Clinical Templates (sentence builders)
 */

const useClinicalTemplateStore = create((set, get) => ({
  // State
  drugRegimens: [],
  searchResults: [],
  examSections: [],
  relevantExamSections: [],
  clinicalTemplates: [],
  suggestions: null,
  
  isLoading: false,
  error: null,

  // =====================
  // DRUG REGIMENS
  // =====================
  
  /**
   * Get all drug regimens
   */
  getDrugRegimens: async (filters = {}) => {
    try {
      set({ isLoading: true, error: null });
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await api.get(`/clinical-templates/drug-regimens?${params}`);
      set({ drugRegimens: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Error fetching drug regimens:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Search drug regimens (for autocomplete)
   */
  searchDrugRegimens: async (query, limit = 10) => {
    try {
      if (!query || query.length < 2) {
        set({ searchResults: [] });
        return [];
      }
      
      const response = await api.get(`/clinical-templates/drug-regimens/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      set({ searchResults: response.data });
      return response.data;
    } catch (error) {
      console.error('Error searching drug regimens:', error);
      set({ searchResults: [] });
      return [];
    }
  },

  /**
   * Record usage of a drug regimen (for popularity ranking)
   */
  recordRegimenUsage: async (id) => {
    try {
      await api.post(`/clinical-templates/drug-regimens/${id}/usage`);
    } catch (error) {
      console.error('Error recording regimen usage:', error);
    }
  },

  // =====================
  // EXAM SECTIONS
  // =====================

  /**
   * Get all exam sections
   */
  getExamSections: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get('/clinical-templates/exam-sections');
      set({ examSections: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Error fetching exam sections:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Get exam sections relevant to a chief complaint
   */
  getRelevantExamSections: async (complaint) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get(`/clinical-templates/exam-sections/relevant?complaint=${encodeURIComponent(complaint)}`);
      set({ relevantExamSections: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Error fetching relevant exam sections:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Get single exam section by code
   */
  getExamSectionByCode: async (code) => {
    try {
      const response = await api.get(`/clinical-templates/exam-sections/${code}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exam section:', error);
      throw error;
    }
  },

  // =====================
  // CLINICAL TEMPLATES
  // =====================

  /**
   * Get all clinical templates
   */
  getClinicalTemplates: async (filters = {}) => {
    try {
      set({ isLoading: true, error: null });
      const params = new URLSearchParams();
      if (filters.templateType) params.append('templateType', filters.templateType);
      if (filters.category) params.append('category', filters.category);
      
      const response = await api.get(`/clinical-templates/templates?${params}`);
      set({ clinicalTemplates: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Error fetching clinical templates:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Get templates for a specific category
   */
  getTemplatesForCategory: async (category) => {
    try {
      const response = await api.get(`/clinical-templates/templates/category/${category}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching templates for category:', error);
      throw error;
    }
  },

  /**
   * Generate clinical text from a template
   */
  generateClinicalText: async (templateId, values) => {
    try {
      const response = await api.post(`/clinical-templates/templates/${templateId}/generate`, { values });
      return response.data;
    } catch (error) {
      console.error('Error generating clinical text:', error);
      throw error;
    }
  },

  // =====================
  // SMART SUGGESTIONS
  // =====================

  /**
   * Get smart suggestions based on chief complaint
   * Returns relevant drug regimens, templates, and exam sections
   */
  getSmartSuggestions: async (complaint) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get(`/clinical-templates/suggestions?complaint=${encodeURIComponent(complaint)}`);
      set({ suggestions: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Error fetching smart suggestions:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Clear current suggestions
   */
  clearSuggestions: () => {
    set({ suggestions: null, relevantExamSections: [], searchResults: [] });
  },

  // =====================
  // UTILITY
  // =====================

  /**
   * Clear all errors
   */
  clearError: () => set({ error: null }),

  /**
   * Reset store
   */
  reset: () => set({
    drugRegimens: [],
    searchResults: [],
    examSections: [],
    relevantExamSections: [],
    clinicalTemplates: [],
    suggestions: null,
    isLoading: false,
    error: null,
  }),
}));

export default useClinicalTemplateStore;
