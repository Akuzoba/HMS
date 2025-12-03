import { create } from 'zustand';
import api from '../lib/api';

export const useLabStore = create((set, get) => ({
  labTests: [],
  labOrders: [],
  pendingOrders: [],
  currentOrder: null,
  loading: false,
  error: null,

  // Lab Tests
  listLabTests: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/labs/tests', { params });
      set({
        labTests: response.data.data,
        loading: false,
      });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createLabTest: async (testData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/labs/tests', testData);
      set((state) => ({
        labTests: [response.data.data, ...state.labTests],
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Lab Orders
  createLabOrder: async (orderData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/labs/orders', orderData);
      set((state) => ({
        labOrders: [response.data.data, ...state.labOrders],
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  listLabOrders: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/labs/orders', { params });
      set({
        labOrders: response.data.data,
        loading: false,
      });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getPendingOrders: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/labs/orders/pending');
      set({
        pendingOrders: response.data.data,
        loading: false,
      });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getLabOrder: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/labs/orders/${orderId}`);
      set({
        currentOrder: response.data.data,
        loading: false,
      });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  collectSample: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/labs/orders/${orderId}/collect-sample`);
      set((state) => ({
        pendingOrders: state.pendingOrders.map(o => 
          o.id === orderId ? response.data.data : o
        ),
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Lab Results
  submitResults: async (resultData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/labs/results', resultData);
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getResults: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/labs/orders/${orderId}/results`);
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  verifyAllResults: async (orderId, verifiedBy) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/labs/orders/${orderId}/verify-all`, { verifiedBy });
      set((state) => ({
        pendingOrders: state.pendingOrders.filter(o => o.id !== orderId),
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getPatientLabHistory: async (patientId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/labs/patient/${patientId}/history`);
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
