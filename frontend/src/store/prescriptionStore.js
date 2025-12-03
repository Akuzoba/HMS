import { create } from 'zustand';
import api from '../lib/api';

export const usePrescriptionStore = create((set, get) => ({
  prescriptions: [],
  pendingPrescriptions: [],
  currentPrescription: null,
  loading: false,
  error: null,

  // Create prescription
  createPrescription: async (prescriptionData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/prescriptions', prescriptionData);
      set((state) => ({
        prescriptions: [response.data.data, ...state.prescriptions],
        currentPrescription: response.data.data,
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to create prescription',
        loading: false,
      });
      throw error;
    }
  },

  // Get prescription by ID
  getPrescription: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/prescriptions/${id}`);
      set({ currentPrescription: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch prescription',
        loading: false,
      });
      throw error;
    }
  },

  // Get prescriptions by consultation
  getConsultationPrescriptions: async (consultationId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(
        `/prescriptions/consultation/${consultationId}`
      );
      set({ prescriptions: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch prescriptions',
        loading: false,
      });
      throw error;
    }
  },

  // Get pending prescriptions
  getPendingPrescriptions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/prescriptions/pending');
      set({ pendingPrescriptions: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch pending prescriptions',
        loading: false,
      });
      throw error;
    }
  },

  // Dispense prescription
  dispensePrescription: async (id, dispenseData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/prescriptions/${id}/dispense`, dispenseData);
      set((state) => ({
        prescriptions: state.prescriptions.map((p) =>
          p.id === id ? response.data.data : p
        ),
        pendingPrescriptions: state.pendingPrescriptions.filter((p) => p.id !== id),
        currentPrescription: response.data.data,
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to dispense prescription',
        loading: false,
      });
      throw error;
    }
  },

  // Cancel prescription
  cancelPrescription: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/prescriptions/${id}/cancel`);
      set((state) => ({
        prescriptions: state.prescriptions.map((p) =>
          p.id === id ? response.data.data : p
        ),
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to cancel prescription',
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
      prescriptions: [],
      pendingPrescriptions: [],
      currentPrescription: null,
      loading: false,
      error: null,
    }),
}));


export const usePharmacyStore = create((set) => ({
  drugs: [],
  lowStockDrugs: [],
  expiringBatches: [],
  batches: [],
  inventoryLogs: [],
  alerts: null,
  currentDrug: null,
  loading: false,
  error: null,

  // Create a new drug
  createDrug: async (drugData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/pharmacy/drugs', drugData);
      set((state) => ({
        drugs: [response.data.data, ...state.drugs],
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to create drug',
        loading: false,
      });
      throw error;
    }
  },

  // Get all drugs
  listDrugs: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/pharmacy/drugs', { params });
      set({ drugs: response.data.data, loading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch drugs',
        loading: false,
      });
      throw error;
    }
  },

  // Get drug by ID
  getDrug: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/pharmacy/drugs/${id}`);
      set({ currentDrug: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch drug',
        loading: false,
      });
      throw error;
    }
  },

  // Get low stock drugs
  getLowStockDrugs: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/pharmacy/drugs/low-stock');
      set({ lowStockDrugs: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch low stock drugs',
        loading: false,
      });
      throw error;
    }
  },

  // Update drug stock (legacy - kept for compatibility)
  updateStock: async (id, quantity, operation = 'add') => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/pharmacy/drugs/${id}/stock`, {
        quantity,
        operation,
      });
      set((state) => ({
        drugs: state.drugs.map((d) => (d.id === id ? response.data.data : d)),
        currentDrug: response.data.data,
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update stock',
        loading: false,
      });
      throw error;
    }
  },

  // =====================
  // BATCH MANAGEMENT
  // =====================

  // Receive new batch (add stock)
  receiveBatch: async (drugId, batchData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/pharmacy/drugs/${drugId}/receive-batch`, batchData);
      set((state) => ({
        drugs: state.drugs.map((d) => (d.id === drugId ? { ...d, stockQuantity: d.stockQuantity + batchData.quantity } : d)),
        batches: [response.data.data, ...state.batches],
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to receive batch',
        loading: false,
      });
      throw error;
    }
  },

  // Dispense stock
  dispenseStock: async (drugId, dispenseData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/pharmacy/drugs/${drugId}/dispense`, dispenseData);
      set((state) => ({
        drugs: state.drugs.map((d) => (d.id === drugId ? { ...d, stockQuantity: d.stockQuantity - dispenseData.quantity } : d)),
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to dispense stock',
        loading: false,
      });
      throw error;
    }
  },

  // Get batches for a drug
  getBatches: async (drugId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/pharmacy/batches/${drugId}`);
      set({ batches: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch batches',
        loading: false,
      });
      throw error;
    }
  },

  // =====================
  // ALERTS & REPORTS
  // =====================

  // Get all alerts (low stock + expiring)
  getAlerts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/pharmacy/alerts');
      set({ 
        alerts: response.data.data,
        lowStockDrugs: response.data.data?.lowStock || [],
        expiringBatches: response.data.data?.expiring || [],
        loading: false 
      });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch alerts',
        loading: false,
      });
      throw error;
    }
  },

  // Get inventory logs
  getInventoryLogs: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/pharmacy/inventory-logs', { params });
      set({ inventoryLogs: response.data.data, loading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch inventory logs',
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
      drugs: [],
      lowStockDrugs: [],
      expiringBatches: [],
      batches: [],
      inventoryLogs: [],
      alerts: null,
      currentDrug: null,
      loading: false,
      error: null,
    }),
}));

