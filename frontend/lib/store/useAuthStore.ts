/* eslint-disable */
import { create } from 'zustand';
import { api } from '@/lib/api';

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  referralCode?: string;
  usdtAddress?: string;
  usdt_address?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  
  fetchUser: async () => {
    try {
      const response = await api.get('/user/profile');
      const userData = response.data.data;
      if (userData) {
        userData.referralCode = userData.invite_code || userData.referral_code || userData.referralCode;
        userData.usdtAddress = userData.usdt_address || userData.usdtAddress;
      }
      set({ 
        user: userData, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },
  
  logout: async () => {
    // Best-effort background API call
    api.post('/auth/logout').catch((error) => {
      console.error('Logout API failed:', error);
    });

    // Immediately clear client session
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      // Clear cookie (fallback)
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
    // Force reload or redirect to trigger middleware
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}));
