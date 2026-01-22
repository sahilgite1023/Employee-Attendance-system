import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Handle IP restriction error
      if (error.response.data?.code === 'IP_RESTRICTED') {
        window.location.href = '/restricted';
        return Promise.reject(error);
      }

      // Handle unauthorized errors
      if (error.response.status === 401) {
        Cookies.remove('token');
        Cookies.remove('user');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH APIs
// ============================================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
};

// ============================================
// ATTENDANCE APIs
// ============================================
export const attendanceAPI = {
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: () => api.post('/attendance/check-out'),
  getTodayAttendance: () => api.get('/attendance/today'),
  getHistory: (params) => api.get('/attendance/history', { params }),
  getStats: () => api.get('/attendance/stats'),
  getAll: (params) => api.get('/attendance/all', { params }),
};

// ============================================
// LEAVE APIs
// ============================================
export const leaveAPI = {
  apply: (data) => api.post('/leave/apply', data),
  getMyRequests: (params) => api.get('/leave/my-requests', { params }),
  getBalance: () => api.get('/leave/balance'),
  getAllRequests: (params) => api.get('/leave/all-requests', { params }),
  review: (id, data) => api.put(`/leave/${id}/review`, data),
  cancel: (id) => api.delete(`/leave/${id}`),
};

// ============================================
// ADMIN APIs
// ============================================
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getEmployees: (params) => api.get('/admin/employees', { params }),
  createEmployee: (data) => api.post('/admin/employees', data),
  updateEmployee: (id, data) => api.put(`/admin/employees/${id}`, data),
  deactivateEmployee: (id) => api.delete(`/admin/employees/${id}`),
  getAttendanceReport: (params) => api.get('/admin/reports/attendance', { params }),
  getLeaveReport: (params) => api.get('/admin/reports/leave', { params }),
};

export default api;
