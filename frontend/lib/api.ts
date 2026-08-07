import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'sonner';

// The base URL depends on where the Nginx gateway or backend is running.
// Since Next.js and Backend might run on different ports in development,
// we default to /api/v1 which will be proxied or directly accessed.
let baseURL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
if (typeof window === 'undefined' && baseURL.startsWith('/')) {
  // On the server (SSR), we need an absolute URL. Route to backend container
  // internally. API_URL_INTERNAL is set in docker-compose; fall back to the
  // compose-internal backend hostname for local dev.
  baseURL = `${process.env.API_URL_INTERNAL || 'http://backend:8080'}/api/v1`;
}

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: the JWT is carried in an httpOnly, Secure cookie set by
// the backend (M29). We do NOT touch localStorage, so a stored-token XSS
// escalation vector is removed.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error: AxiosError) => Promise.reject(error)
);

// Auth endpoints where a 401 is an expected, user-facing validation error
// (bad credentials, expired OTP, etc.). These are handled by the form itself,
// so the interceptor must stay silent and NOT redirect (M26).
const AUTH_401_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/verify',
  '/auth/reset-password',
  '/auth/resend-otp',
  '/auth/logout', // logout with an already-expired session — stay silent
  '/user/profile', // AuthProvider auth-state probe on mount — silent
];

const isSilent401 = (url?: string) =>
  !!url && AUTH_401_ENDPOINTS.some((prefix) => url.includes(prefix));

// Response Interceptor for global error handling. Toasting lives here as the
// single source of truth; 401 handling only hard-redirects for protected
// (non-auth) API calls (M26, M29).
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Something went wrong';

      if (status === 401) {
        if (isSilent401(error.config?.url)) {
          return Promise.reject(error);
        }
        toast.error('Session expired. Please login again.');
        if (typeof window !== 'undefined') {
          document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;";
          window.location.href = '/login?session_expired=true';
        }
      } else if (status >= 500) {
        toast.error('Internal Server Error. Please try again later.');
      } else {
        toast.error(message);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }
    return Promise.reject(error);
  }
);

export default api;
