import { create } from 'zustand';
import api from '../lib/api';

export const usePatientStore = create((set, get) => ({
  patients: [],
  currentPatient: null,
  searchResults: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  },

  searchPatients: async (searchTerm) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/patients/search', {
        params: { q: searchTerm, limit: 20 }
      });
      set({
        searchResults: response.data.data.patients,
        isLoading: false
      });
      return { success: true, data: response.data.data.patients };
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Search failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  createPatient: async (patientData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/patients', patientData);
      const newPatient = response.data.data;
      
      set(state => ({
        patients: [newPatient, ...state.patients],
        currentPatient: newPatient,
        isLoading: false
      }));
      
      return { success: true, data: newPatient };
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to create patient';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  getPatientById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/patients/${id}`);
      set({
        currentPatient: response.data.data,
        isLoading: false
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to fetch patient';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  updatePatient: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/patients/${id}`, data);
      const updatedPatient = response.data.data;
      
      set(state => ({
        patients: state.patients.map(p => p.id === id ? updatedPatient : p),
        currentPatient: state.currentPatient?.id === id ? updatedPatient : state.currentPatient,
        isLoading: false
      }));
      
      return { success: true, data: updatedPatient };
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to update patient';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  listPatients: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { page = 1, limit = 20 } = params;
      const response = await api.get('/patients', {
        params: { page, limit }
      });
      
      const data = response.data.data;
      set({
        patients: data.patients || data,
        pagination: data.pagination || { page: 1, limit: 20, total: (data.patients || data).length, pages: 1 },
        isLoading: false
      });
      return data.patients || data;
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to fetch patients';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearCurrentPatient: () => set({ currentPatient: null }),
  clearSearchResults: () => set({ searchResults: [] }),
  clearError: () => set({ error: null })
}));
