import { create } from 'zustand';
import api from '../lib/api';

export const useConsultationStore = create((set, get) => ({
  consultations: [],
  currentConsultation: null,
  loading: false,
  error: null,

  // Create new consultation
  createConsultation: async (consultationData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/consultations', consultationData);
      set((state) => ({
        consultations: [response.data.data, ...state.consultations],
        currentConsultation: response.data.data,
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to create consultation',
        loading: false,
      });
      throw error;
    }
  },

  // Get consultation by ID
  getConsultation: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/consultations/${id}`);
      set({ currentConsultation: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch consultation',
        loading: false,
      });
      throw error;
    }
  },

  // Get consultations by visit ID
  getVisitConsultations: async (visitId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/consultations/visit/${visitId}`);
      set({ consultations: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch consultations',
        loading: false,
      });
      throw error;
    }
  },

  // List consultations with filters
  listConsultations: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/consultations', { params });
      set({
        consultations: response.data.data,
        loading: false,
      });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch consultations',
        loading: false,
      });
      throw error;
    }
  },

  // Update consultation
  updateConsultation: async (id, consultationData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/consultations/${id}`, consultationData);
      set((state) => ({
        consultations: state.consultations.map((c) =>
          c.id === id ? response.data.data : c
        ),
        currentConsultation: response.data.data,
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update consultation',
        loading: false,
      });
      throw error;
    }
  },

  // Add diagnosis
  addDiagnosis: async (consultationId, diagnosisData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(
        `/consultations/${consultationId}/diagnosis`,
        diagnosisData
      );
      // Refresh consultation to get updated diagnoses
      await get().getConsultation(consultationId);
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to add diagnosis',
        loading: false,
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () =>
    set({
      consultations: [],
      currentConsultation: null,
      loading: false,
      error: null,
    }),
}));
