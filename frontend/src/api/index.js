import axios from 'axios';
import toast from 'react-hot-toast';

// Vite env vars must be prefixed with VITE_
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' }, timeout: 30000 });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
}, err => Promise.reject(err));

api.interceptors.response.use(res => res, err => {
  const msg = err.response?.data?.message || 'Something went wrong';
  if (err.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!window.location.pathname.includes('/login')) window.location.href = '/login';
  } else if (err.response?.status !== 404) {
    toast.error(msg);
  }
  return Promise.reject(err);
});

export const authAPI = {
  register:      d  => api.post('/auth/register', d),
  login:         d  => api.post('/auth/login', d),
  verifyOtp:     (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resendOtp:     email => api.post('/auth/resend-otp', { email }),
  forgotPassword:email => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

export const expenseAPI = {
  create:  d  => api.post('/expenses', d),
  update:  (id, d) => api.put(`/expenses/${id}`, d),
  delete:  id => api.delete(`/expenses/${id}`),
  getAll:  p  => api.get('/expenses', { params: p }),
  getById: id => api.get(`/expenses/${id}`),
};

export const incomeAPI = {
  create:  d  => api.post('/income', d),
  update:  (id, d) => api.put(`/income/${id}`, d),
  delete:  id => api.delete(`/income/${id}`),
  getAll:  p  => api.get('/income', { params: p }),
  getById: id => api.get(`/income/${id}`),
};

export const categoryAPI = {
  create:  d  => api.post('/categories', d),
  update:  (id, d) => api.put(`/categories/${id}`, d),
  delete:  id => api.delete(`/categories/${id}`),
  getAll:  () => api.get('/categories'),
};

export const budgetAPI = {
  create:  d  => api.post('/budgets', d),
  update:  (id, d) => api.put(`/budgets/${id}`, d),
  delete:  id => api.delete(`/budgets/${id}`),
  getAll:  p  => api.get('/budgets', { params: p }),
  getById: id => api.get(`/budgets/${id}`),
};

export const dashboardAPI = {
  get: p => api.get('/dashboard', { params: p }),
};

// Gemini AI endpoints
export const aiAPI = {
  analyze:     p => api.get('/ai/analyze', { params: p }),
  chat:        d => api.post('/ai/chat', d),
  categorize:  d => api.post('/ai/categorize', d),
  savingTips:  () => api.get('/ai/saving-tips'),
};

export default api;
