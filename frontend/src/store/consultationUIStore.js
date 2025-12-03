import { create } from 'zustand';

export const useConsultationUIStore = create((set, get) => ({
  // Track which action modal to open
  pendingAction: null,
  
  // Set a pending action from sidebar
  triggerAction: (action) => set({ pendingAction: action }),
  
  // Clear the pending action after it's been handled
  clearAction: () => set({ pendingAction: null }),
  
  // Track if consultation is active (has selected patient + consultation ID)
  isConsultationActive: false,
  setConsultationActive: (active) => set({ isConsultationActive: active }),
}));
