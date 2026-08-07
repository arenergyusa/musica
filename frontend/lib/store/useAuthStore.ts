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
  invite_code?: string;
  referral_code?: string;
  usdtAddress?: string;
  usdt_address?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchUser: () => Promise<void>;
  logout: (redirectTo?: string) => Promise<void>;
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
  
  logout: async (redirectTo = '/login') => {
    try {
      // Await the server call so its Set-Cookie (HttpOnly token clear + Redis
      // blacklist) lands BEFORE we navigate away. Navigating immediately aborts
      // the in-flight request and leaves the HttpOnly cookie alive — JS cannot
      // delete an HttpOnly cookie, so the middleware then bounces /login back
      // to the dashboard and the user can never log out.
      await api.post('/auth/logout', {}, { timeout: 5000 });
    } catch (error) {
      console.error('Logout API failed:', error);
    }

    // Best-effort client-side clear; the authoritative clear is the server's
    // Set-Cookie above. HttpOnly cookies cannot be removed from JS (M29).
    if (typeof window !== 'undefined') {
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;";
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
    // Force reload or redirect to trigger middleware
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  }
}));
