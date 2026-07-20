/* eslint-disable */
import { create } from 'zustand';
import { api } from '@/lib/api';

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type KycStatus = 'UNINITIALIZED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  kycStatus: KycStatus;
  referralCode: string;
  bank_account?: string;
  ifsc?: string;
  pan?: string;
  aadhaar?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchUser: () => Promise<void>;
  logout: () => void;
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
        userData.kycStatus = userData.kyc_status || userData.kycStatus;
        userData.referralCode = userData.referral_code || userData.referralCode;
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
  
  logout: () => {
    // Clear localStorage token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      // Clear cookie
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
    // Force reload or redirect to trigger middleware
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}));
