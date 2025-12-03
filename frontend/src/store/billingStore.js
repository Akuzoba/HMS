import { create } from 'zustand';
import api from '../lib/api';

export const useBillingStore = create((set, get) => ({
  bills: [],
  pendingBills: [],
  currentBill: null,
  stats: null,
  paymentHistory: [],
  paymentsPagination: null,
  loading: false,
  error: null,

  // Bills
  createBill: async (billData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/billing/bills', billData);
      set((state) => ({
        bills: [response.data.data, ...state.bills],
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  listBills: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/billing/bills', { params });
      set({
        bills: response.data.data,
        loading: false,
      });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getPendingBills: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/billing/bills/pending');
      set({
        pendingBills: response.data.data,
        loading: false,
      });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getBill: async (billId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/billing/bills/${billId}`);
      set({
        currentBill: response.data.data,
        loading: false,
      });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getPatientBills: async (patientId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/billing/patient/${patientId}/bills`);
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Payments
  recordPayment: async (paymentData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/billing/payments', paymentData);
      // Update bill in state
      const updatedBill = response.data.data.bill;
      set((state) => ({
        pendingBills: state.pendingBills.map(b => 
          b.id === updatedBill.id ? updatedBill : b
        ).filter(b => b.status !== 'PAID'),
        currentBill: state.currentBill?.id === updatedBill.id ? updatedBill : state.currentBill,
        loading: false,
      }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Stats
  getBillingStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/billing/bills/stats');
      set({
        stats: response.data.data,
        loading: false,
      });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Receipt
  generateReceipt: async (billId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/billing/bills/${billId}/receipt`);
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Payment history
  getPaymentHistory: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/billing/payments', { params });
      set({
        paymentHistory: response.data.data.payments,
        paymentsPagination: response.data.data.pagination,
        loading: false,
      });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Visit charges
  getVisitCharges: async (visitId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/billing/visits/${visitId}/charges`);
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  generateBillFromVisit: async (visitId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/billing/visits/${visitId}/generate-bill`);
      const newBill = response.data.data;
      set((state) => ({
        bills: [newBill, ...state.bills],
        pendingBills: [newBill, ...state.pendingBills],
        loading: false,
      }));
      return newBill;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
