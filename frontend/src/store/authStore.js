import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', credentials);
          const { user, accessToken, refreshToken } = response.data.data;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false
          });

          // Set token in API instance
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error?.message || 'Login failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          // Continue with logout even if API call fails
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false
          });
          delete api.defaults.headers.common['Authorization'];
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true });
        try {
          const response = await api.patch(`/users/${get().user.id}`, data);
          set({ user: response.data.data, isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data?.error?.message };
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'his-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Initialize auth token on app load
if (useAuthStore.getState().accessToken) {
  api.defaults.headers.common['Authorization'] = 
    `Bearer ${useAuthStore.getState().accessToken}`;
}
