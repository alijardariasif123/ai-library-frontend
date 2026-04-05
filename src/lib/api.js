// frontend/src/lib/api.js
import axios from 'axios';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const api = axios.create({
  baseURL: `${BACKEND.replace(/\/$/, '')}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
  withCredentials: true
});

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

const initialToken = localStorage.getItem(ACCESS_KEY);
if (initialToken) api.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_KEY);
    if (token) { config.headers = config.headers || {}; config.headers.Authorization = `Bearer ${token}`; }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const status = error.response?.status;
    const isRefreshCall = originalRequest.url && originalRequest.url.replace(api.defaults.baseURL || '', '').includes('/auth/refresh');

    if (status === 401 && !originalRequest._retry && !isRefreshCall) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (refreshToken) {
        try {
          const res = await api.post('/auth/refresh', { refreshToken });
          const newAccess = res.data?.accessToken || res.data?.tokens?.accessToken;
          if (!newAccess) throw new Error('No access token in refresh response');
          localStorage.setItem(ACCESS_KEY, newAccess);
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch (err) {
          console.warn('Refresh failed:', err);
          localStorage.removeItem(ACCESS_KEY);
          localStorage.removeItem(REFRESH_KEY);
          window.location.assign('/auth');
          return Promise.reject(err);
        }
      } else {
        localStorage.removeItem(ACCESS_KEY);
        window.location.assign('/auth');
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { api };
