import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? 'http://localhost:5001/api' : '/api');

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('hsse-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally → redirect to login
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('hsse-token');
      localStorage.removeItem('hsse-user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const api = {
  // ── Auth ───────────────────────────────────────────────────
  login:  (body) => http.post('/auth/login',  body),
  logout: ()     => http.post('/auth/logout'),
  getMe:  ()     => http.get('/auth/me'),

  // ── Master Data ────────────────────────────────────────────
  getUP3:    ()     => http.get('/master/up3'),
  postUP3:   (body) => http.post('/master/up3', body),
  getULP:    ()     => http.get('/master/ulp'),
  postULP:   (body) => http.post('/master/ulp', body),
  getVendor: ()     => http.get('/master/vendor'),
  postVendor:(body) => http.post('/master/vendor', body),
  getLokasi: ()     => http.get('/master/lokasi'),
  postLokasi:(body) => http.post('/master/lokasi', body),

  // ── Laporan Pengawasan ─────────────────────────────────────
  getLaporan:          (params = {}) => http.get('/laporan', { params }),
  createLaporan:       (body)        => http.post('/laporan', body),
  getLaporanById:      (id)          => http.get(`/laporan/${id}`),
  updateLaporan:       (id, body)    => http.put(`/laporan/${id}`, body),
  updateLaporanStatus: (id, body)    => http.patch(`/laporan/${id}/status`, body),

  // ── SWA ────────────────────────────────────────────────────
  getSWA:      (params = {}) => http.get('/swa', { params }),
  createSWA:   (body)        => http.post('/swa', body),
  getSWAById:  (id)          => http.get(`/swa/${id}`),
  updateSWA:   (id, body)    => http.put(`/swa/${id}`, body),
  deleteSWA:   (id)          => http.delete(`/swa/${id}`),

  // ── Dashboard ──────────────────────────────────────────────
  getDashboardSummary:   (params = {}) => http.get('/dashboard/summary', { params }),
  getDashboardChart:     () => http.get('/dashboard/chart'),
  getDashboardBreakdown: (params = {}) => http.get('/dashboard/breakdown', { params }),

  // ── Users (admin only) ─────────────────────────────────────
  getUsers:    ()         => http.get('/users'),
  createUser:  (body)     => http.post('/users', body),
  updateUser:  (id, body) => http.put(`/users/${id}`, body),
  deleteUser:  (id)       => http.delete(`/users/${id}`),
};
