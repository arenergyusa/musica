import axios from 'axios';
import { toast } from 'sonner';

// The base URL depends on where the Nginx gateway or backend is running.
// Since Next.js and Backend might run on different ports in development,
// we default to /api/v1 which will be proxied or directly accessed.
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api/v1';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    // We only access localStorage in the browser
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Something went wrong';

      if (status === 401) {
        const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
        
        if (isAuthRoute) {
          // If it's a 401 on login, just show the error message (e.g., "invalid credentials")
          toast.error(message || 'Invalid email or password');
        } else {
          // Handle unauthorized (e.g. token expired) for protected routes
          toast.error('Session expired. Please login again.');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = '/login';
          }
        }
      } else if (status >= 500) {
        toast.error('Internal Server Error. Please try again later.');
      } else {
        // Show the specific error message from the backend
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
