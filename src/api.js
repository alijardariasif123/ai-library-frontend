// File: src/api.js
import axios from 'axios';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// IMPORTANT: set baseURL to include /api so frontend can call endpoints like api.post('/ai/query')
const api = axios.create({
  baseURL: `${BACKEND.replace(/\/$/, '')}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60s
  withCredentials: true // keep this true if you rely on cookies for auth; safe otherwise
});

// Named & default export so both `import api from './api'` and `import { api }` work
// Attach token from localStorage (if available)
const ACCESS_KEY = 'accessToken'; // change if your app uses a different key (e.g., 'token')
const REFRESH_KEY = 'refreshToken';

const initialToken = localStorage.getItem(ACCESS_KEY);
if (initialToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

// Request interceptor: ensure latest token is attached
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and try refresh (safe & guarded)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // if there's no original request config, just reject
    if (!originalRequest) return Promise.reject(error);

    const status = error.response?.status;

    // avoid trying to refresh if the original request was to the refresh endpoint
    const isRefreshCall =
      originalRequest.url && originalRequest.url.replace(api.defaults.baseURL || '', '').includes('/auth/refresh');

    // Only try refresh once per request
    if (status === 401 && !originalRequest._retry && !isRefreshCall) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (refreshToken) {
        try {
          // Call refresh (note: baseURL already includes /api, so path is /auth/refresh)
          const res = await api.post('/auth/refresh', { refreshToken });

          const newAccess =
            res.data?.accessToken || res.data?.tokens?.accessToken || res.data?.tokens?.access_token;

          if (!newAccess) {
            throw new Error('No access token in refresh response');
          }

          // persist and update defaults
          localStorage.setItem(ACCESS_KEY, newAccess);
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;

          // also set on original request and retry
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;

          return api(originalRequest);
        } catch (err) {
          console.warn('Token refresh failed:', err);
          // cleanup and redirect to login
          localStorage.removeItem(ACCESS_KEY);
          localStorage.removeItem(REFRESH_KEY);
          // SPA-safe redirect
          window.location.assign('/auth');
          return Promise.reject(err);
        }
      } else {
        // no refresh token -> force login
        localStorage.removeItem(ACCESS_KEY);
        window.location.assign('/auth');
        return Promise.reject(error);
      }
    }

    // For other errors or repeated failures, just reject
    return Promise.reject(error);
  }
);

export default api;
export { api };
