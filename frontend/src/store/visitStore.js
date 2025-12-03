import { create } from 'zustand';
import api from '../lib/api';

export const useVisitStore = create((set, get) => ({
  visits: [],
  currentVisit: null,
  loading: false,
  error: null,

  // Create new visit
  createVisit: async (visitData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/visits', visitData);
      set((state) => ({
        visits: [response.data.data, ...state.visits],
        currentVisit: response.data.data,
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get all visits
  listVisits: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/visits', { params });
      set({
        visits: response.data.data,
        loading: false,
      });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get visit by ID
  getVisit: async (visitId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/visits/${visitId}`);
      set({
        currentVisit: response.data.data,
        loading: false,
      });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get patient visits
  getPatientVisits: async (patientId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/visits/patient/${patientId}`);
      set({
        visits: response.data.data,
        loading: false,
      });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update visit
  updateVisit: async (visitId, visitData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/visits/${visitId}`, visitData);
      set((state) => ({
        visits: state.visits.map((v) =>
          v.id === visitId ? response.data.data : v
        ),
        currentVisit: response.data.data,
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Delete visit
  deleteVisit: async (visitId) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/visits/${visitId}`);
      set((state) => ({
        visits: state.visits.filter((v) => v.id !== visitId),
        currentVisit: null,
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Reset state
  reset: () => {
    set({
      visits: [],
      currentVisit: null,
      loading: false,
      error: null,
    });
  },
}));
