import { create } from 'zustand';
import api from '../lib/api';

export const useIPDStore = create((set, get) => ({
  // State
  wards: [],
  beds: [],
  admissions: [],
  currentAdmission: null,
  stats: null,
  loading: false,
  error: null,

  // =====================
  // WARD OPERATIONS
  // =====================

  createWard: async (wardData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/ipd/wards', wardData);
      set((state) => ({
        wards: [response.data.data, ...state.wards],
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to create ward',
        loading: false,
      });
      throw error;
    }
  },

  listWards: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/ipd/wards', { params: filters });
      set({ wards: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch wards',
        loading: false,
      });
      throw error;
    }
  },

  getWard: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/ipd/wards/${id}`);
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch ward',
        loading: false,
      });
      throw error;
    }
  },

  updateWard: async (id, wardData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/ipd/wards/${id}`, wardData);
      set((state) => ({
        wards: state.wards.map((w) => (w.id === id ? response.data.data : w)),
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update ward',
        loading: false,
      });
      throw error;
    }
  },

  getWardOccupancy: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/ipd/wards/occupancy');
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch ward occupancy',
        loading: false,
      });
      throw error;
    }
  },

  // =====================
  // BED OPERATIONS
  // =====================

  createBed: async (bedData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/ipd/beds', bedData);
      set((state) => ({
        beds: [response.data.data, ...state.beds],
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to create bed',
        loading: false,
      });
      throw error;
    }
  },

  createMultipleBeds: async (wardId, bedData, count) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/ipd/beds/bulk', { wardId, ...bedData, count });
      set((state) => ({
        beds: [...response.data.data, ...state.beds],
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to create beds',
        loading: false,
      });
      throw error;
    }
  },

  getBed: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/ipd/beds/${id}`);
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch bed',
        loading: false,
      });
      throw error;
    }
  },

  getBedsByWard: async (wardId, status) => {
    set({ loading: true, error: null });
    try {
      const params = {};
      if (status) params.status = status;
      const response = await api.get(`/ipd/beds/ward/${wardId}`, { params });
      set({ beds: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch beds',
        loading: false,
      });
      throw error;
    }
  },

  getAvailableBeds: async (wardId) => {
    set({ loading: true, error: null });
    try {
      const params = {};
      if (wardId) params.wardId = wardId;
      const response = await api.get('/ipd/beds/available', { params });
      set({ beds: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch available beds',
        loading: false,
      });
      throw error;
    }
  },

  updateBed: async (id, bedData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/ipd/beds/${id}`, bedData);
      set((state) => ({
        beds: state.beds.map((b) => (b.id === id ? response.data.data : b)),
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update bed',
        loading: false,
      });
      throw error;
    }
  },

  updateBedStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/ipd/beds/${id}/status`, { status });
      set((state) => ({
        beds: state.beds.map((b) => (b.id === id ? response.data.data : b)),
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update bed status',
        loading: false,
      });
      throw error;
    }
  },

  // =====================
  // ADMISSION OPERATIONS
  // =====================

  createAdmission: async (admissionData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/ipd/admissions', admissionData);
      set((state) => ({
        admissions: [response.data.data, ...state.admissions],
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to create admission',
        loading: false,
      });
      throw error;
    }
  },

  getAdmission: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/ipd/admissions/${id}`);
      set({ currentAdmission: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch admission',
        loading: false,
      });
      throw error;
    }
  },

  getAdmissionByNumber: async (admissionNumber) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/ipd/admissions/number/${admissionNumber}`);
      set({ currentAdmission: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch admission',
        loading: false,
      });
      throw error;
    }
  },

  listAdmissions: async (filters = {}, pagination = {}) => {
    set({ loading: true, error: null });
    try {
      const params = { ...filters, ...pagination };
      const response = await api.get('/ipd/admissions', { params });
      set({ admissions: response.data.data, loading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch admissions',
        loading: false,
      });
      throw error;
    }
  },

  getCurrentAdmissions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/ipd/admissions/current');
      set({ admissions: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch current admissions',
        loading: false,
      });
      throw error;
    }
  },

  updateAdmission: async (id, admissionData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/ipd/admissions/${id}`, admissionData);
      set((state) => ({
        admissions: state.admissions.map((a) => (a.id === id ? response.data.data : a)),
        currentAdmission: response.data.data,
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update admission',
        loading: false,
      });
      throw error;
    }
  },

  dischargePatient: async (id, dischargeData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/ipd/admissions/${id}/discharge`, dischargeData);
      set((state) => ({
        admissions: state.admissions.filter((a) => a.id !== id),
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to discharge patient',
        loading: false,
      });
      throw error;
    }
  },

  transferBed: async (admissionId, newBedId, transferData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/ipd/admissions/${admissionId}/transfer`, {
        newBedId,
        ...transferData,
      });
      set((state) => ({
        admissions: state.admissions.map((a) => (a.id === admissionId ? response.data.data : a)),
        currentAdmission: response.data.data,
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to transfer bed',
        loading: false,
      });
      throw error;
    }
  },

  // =====================
  // DAILY ROUNDS
  // =====================

  createDailyRound: async (roundData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/ipd/rounds', roundData);
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to create daily round',
        loading: false,
      });
      throw error;
    }
  },

  getDailyRoundsByAdmission: async (admissionId, pagination = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/ipd/rounds/admission/${admissionId}`, { params: pagination });
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch daily rounds',
        loading: false,
      });
      throw error;
    }
  },

  getTodayRounds: async (doctorId) => {
    set({ loading: true, error: null });
    try {
      const params = {};
      if (doctorId) params.doctorId = doctorId;
      const response = await api.get('/ipd/rounds/today', { params });
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch today rounds',
        loading: false,
      });
      throw error;
    }
  },

  // =====================
  // VITALS
  // =====================

  createIPDVital: async (vitalData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/ipd/vitals', vitalData);
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to record vitals',
        loading: false,
      });
      throw error;
    }
  },

  getVitalsByAdmission: async (admissionId, pagination = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/ipd/vitals/admission/${admissionId}`, { params: pagination });
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch vitals',
        loading: false,
      });
      throw error;
    }
  },

  // =====================
  // MEDICATIONS
  // =====================

  createIPDMedication: async (medicationData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/ipd/medications', medicationData);
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to schedule medication',
        loading: false,
      });
      throw error;
    }
  },

  getMedicationSchedule: async (admissionId, date) => {
    set({ loading: true, error: null });
    try {
      const params = {};
      if (date) params.date = date;
      const response = await api.get(`/ipd/medications/schedule/${admissionId}`, { params });
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch medication schedule',
        loading: false,
      });
      throw error;
    }
  },

  administerMedication: async (medicationId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/ipd/medications/${medicationId}/administer`);
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to administer medication',
        loading: false,
      });
      throw error;
    }
  },

  holdMedication: async (medicationId, holdReason) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/ipd/medications/${medicationId}/hold`, { holdReason });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to hold medication',
        loading: false,
      });
      throw error;
    }
  },

  // =====================
  // STATS
  // =====================

  getStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/ipd/stats');
      set({ stats: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch IPD stats',
        loading: false,
      });
      throw error;
    }
  },

  // =====================
  // UTILITY
  // =====================

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      wards: [],
      beds: [],
      admissions: [],
      currentAdmission: null,
      stats: null,
      loading: false,
      error: null,
    }),
}));
