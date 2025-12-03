import { create } from 'zustand';
import api from '../lib/api';

export const useServicesStore = create((set, get) => ({
  services: [],
  servicesByCategory: {},
  currentService: null,
  visitCharges: [],
  loading: false,
  error: null,

  // Service Categories
  categories: [
    { value: 'CONSULTATION', label: 'Consultation' },
    { value: 'LABORATORY', label: 'Laboratory' },
    { value: 'PHARMACY', label: 'Pharmacy' },
    { value: 'PROCEDURE', label: 'Procedure' },
    { value: 'NURSING', label: 'Nursing' },
    { value: 'RADIOLOGY', label: 'Radiology' },
    { value: 'ADMISSION', label: 'Admission' },
    { value: 'OTHER', label: 'Other' },
  ],

  // Fetch all services
  getServices: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/services');
      const services = response.data.data;
      
      // Group by category
      const servicesByCategory = services.reduce((acc, service) => {
        const category = service.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(service);
        return acc;
      }, {});
      
      set({
        services,
        servicesByCategory,
        loading: false,
      });
      return services;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Fetch services by category
  getServicesByCategory: async (category) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/services/category/${category}`);
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Create new service
  createService: async (serviceData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/services', serviceData);
      const newService = response.data.data;
      set((state) => ({
        services: [newService, ...state.services],
        loading: false,
      }));
      // Refresh to update categories
      get().getServices();
      return newService;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update service
  updateService: async (serviceId, serviceData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/services/${serviceId}`, serviceData);
      const updatedService = response.data.data;
      set((state) => ({
        services: state.services.map(s => 
          s.id === serviceId ? updatedService : s
        ),
        loading: false,
      }));
      // Refresh to update categories
      get().getServices();
      return updatedService;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Add charge to a visit
  addVisitCharge: async (visitId, chargeData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/services/visits/${visitId}/charges`, chargeData);
      const newCharge = response.data.data;
      set((state) => ({
        visitCharges: [...state.visitCharges, newCharge],
        loading: false,
      }));
      return newCharge;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get visit charges
  getVisitCharges: async (visitId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/services/visits/${visitId}/charges`);
      set({
        visitCharges: response.data.data,
        loading: false,
      });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Clear visit charges
  clearVisitCharges: () => {
    set({ visitCharges: [] });
  },

  // Get active services only
  getActiveServices: () => {
    return get().services.filter(s => s.isActive);
  },

  // Get service by ID
  getServiceById: (serviceId) => {
    return get().services.find(s => s.id === serviceId);
  },
}));
