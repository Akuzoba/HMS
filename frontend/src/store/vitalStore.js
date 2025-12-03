import { create } from 'zustand';
import api from '../lib/api';

export const useVitalStore = create((set, get) => ({
  vitals: [],
  currentVital: null,
  loading: false,
  error: null,

  // Record new vitals
  recordVitals: async (vitalData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/vitals', vitalData);
      set((state) => ({
        vitals: [response.data.data, ...state.vitals],
        currentVital: response.data.data,
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to record vitals',
        loading: false,
      });
      throw error;
    }
  },

  // Get vitals for a visit
  getVisitVitals: async (visitId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/vitals/visit/${visitId}`);
      set({ vitals: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch vitals',
        loading: false,
      });
      throw error;
    }
  },

  // Get specific vital record
  getVital: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/vitals/${id}`);
      set({ currentVital: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch vital',
        loading: false,
      });
      throw error;
    }
  },

  // Update vitals
  updateVitals: async (id, vitalData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/vitals/${id}`, vitalData);
      set((state) => ({
        vitals: state.vitals.map((v) =>
          v.id === id ? response.data.data : v
        ),
        currentVital: response.data.data,
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update vitals',
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
      vitals: [],
      currentVital: null,
      loading: false,
      error: null,
    }),
}));
